import type { ClientLogo, Cta } from './homepage';
import type { Seo } from './seo';
import { strapiFetch, type StrapiMedia } from './strapi';

/**
 * Obecná šablona (`page` + dynamic zone `blocks`) a stránka Kontakt (`contact-page` — kontakty, tým, bloky).
 */

export type Background = 'white' | 'grey' | 'black';

type Block<C extends string, T> = { id: number; __component: C } & T;

export type TextBlockData = Block<'blocks.text', { title: string | null; body: string; background: Background | null }>;
export type GalleryBlockData = Block<'blocks.gallery', { title: string | null; images: StrapiMedia[] | null; columns: number | null }>;
export type CtaBlockData = Block<
  'blocks.cta',
  { title: string | null; text: string | null; cta: Cta | null; background: Background | 'yellow' | null }
>;
export type NumberedCard = { id: number; number: string; title: string; text: string | null; image: StrapiMedia | null };
export type CardsBlockData = Block<
  'blocks.cards',
  { title: string | null; text: string | null; items: NumberedCard[]; background: Background | null }
>;
export type TagsBlockData = Block<'blocks.tags', { title: string | null; items: { id: number; label: string }[] }>;
export type LogosBlockData = Block<
  'blocks.logos',
  { title: string | null; text: string | null; cta: Cta | null; moreLabel: string | null; logos: ClientLogo[] }
>;
export type StatsBlockData = Block<'blocks.stats', { items: { id: number; value: string; label: string }[] }>;
export type ImageTextBlockData = Block<
  'blocks.image-text',
  {
    title: string | null;
    body: string | null;
    image: StrapiMedia[] | null;
    imagePosition: 'left' | 'right' | null;
    cta: Cta | null;
    background: Background | null;
  }
>;
export type EventsBlockData = Block<
  'blocks.events',
  { title: string | null; text: string | null; limit: number | null; filter: 'all' | 'upcoming' | 'past' | null; cta: Cta | null }
>;
export type AccordionBlockData = Block<
  'blocks.accordion',
  { title: string | null; items: { id: number; question: string; answer: string }[] }
>;

export type PageBlock =
  | TextBlockData
  | GalleryBlockData
  | CtaBlockData
  | CardsBlockData
  | TagsBlockData
  | LogosBlockData
  | StatsBlockData
  | ImageTextBlockData
  | EventsBlockData
  | AccordionBlockData;

const KNOWN_BLOCKS = new Set<string>([
  'blocks.text',
  'blocks.gallery',
  'blocks.cta',
  'blocks.cards',
  'blocks.tags',
  'blocks.logos',
  'blocks.stats',
  'blocks.image-text',
  'blocks.events',
  'blocks.accordion',
]);

/** Populate dynamic zone: Strapi 5 chce u zóny fragmenty `on` (populate `*` odmítne). */
const BLOCKS_POPULATE = {
  on: {
    'blocks.text': { populate: '*' },
    'blocks.gallery': { populate: ['images'] },
    'blocks.cta': { populate: ['cta'] },
    'blocks.cards': { populate: { items: { populate: ['image'] } } },
    'blocks.tags': { populate: ['items'] },
    'blocks.logos': { populate: { cta: true, logos: { populate: ['logo'] } } },
    'blocks.stats': { populate: ['items'] },
    'blocks.image-text': { populate: ['image', 'cta'] },
    'blocks.events': { populate: ['cta'] },
    'blocks.accordion': { populate: ['items'] },
  },
};

/** Neznámé bloky (nová komponenta v adminu, kterou web ještě neumí) se přeskočí; loga podle `order`. */
const knownBlocks = (blocks: PageBlock[] | null | undefined): PageBlock[] =>
  (blocks ?? [])
    .filter((b) => KNOWN_BLOCKS.has(b.__component))
    .map((b) =>
      b.__component === 'blocks.logos'
        ? { ...b, logos: [...(b.logos ?? [])].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)) }
        : b,
    );

/* --------------------------------------------------------------------- page */

export type Page = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  perex: string | null;
  cover: StrapiMedia | null;
  cta: Cta | null;
  blocks: PageBlock[];
  seo: Seo | null;
};

/**
 * Stránka podle slugu; `null` → 404. Chybu Strapi nepolyká (jako u akcí):
 * při ISR-revalidaci Next nechá předchozí verzi, místo aby zakešoval 404.
 */
export async function getPage(slug: string): Promise<Page | null> {
  const { data } = await strapiFetch<Page[]>('/pages', {
    query: {
      filters: { slug: { $eq: slug } },
      populate: { cover: true, cta: true, blocks: BLOCKS_POPULATE, seo: { populate: ['metaImage'] } },
      pagination: { pageSize: 1 },
    },
    tags: ['pages'],
  });
  const [page] = data;
  return page ? { ...page, blocks: knownBlocks(page.blocks) } : null;
}

export async function getPageSlugs(): Promise<string[]> {
  try {
    const { data } = await strapiFetch<{ slug: string }[]>('/pages', {
      query: { fields: ['slug'], pagination: { pageSize: 100 } },
      tags: ['pages'],
    });
    return data.map((p) => p.slug);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------ contact-page */

export type TeamMember = {
  id: number;
  name: string;
  position: string | null;
  photo: StrapiMedia | null;
  phone: string | null;
  email: string | null;
  order: number | null;
};

type ContactTexts = {
  title: string;
  perex: string;
  teamTitle: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
  mapLabel: string;
};

export type ContactPage = ContactTexts & {
  body: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  team: TeamMember[];
  blocks: PageBlock[];
  seo: Seo | null;
};

const CONTACT_FALLBACK: ContactTexts = {
  title: 'Kontakt',
  perex: 'Plánujete akci, nebo se chcete přidat mezi prodejce? Ozvěte se nám.',
  teamTitle: 'Náš tým',
  emailLabel: 'E-mail',
  phoneLabel: 'Telefon',
  addressLabel: 'Adresa',
  mapLabel: 'Zobrazit na mapě',
};

type Contacts = { phone: string | null; email: string | null; address: string | null };

type ContactApi = { [K in keyof ContactTexts]?: string | null } & Partial<Contacts> & {
  body?: string | null;
  googleMapsUrl?: string | null;
  team?: TeamMember[] | null;
  blocks?: PageBlock[] | null;
  seo?: Seo | null;
};

/** Kontakty ze stránky Kontakt; prázdná pole doplní `global` (telefon, e-mail, adresa). Bez CMS → fallback. */
export async function getContactPage(): Promise<ContactPage> {
  const [page, global] = await Promise.all([
    strapiFetch<ContactApi | null>('/contact-page', {
      query: { populate: { team: { populate: ['photo'] }, blocks: BLOCKS_POPULATE, seo: { populate: ['metaImage'] } } },
      tags: ['contact-page'],
    })
      .then((r) => r.data)
      .catch(() => null),
    strapiFetch<Partial<Contacts> | null>('/global', {
      query: { fields: ['phone', 'email', 'address'] },
      tags: ['global'],
    })
      .then((r) => r.data)
      .catch(() => null),
  ]);

  const keys = Object.keys(CONTACT_FALLBACK) as (keyof ContactTexts)[];
  const texts = Object.fromEntries(keys.map((k) => [k, page?.[k] || CONTACT_FALLBACK[k]])) as ContactTexts;
  return {
    ...texts,
    body: page?.body ?? null,
    phone: page?.phone || global?.phone || null,
    email: page?.email || global?.email || null,
    address: page?.address || global?.address || null,
    googleMapsUrl: page?.googleMapsUrl || null,
    team: [...(page?.team ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    blocks: knownBlocks(page?.blocks),
    seo: page?.seo ?? null,
  };
}
