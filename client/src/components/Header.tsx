import { strapiFetch } from '@/lib/strapi';
import { HeaderNav, type NavLink } from './HeaderNav';

/**
 * Шапка: чёрная, логотип слева, навигация + жёлтая CTA-кнопка справа.
 * Данные — из single type `navigation`; пока в Strapi пусто, работает фолбэк
 * с пунктами из макета.
 */

const FALLBACK_NAV: NavLink[] = [
  { label: 'Akce', url: '/akce' },
  { label: 'Info', url: '/info' },
  { label: 'Kontakt', url: '/kontakt' },
  { label: 'Pro prodejce', url: '/pro-prodejce' },
  { label: 'Pro pořadatele', url: '/pro-poradatele' },
];

const FALLBACK_CTA: NavLink = { label: 'Přihláška', url: '/prihlaska' };

type NavigationData = {
  header?: { label: string; url: string | null }[];
  headerCta?: { label: string; url: string } | null;
};

async function getNavigation(): Promise<{ items: NavLink[]; cta: NavLink }> {
  try {
    const { data } = await strapiFetch<NavigationData>('/navigation', {
      query: { populate: ['header', 'header.children', 'headerCta'] },
      revalidate: 300,
    });
    const items = (data?.header ?? [])
      .filter((i) => i.label)
      .map((i) => ({ label: i.label, url: i.url ?? '#' }));
    return {
      items: items.length > 0 ? items : FALLBACK_NAV,
      cta: data?.headerCta ?? FALLBACK_CTA,
    };
  } catch {
    // Strapi недоступен (dev без CMS) — не роняем сайт
    return { items: FALLBACK_NAV, cta: FALLBACK_CTA };
  }
}

export const Header = async () => {
  const { items, cta } = await getNavigation();
  return <HeaderNav items={items} cta={cta} />;
};
