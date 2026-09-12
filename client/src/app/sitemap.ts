import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { strapiFetch } from '@/lib/strapi';

/** sitemap.xml: hlavní sekce + akce, články a stránky ze Strapi (bez těch s `seo.noIndex`). Obnova po hodině. */

export const revalidate = 3600;

type Entry = { slug: string; updatedAt: string; seo?: { noIndex: boolean | null } | null };

async function entries(collection: 'pages' | 'events' | 'articles'): Promise<Entry[]> {
  const out: Entry[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await strapiFetch<Entry[]>(`/${collection}`, {
      query: { fields: ['slug', 'updatedAt'], populate: { seo: { fields: ['noIndex'] } }, pagination: { page, pageSize: 100 } },
      revalidate: 3600,
    });
    out.push(...data.filter((e) => !e.seo?.noIndex));
    if (page >= (meta.pagination?.pageCount ?? 1)) return out;
  }
}

const url = (path: string) => `${SITE_URL}${path}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Strapi nedostupné → aspoň hlavní sekce
  const [pages, events, articles] = await Promise.all([
    entries('pages').catch(() => []),
    entries('events').catch(() => []),
    entries('articles').catch(() => []),
  ]);

  return [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    { url: url('/akce'), changeFrequency: 'daily', priority: 0.9 },
    { url: url('/prihlaska'), changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/novinky'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/kontakt'), changeFrequency: 'yearly', priority: 0.6 },
    ...events.map((e) => ({ url: url(`/akce/${e.slug}`), lastModified: e.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...articles.map((a) => ({ url: url(`/novinky/${a.slug}`), lastModified: a.updatedAt, priority: 0.6 })),
    ...pages.map((p) => ({ url: url(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
  ];
}
