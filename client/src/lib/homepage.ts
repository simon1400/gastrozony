import { strapiFetch, type StrapiMedia } from './strapi';

/**
 * Single type `homepage` + чешский фолбэк (тексты макета) — HP живёт и без CMS.
 */

export type Cta = { label: string; url: string; variant: 'primary' | 'outline' | 'dark'; newTab: boolean };
export type ClientLogo = { id: number; name: string; url: string | null; order: number | null; logo: StrapiMedia | null };

export type Homepage = {
  hero: { title: string; perex: string | null; ctas: Cta[] };
  stats: { value: string; label: string }[];
  intro: { title: string; text: string | null };
  cards: { number: string; title: string; text: string | null }[];
  tagsTitle: string;
  tags: { label: string }[];
  clients: { title: string; text: string | null; moreLabel: string | null; cta: Cta | null; logos: ClientLogo[] };
  events: { title: string; text: string | null; limit: number; cta: Cta | null };
  seo: { metaTitle: string | null; metaDescription: string | null } | null;
};

const cta = (label: string, url: string, variant: Cta['variant'] = 'primary'): Cta => ({
  label,
  url,
  variant,
  newTab: false,
});

const FALLBACK: Homepage = {
  hero: {
    title: '**Gastrozóny** pro každou příležitost',
    perex:
      'Bez pořádného občerstvení se neobejde žádná dobrá akce. Postavíme vám gastrozónu, na kterou se lidé budou chtít vracet — od dvou stánků po celé food městečko.',
    ctas: [cta('Přihlásit se na akci', '/prihlaska'), cta('Jak to funguje', '/info', 'outline')],
  },
  stats: [
    { value: '120+', label: 'Odbavených akcí' },
    { value: '8 let', label: 'Na festivalové scéně' },
    { value: '50K', label: 'Nakrmených hostů ročně' },
  ],
  intro: {
    title: 'Dodáme **jídlo i nápoje** pro vaše akce',
    text: 'Gastrozóna je kompletní jídelní část vaší akce — vybrané food trucky a stánky, technika, obsluha i logistika. Vy řešíte program, my to, co lidi drží na místě.\n\nCatering bývá to první, co návštěvníci kritizují, a často rozhoduje, jestli se na akci vrátí. Proto hlídáme kvalitu, čerstvost a to, aby fronty netekly do programu.',
  },
  cards: [
    { number: '01', title: 'Kvalitní street food', text: 'Vybíráme provozovatele, kteří umí odbavit nápor a nesleví z kvality. Žádné náhodné stánky.' },
    { number: '02', title: 'Vše na klíč', text: 'Skladba nabídky, rozvržení zóny, přípojky, odpad, hygiena i platby. Přijedete a je to postavené.' },
    { number: '03', title: 'Zvládneme velké akce', text: 'Festivaly pro desetitisíce lidí i firemní den pro dvě stě. Kapacitu plánujeme podle návštěvnosti.' },
  ],
  tagsTitle: 'Stavíme pro:',
  tags: ['Festivaly', 'Dětské dny', 'Teambuildingy', 'Konference', 'Svatby'].map((label) => ({ label })),
  clients: {
    title: 'Jsme tu pro **náročné klienty**',
    text: 'Cateringu se věnujeme řadu let a dbáme, aby naše služby byly vždy na nejvyšší úrovni. Nejlépe to potvrzují klienti, kteří se k nám pravidelně vracejí a gastrozónou doplňují své povedené akce.',
    moreLabel: 'a další...',
    cta: cta('Kontaktujte nás', '/kontakt'),
    logos: [],
  },
  events: {
    title: 'Aktuální **akce**',
    text: 'Hledáme prodejce jídla a nápojů na sezónu 2026. Vyber si akci, přihlas se a my se ozveme s podmínkami i rozvržením zóny.',
    limit: 3,
    cta: cta('Všechny akce', '/akce'),
  },
  seo: null,
};

type HomepageApi = { [K in keyof Homepage]?: Homepage[K] | null };

export async function getHomepage(): Promise<Homepage> {
  try {
    const { data } = await strapiFetch<HomepageApi | null>('/homepage', {
      query: {
        populate: {
          hero: { populate: ['ctas'] },
          stats: true,
          intro: true,
          cards: true,
          tags: true,
          clients: { populate: { cta: true, logos: { populate: ['logo'] } } },
          events: { populate: ['cta'] },
          seo: true,
        },
      },
      tags: ['homepage'],
    });
    if (!data) return FALLBACK;
    const clients = data.clients ?? FALLBACK.clients;
    return {
      hero: data.hero ?? FALLBACK.hero,
      stats: data.stats?.length ? data.stats : FALLBACK.stats,
      intro: data.intro ?? FALLBACK.intro,
      cards: data.cards?.length ? data.cards : FALLBACK.cards,
      tagsTitle: data.tagsTitle ?? FALLBACK.tagsTitle,
      tags: data.tags?.length ? data.tags : FALLBACK.tags,
      clients: {
        ...clients,
        logos: [...(clients.logos ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      },
      events: data.events ?? FALLBACK.events,
      seo: data.seo ?? null,
    };
  } catch {
    return FALLBACK;
  }
}

/** Текст из textarea → абзацы (разделитель — пустая строка). */
export const paragraphs = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
