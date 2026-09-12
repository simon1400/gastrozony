import type { Seo } from './seo';
import { strapiFetch, type StrapiMedia } from './strapi';

/**
 * Акции: загрузка из Strapi + статус по датам (docs/brainstorm.md §3).
 * Используется на HP (блок «Aktuální akce»), на /akce и /akce/[slug].
 */

export type EventStatus = 'aktualni' | 'pripravujeme' | 'ukonceno';
export type CapacityState = 'volno' | 'posledni-mista' | 'obsazeno' | 'nahradnik';

/** Подписи значений enum `capacityState` (как STATUS_LABELS у бейджа). */
export const CAPACITY_LABELS: Record<CapacityState, string> = {
  volno: 'Volná místa',
  'posledni-mista': 'Poslední volná místa',
  obsazeno: 'Obsazeno',
  nahradnik: 'Přijímáme náhradníky',
};

export type EventSummary = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  perex: string | null;
  place: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  cover: StrapiMedia | null;
  status: EventStatus;
};

export type EventDetail = EventSummary & {
  content: string | null;
  gallery: StrapiMedia[];
  applicationOpen: boolean;
  capacityState: CapacityState | null;
  googleMapsUrl: string | null;
  seo: Seo | null;
};

type StatusFields = { dateFrom: string | null; dateTo: string | null; statusOverride: EventStatus | null };
type EventApi = Omit<EventSummary, 'status'> & StatusFields;
type EventDetailApi = Omit<EventDetail, 'status' | 'gallery'> & StatusFields & { gallery: StrapiMedia[] | null };

/** Сегодня в Праге как YYYY-MM-DD (сервер может жить в UTC). */
const todayPrague = (): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague' }).format(new Date());

/** Статус акции по датам; override из админки важнее. */
export const resolveEventStatus = (
  dateFrom: string | null,
  dateTo: string | null,
  override?: EventStatus | null,
): EventStatus => {
  if (override) return override;
  const today = todayPrague();
  const to = dateTo ?? dateFrom;
  if (to && to < today) return 'ukonceno';
  if (dateFrom && dateFrom <= today) return 'aktualni';
  return 'pripravujeme';
};

function withStatus<T extends StatusFields>(e: T): Omit<T, 'statusOverride'> & { status: EventStatus } {
  const { statusOverride, ...rest } = e;
  return { ...rest, status: resolveEventStatus(e.dateFrom, e.dateTo, statusOverride) };
}

export async function getEvents(): Promise<EventSummary[]> {
  try {
    const { data } = await strapiFetch<EventApi[]>('/events', {
      query: {
        fields: ['title', 'slug', 'perex', 'place', 'dateFrom', 'dateTo', 'statusOverride'],
        populate: ['cover'],
        sort: ['dateFrom:asc', 'order:asc'],
        pagination: { pageSize: 100 },
      },
      tags: ['events'],
    });
    return data.map(withStatus);
  } catch {
    // Strapi недоступен — секция просто пустая
    return [];
  }
}

/**
 * Детальная акция по slug; `null` → 404. Ошибку Strapi не глотаем:
 * при ISR-ревалидации Next тогда оставит прежнюю версию страницы, а не закэширует 404.
 */
export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  const { data } = await strapiFetch<EventDetailApi[]>('/events', {
    query: {
      filters: { slug: { $eq: slug } },
      populate: { cover: true, gallery: true, seo: { populate: ['metaImage'] } },
      pagination: { pageSize: 1 },
    },
    tags: ['events'],
  });
  const [event] = data;
  return event ? withStatus({ ...event, gallery: event.gallery ?? [] }) : null;
}

export type OpenEvent = Pick<EventSummary, 'documentId' | 'title' | 'slug' | 'place' | 'dateFrom' | 'dateTo'>;

/**
 * Akce, na které se dá přihlásit (/prihlaska): `applicationOpen` a neskončila (i podle override).
 * Chybu Strapi nepolyká — formulář bez seznamu akcí nemá smysl zobrazit ani přijmout.
 */
export async function getOpenEvents(): Promise<OpenEvent[]> {
  const { data } = await strapiFetch<(OpenEvent & StatusFields)[]>('/events', {
    query: {
      fields: ['title', 'slug', 'place', 'dateFrom', 'dateTo', 'statusOverride'],
      filters: { applicationOpen: { $eq: true } },
      sort: ['dateFrom:asc', 'order:asc'],
      pagination: { pageSize: 100 },
    },
    tags: ['events'],
  });
  return data.filter((e) => withStatus(e).status !== 'ukonceno').map(({ documentId, title, slug, place, dateFrom, dateTo }) => ({
    documentId,
    title,
    slug,
    place,
    dateFrom,
    dateTo,
  }));
}

const byDateFrom = (a: EventSummary, b: EventSummary) =>
  (a.dateFrom ?? '9999').localeCompare(b.dateFrom ?? '9999');

/** Акции по статусам: aktuální и připravujeme — по дате начала, proběhlé — последние сверху. */
export const groupByStatus = (events: EventSummary[]): Record<EventStatus, EventSummary[]> => {
  const groups: Record<EventStatus, EventSummary[]> = { aktualni: [], pripravujeme: [], ukonceno: [] };
  for (const e of events) groups[e.status].push(e);
  groups.aktualni.sort(byDateFrom);
  groups.pripravujeme.sort(byDateFrom);
  groups.ukonceno.sort((a, b) => byDateFrom(b, a));
  return groups;
};

/** Ближайшие акции: сначала aktuální, потом připravujeme, внутри — по дате начала. */
export async function getUpcomingEvents(limit: number): Promise<EventSummary[]> {
  const { aktualni, pripravujeme } = groupByStatus(await getEvents());
  return [...aktualni, ...pripravujeme].slice(0, limit);
}

/**
 * Termín po česku: «17. 10. 2026», «10.–13. 9. 2026», «18. 7. – 2. 8. 2026», «30. 12. 2026 – 2. 1. 2027».
 * Ručně, ne přes Intl: ICU pro `cs` dává podle voleb «10.09.2026 – 13.09.2026».
 */
export const formatEventDate = (from: string | null, to: string | null): string | null => {
  if (!from) return null;
  const [y1, m1, d1] = from.split('-').map(Number);
  if (!to || to === from) return `${d1}. ${m1}. ${y1}`;
  const [y2, m2, d2] = to.split('-').map(Number);
  if (y1 !== y2) return `${d1}. ${m1}. ${y1} – ${d2}. ${m2}. ${y2}`;
  if (m1 !== m2) return `${d1}. ${m1}. – ${d2}. ${m2}. ${y2}`;
  return `${d1}.–${d2}. ${m2}. ${y2}`;
};

/* ------------------------------------------------ single type `events-page` */

export type EventsPageTexts = {
  title: string;
  perex: string;
  emptyText: string;
  tabCurrentLabel: string;
  tabUpcomingLabel: string;
  tabPastLabel: string;
  applyLabel: string;
  applicationClosedText: string;
  dateLabel: string;
  placeLabel: string;
  capacityLabel: string;
  mapLabel: string;
  galleryTitle: string;
  backLabel: string;
};

export type EventsPage = EventsPageTexts & { seo: Seo | null };

const PAGE_FALLBACK: EventsPageTexts = {
  title: 'Naše **akce**',
  perex:
    'Festivaly a akce, na které hledáme prodejce jídla a nápojů. Vyberte si termín, přihlaste se a my se ozveme s podmínkami i rozvržením zóny.',
  emptyText: 'V této kategorii teď žádné akce nemáme. Přihlaste se k odběru novinek a dáme vám vědět.',
  tabCurrentLabel: 'Aktuální',
  tabUpcomingLabel: 'Připravujeme',
  tabPastLabel: 'Proběhlé',
  applyLabel: 'Přihlásit se na tuto akci',
  applicationClosedText: 'Přihlášky na tuto akci jsou uzavřené.',
  dateLabel: 'Termín',
  placeLabel: 'Místo',
  capacityLabel: 'Kapacita',
  mapLabel: 'Zobrazit na mapě',
  galleryTitle: 'Galerie',
  backLabel: 'Všechny akce',
};

type EventsPageApi = { [K in keyof EventsPageTexts]?: string | null } & { seo?: Seo | null };

export async function getEventsPage(): Promise<EventsPage> {
  try {
    const { data } = await strapiFetch<EventsPageApi | null>('/events-page', {
      query: { populate: { seo: { populate: ['metaImage'] } } },
      tags: ['events-page'],
    });
    const keys = Object.keys(PAGE_FALLBACK) as (keyof EventsPageTexts)[];
    const texts = Object.fromEntries(keys.map((k) => [k, data?.[k] || PAGE_FALLBACK[k]])) as EventsPageTexts;
    return { ...texts, seo: data?.seo ?? null };
  } catch {
    return { ...PAGE_FALLBACK, seo: null };
  }
}
