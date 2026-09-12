import { formatEventDate } from './events';
import { contactFieldNames, type FormDefinition } from './form-schema';
import { strapiFetch, type StrapiMedia } from './strapi';

/**
 * Přihlášky pro interní správu (/sprava/prihlasky) — jen na serveru, serverovým tokenem, bez cache.
 * Stav se mění v adminu Strapi; tady jen výpis, filtr a export.
 */

export const APPLICATION_PAGE_SIZE = 50;

export const APPLICATION_STATUSES = {
  nova: 'Nová',
  kontaktovana: 'Kontaktovaná',
  schvalena: 'Schválená',
  zamitnuta: 'Zamítnutá',
} as const;

export type ApplicationStatus = keyof typeof APPLICATION_STATUSES;

const isStatus = (value: unknown): value is ApplicationStatus => typeof value === 'string' && value in APPLICATION_STATUSES;

export type ApplicationEvent = { title: string; slug: string; place: string | null; dateFrom: string | null; dateTo: string | null };

export type ApplicationRow = {
  id: number;
  documentId: string;
  createdAt: string;
  formKey: string;
  contactName: string | null;
  contactEmail: string | null;
  status: ApplicationStatus;
  note: string | null;
  mailSent: boolean | null;
  event: ApplicationEvent | null;
  attachments: StrapiMedia[] | null;
  result: { key: string; label: string | null; value: string | null }[] | null;
};

export type ApplicationFilters = { akce: string | null; status: ApplicationStatus | null };

type Params = Record<string, string | string[] | undefined>;

const single = (value: string | string[] | undefined) => (typeof value === 'string' ? value : undefined);

export const parseFilters = (params: Params): ApplicationFilters => {
  const akce = single(params.akce)?.trim();
  const status = single(params.status);
  return { akce: akce || null, status: isStatus(status) ? status : null };
};

/** Query string filtru (+ další parametry), bez prázdných hodnot. */
export const filtersQuery = (filters: ApplicationFilters, extra: Record<string, string> = {}) =>
  new URLSearchParams({
    ...(filters.akce ? { akce: filters.akce } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...extra,
  }).toString();

const strapiQuery = (filters: ApplicationFilters, page: number, pageSize: number) => ({
  filters: {
    ...(filters.akce ? { event: { slug: { $eq: filters.akce } } } : {}),
    ...(filters.status ? { status: { $eq: filters.status } } : {}),
  },
  populate: { event: { fields: ['title', 'slug', 'place', 'dateFrom', 'dateTo'] }, attachments: true, result: true },
  sort: ['createdAt:desc'],
  pagination: { page, pageSize },
});

export async function getApplications(filters: ApplicationFilters, page: number) {
  const { data, meta } = await strapiFetch<ApplicationRow[]>('/applications', {
    query: strapiQuery(filters, page, APPLICATION_PAGE_SIZE),
    revalidate: 0,
  });
  return {
    rows: data,
    total: meta.pagination?.total ?? data.length,
    pageCount: Math.max(1, meta.pagination?.pageCount ?? 1),
  };
}

/** Všechny přihlášky odpovídající filtru (export CSV) — po 100 kusech. */
export async function getAllApplications(filters: ApplicationFilters): Promise<ApplicationRow[]> {
  const rows: ApplicationRow[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await strapiFetch<ApplicationRow[]>('/applications', {
      query: strapiQuery(filters, page, 100),
      revalidate: 0,
    });
    rows.push(...data);
    if (page >= (meta.pagination?.pageCount ?? 1)) return rows;
  }
}

export type ResultColumn = { key: string; label: string };

/**
 * Sloupce z `result[]` v pořadí polí formuláře. Bez nahrávání souborů (jsou ve sloupci „Přílohy“)
 * a bez kontaktních polí (vlastní sloupce Jméno / E-mail). Klíče, které ve formuláři už nejsou
 * (pole smazané v adminu), se připojí na konec podle uložených přihlášek.
 */
export function resultColumns(form: FormDefinition | null, rows: ApplicationRow[]): ResultColumn[] {
  const skip = new Set<string>();
  const columns: ResultColumn[] = [];
  if (form) {
    const contact = contactFieldNames(form);
    if (contact.email) skip.add(contact.email);
    if (contact.name) skip.add(contact.name);
    for (const field of form.fields) {
      if (field.__component === 'form.upload') skip.add(field.name);
      else if (!skip.has(field.name)) columns.push({ key: field.name, label: field.label });
    }
  }
  const known = new Set(columns.map((c) => c.key));
  for (const row of rows) {
    for (const item of row.result ?? []) {
      if (known.has(item.key) || skip.has(item.key)) continue;
      known.add(item.key);
      columns.push({ key: item.key, label: item.label || item.key });
    }
  }
  return columns;
}

export const resultValue = (row: ApplicationRow, key: string) => row.result?.find((i) => i.key === key)?.value ?? '';

/** «HIP HOP ŽIJE! 2026 · 17. 10. 2026 · Bratislava» — titulky akcí se opakují (turné), proto datum i místo. */
export const eventLabel = (event: ApplicationEvent | null) =>
  event ? [event.title, formatEventDate(event.dateFrom, event.dateTo), event.place].filter(Boolean).join(' · ') : '';

const DATE_TIME = new Intl.DateTimeFormat('cs-CZ', {
  timeZone: 'Europe/Prague',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso));

/** Odkaz na záznam v adminu Strapi (STRAPI_ADMIN_URL = veřejná adresa Strapi, v dev stačí STRAPI_URL). */
export const strapiAdminUrl = (documentId: string) =>
  `${(process.env.STRAPI_ADMIN_URL || process.env.STRAPI_URL || 'http://127.0.0.1:1337').replace(/\/$/, '')}` +
  `/admin/content-manager/collection-types/api::application.application/${documentId}`;
