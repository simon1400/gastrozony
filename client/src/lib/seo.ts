import type { Metadata } from 'next';
import { cache } from 'react';
import { stripFlecks } from './flecks';
import { mediaUrl, strapiFetch, type StrapiMedia } from './strapi';

/** Veřejná adresa webu (metadataBase, sitemap, JSON-LD). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gastrozony.cz').replace(/\/$/, '');
export const SITE_NAME = 'Gastrozóny';

/** Výchozí OG obrázek (scripts/gen-icons.mjs), když ho nemá stránka ani `global.defaultSeo`. */
export const DEFAULT_OG_IMAGE = '/og-default.png';

/** Komponenta `shared.seo` ze Strapi. */
export type Seo = {
  metaTitle: string | null;
  metaDescription: string | null;
  metaImage?: StrapiMedia | null;
  keywords?: string | null;
  noIndex?: boolean | null;
};

type DefaultSeo = { siteName: string; description: string | null; image: string | null };

/** `global.siteName` + `global.defaultSeo` — jednou za request (React cache), fetch s ISR cache. */
export const getDefaultSeo = cache(async (): Promise<DefaultSeo> => {
  try {
    const { data } = await strapiFetch<{ siteName?: string | null; defaultSeo?: Seo | null } | null>('/global', {
      query: { fields: ['siteName'], populate: { defaultSeo: { populate: ['metaImage'] } } },
      revalidate: 300,
      tags: ['global'],
    });
    return {
      siteName: data?.siteName || SITE_NAME,
      description: data?.defaultSeo?.metaDescription ?? null,
      image: mediaUrl(data?.defaultSeo?.metaImage),
    };
  } catch {
    return { siteName: SITE_NAME, description: null, image: null };
  }
});

type SeoFallback = {
  title: string;
  description?: string | null;
  image?: StrapiMedia | null;
  /** Kanonická cesta stránky (`/akce/…`) — canonical + og:url. */
  path?: string;
};

/**
 * Metadata stránky ze `seo`. Prázdná pole → titulek / perex / obálka obsahu → `global.defaultSeo` → výchozí OG obrázek.
 * openGraph se v Next nedědí po položkách (potomek ho přepíše celý), proto tu vždy celý: siteName, locale, obrázek.
 */
export async function seoMetadata(seo: Seo | null | undefined, fallback: SeoFallback): Promise<Metadata> {
  const defaults = await getDefaultSeo();
  const title = seo?.metaTitle || stripFlecks(fallback.title);
  const description = seo?.metaDescription || fallback.description || defaults.description || undefined;
  const image = mediaUrl(seo?.metaImage ?? fallback.image) ?? defaults.image ?? DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    keywords: seo?.keywords || undefined,
    robots: seo?.noIndex ? { index: false, follow: true } : undefined,
    ...(fallback.path ? { alternates: { canonical: fallback.path } } : {}),
    openGraph: {
      type: 'website',
      locale: 'cs_CZ',
      siteName: defaults.siteName,
      title,
      description,
      ...(fallback.path ? { url: fallback.path } : {}),
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
