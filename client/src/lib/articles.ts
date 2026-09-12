import { formatEventDate } from './events';
import type { Seo } from './seo';
import { strapiFetch, type StrapiMedia } from './strapi';

/** Blog / novinky: výpis se stránkováním, detail, „další články“ a texty single type `blog-page`. */

export const ARTICLES_PER_PAGE = 9;

export type ArticleSummary = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  perex: string | null;
  date: string | null;
  publishedAt: string | null;
  cover: StrapiMedia | null;
};

export type ArticleDetail = ArticleSummary & { content: string | null; seo: Seo | null };

const SUMMARY_FIELDS = ['title', 'slug', 'perex', 'date', 'publishedAt'];
const SORT = ['date:desc', 'publishedAt:desc'];

/** Datum článku YYYY-MM-DD: pole `date` (lifecycle ho doplní), jinak den publikace v Praze. */
export const articleDate = (a: Pick<ArticleSummary, 'date' | 'publishedAt'>): string | null =>
  a.date ??
  (a.publishedAt ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague' }).format(new Date(a.publishedAt)) : null);

/** «1. 9. 2026» — stejný formát jako termíny akcí. */
export const formatArticleDate = (date: string) => formatEventDate(date, null) ?? date;

export type ArticlePage = { articles: ArticleSummary[]; pageCount: number };

export async function getArticles(page = 1): Promise<ArticlePage> {
  try {
    const { data, meta } = await strapiFetch<ArticleSummary[]>('/articles', {
      query: {
        fields: SUMMARY_FIELDS,
        populate: ['cover'],
        sort: SORT,
        pagination: { page, pageSize: ARTICLES_PER_PAGE },
      },
      tags: ['articles'],
    });
    return { articles: data, pageCount: Math.max(1, meta.pagination?.pageCount ?? 1) };
  } catch {
    return { articles: [], pageCount: 1 };
  }
}

/** Detail podle slugu; `null` → 404. Chybu Strapi nepolyká (ISR ponechá předchozí verzi). */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const { data } = await strapiFetch<ArticleDetail[]>('/articles', {
    query: {
      filters: { slug: { $eq: slug } },
      populate: { cover: true, seo: { populate: ['metaImage'] } },
      pagination: { pageSize: 1 },
    },
    tags: ['articles'],
  });
  return data[0] ?? null;
}

/** Nejnovější články kromě aktuálního — blok „Další články“ pod detailem. */
export async function getOtherArticles(slug: string, limit = 3): Promise<ArticleSummary[]> {
  try {
    const { data } = await strapiFetch<ArticleSummary[]>('/articles', {
      query: {
        fields: SUMMARY_FIELDS,
        populate: ['cover'],
        filters: { slug: { $ne: slug } },
        sort: SORT,
        pagination: { pageSize: limit },
      },
      tags: ['articles'],
    });
    return data;
  } catch {
    return [];
  }
}

export async function getArticleSlugs(): Promise<string[]> {
  try {
    const { data } = await strapiFetch<{ slug: string }[]>('/articles', {
      query: { fields: ['slug'], pagination: { pageSize: 100 } },
      tags: ['articles'],
    });
    return data.map((a) => a.slug);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------ single type `blog-page` */

export type BlogPageTexts = {
  title: string;
  perex: string;
  emptyText: string;
  backLabel: string;
  moreTitle: string;
  prevLabel: string;
  nextLabel: string;
};

export type BlogPage = BlogPageTexts & { seo: Seo | null };

const PAGE_FALLBACK: BlogPageTexts = {
  title: 'Novinky',
  perex: 'Nové akce, otevřené přihlášky a tipy pro prodejce.',
  emptyText: 'Zatím tu nejsou žádné články. Přihlaste se k odběru novinek a nic vám neuteče.',
  backLabel: 'Všechny novinky',
  moreTitle: 'Další články',
  prevLabel: 'Předchozí',
  nextLabel: 'Další',
};

type BlogPageApi = { [K in keyof BlogPageTexts]?: string | null } & { seo?: Seo | null };

export async function getBlogPage(): Promise<BlogPage> {
  try {
    const { data } = await strapiFetch<BlogPageApi | null>('/blog-page', {
      query: { populate: { seo: { populate: ['metaImage'] } } },
      tags: ['blog-page'],
    });
    const keys = Object.keys(PAGE_FALLBACK) as (keyof BlogPageTexts)[];
    const texts = Object.fromEntries(keys.map((k) => [k, data?.[k] || PAGE_FALLBACK[k]])) as BlogPageTexts;
    return { ...texts, seo: data?.seo ?? null };
  } catch {
    return { ...PAGE_FALLBACK, seo: null };
  }
}
