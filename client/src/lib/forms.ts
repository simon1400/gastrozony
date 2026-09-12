import { FIELD_COMPONENTS, type FormDefinition, type FormField, type FormKey } from './form-schema';
import type { Seo } from './seo';
import { strapiFetch } from './strapi';

/** Formulář, texty stránky /prihlaska a příjemci kopií přihlášek — vše ze Strapi, jen na serveru. */

type FormApi = Omit<FormDefinition, 'fields' | 'requiresEvent'> & {
  fields: FormField[] | null;
  requiresEvent: boolean | null;
};

/** Název pole = klíč v `result[]` a v react-hook-form (tečka by se četla jako cesta) — jen písmena, číslice, _ a -. */
const VALID_NAME = /^[A-Za-z][\w-]*$/;

/** Definice formuláře; `null` = Strapi nedostupné nebo formulář neexistuje. Neznámá / vadná pole se přeskočí. */
export async function getForm(key: FormKey): Promise<FormDefinition | null> {
  try {
    const { data } = await strapiFetch<FormApi[]>('/forms', {
      query: {
        filters: { key: { $eq: key } },
        populate: { fields: { populate: '*' }, consent: true },
        pagination: { pageSize: 1 },
      },
      tags: ['forms'],
    });
    const [form] = data;
    if (!form) return null;

    const seen = new Set<string>();
    const fields = (form.fields ?? []).filter((f) => {
      const ok =
        FIELD_COMPONENTS.includes(f.__component) && VALID_NAME.test(f.name) && !f.name.startsWith('gz_') && !seen.has(f.name);
      if (ok) seen.add(f.name);
      else console.warn(`[forms] ${key}: pole „${f.name}“ (${f.__component}) přeskočeno — neplatný nebo duplicitní název`);
      return ok;
    });
    return { key: form.key, name: form.name, requiresEvent: Boolean(form.requiresEvent), fields, consent: form.consent ?? null };
  } catch (e) {
    console.error('[forms] strapi error', e);
    return null;
  }
}

/* ---------------------------------------------- single type `application-page` */

export type ApplicationPageTexts = {
  title: string;
  perex: string;
  contentBefore: string;
  contentAfter: string;
  eventSelectLabel: string;
  eventPlaceholder: string;
  noEventsText: string;
  uploadLabel: string;
  submitLabel: string;
  successTitle: string;
  successText: string;
  errorText: string;
  rateLimitText: string;
};

export type ApplicationPage = ApplicationPageTexts & { seo: Seo | null };

const PAGE_FALLBACK: ApplicationPageTexts = {
  title: 'Přihláška pro **prodejce**',
  perex: 'Vyberte akci, vyplňte údaje o stánku a my se ozveme s podmínkami i rozvržením zóny. Přihláška je nezávazná.',
  contentBefore: '',
  contentAfter: '',
  eventSelectLabel: 'Vyberte akci',
  eventPlaceholder: '— vyberte akci —',
  noEventsText:
    'Momentálně nepřijímáme přihlášky na žádnou akci. Přihlaste se k odběru novinek a dáme vám vědět, jakmile otevřeme další.',
  uploadLabel: 'Vybrat soubory',
  submitLabel: 'Odeslat přihlášku',
  successTitle: 'Děkujeme!',
  successText: 'Přihlášku jsme přijali. Do několika dnů se vám ozveme s podmínkami a rozvržením zóny.',
  errorText: 'Přihlášku se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám napište na info@gastrozony.cz.',
  rateLimitText: 'Odeslali jste příliš mnoho přihlášek za sebou. Zkuste to prosím znovu za pár minut.',
};

type ApplicationPageApi = { [K in keyof ApplicationPageTexts]?: string | null } & { seo?: Seo | null };

export async function getApplicationPage(): Promise<ApplicationPage> {
  try {
    const { data } = await strapiFetch<ApplicationPageApi | null>('/application-page', {
      query: { populate: { seo: { populate: ['metaImage'] } } },
      tags: ['application-page'],
    });
    const keys = Object.keys(PAGE_FALLBACK) as (keyof ApplicationPageTexts)[];
    const texts = Object.fromEntries(keys.map((k) => [k, data?.[k] || PAGE_FALLBACK[k]])) as ApplicationPageTexts;
    return { ...texts, seo: data?.seo ?? null };
  } catch {
    return { ...PAGE_FALLBACK, seo: null };
  }
}

/* ------------------------------------------- texty potvrzovacího e-mailu */

export type ApplicationMailTexts = {
  subject: string;
  greeting: string;
  intro: string;
  eventLabel: string;
  fieldsTitle: string;
  note: string;
};

/** Neměnné drobnosti šablony (v administraci se needitují) + fallbacky polí ze `application-page`. */
const MAIL_FALLBACK: ApplicationMailTexts = {
  subject: 'Přijali jsme vaši přihlášku',
  greeting: 'Dobrý den',
  intro: 'děkujeme za přihlášku. Prošli jsme ji a ozveme se vám s podmínkami i rozvržením zóny. Níže posíláme přehled toho, co jste vyplnili.',
  eventLabel: 'Akce',
  fieldsTitle: 'Vaše odpovědi',
  note: 'Na tuto zprávu prosím neodpovídejte — je odeslána automaticky. S dotazy nám napište na info@gastrozony.cz.',
};

/** Texty potvrzovacího e-mailu; volá se jen ze serveru (`lib/mailer.ts`). */
export async function getApplicationMailTexts(): Promise<ApplicationMailTexts> {
  try {
    const { data } = await strapiFetch<{ mailSubject?: string | null; mailIntro?: string | null; mailNote?: string | null } | null>(
      '/application-page',
      { query: { fields: ['mailSubject', 'mailIntro', 'mailNote'] }, tags: ['application-page'] },
    );
    return {
      ...MAIL_FALLBACK,
      subject: data?.mailSubject || MAIL_FALLBACK.subject,
      intro: data?.mailIntro || MAIL_FALLBACK.intro,
      note: data?.mailNote || MAIL_FALLBACK.note,
    };
  } catch {
    return MAIL_FALLBACK;
  }
}

/** Kopie přihlášek týmu — `global.applicationRecipients` (e-maily oddělené čárkou / středníkem / řádkem). */
export async function getTeamRecipients(): Promise<string[]> {
  try {
    const { data } = await strapiFetch<{ applicationRecipients: string | null } | null>('/global', {
      query: { fields: ['applicationRecipients'] },
      tags: ['global'],
    });
    return (data?.applicationRecipients ?? '').split(/[\s,;]+/).filter((s) => s.includes('@'));
  } catch {
    return [];
  }
}
