import Image from 'next/image';
import Link from 'next/link';
import { getCookieTexts } from '@/lib/cookie-texts';
import { strapiFetch } from '@/lib/strapi';
import { CookieSettingsButton } from './CookieSettingsButton';
import { SectionEdge } from './SectionEdge';

/**
 * Патичка. В макете отсутствует (подтверждено письмом) — «pár sloupců a odkazy,
 * sociální sítě atd». Тёмная, с той же волной сверху, что у секции «Aktuální akce».
 * Данные из `navigation` (колонки, правовые ссылки) + `global` (контакты, соцсети),
 * с фолбэком, пока CMS пустая.
 */

type FooterLink = { label: string; url: string };
type FooterColumn = { title: string; links: FooterLink[] };
type Social = { platform: string; url: string };

const FALLBACK_COLUMNS: FooterColumn[] = [
  {
    title: 'Menu',
    links: [
      { label: 'Akce', url: '/akce' },
      { label: 'Kontakt', url: '/kontakt' },
      { label: 'Pro prodejce', url: '/pro-prodejce' },
      { label: 'Pro pořadatele', url: '/pro-poradatele' },
    ],
  },
  {
    title: 'Přihláška',
    links: [{ label: 'Přihlásit se na akci', url: '/prihlaska' }],
  },
];

const FALLBACK_LEGAL: FooterLink[] = [
  { label: 'Ochrana osobních údajů', url: '/ochrana-osobnich-udaju' },
  { label: 'Cookies', url: '/cookies' },
];

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X',
};

type FooterData = {
  columns: FooterColumn[];
  note: string | null;
  legal: FooterLink[];
  phone: string | null;
  email: string | null;
  socials: Social[];
};

async function getFooterData(): Promise<FooterData> {
  try {
    const [nav, global] = await Promise.all([
      strapiFetch<{
        footerColumns?: { title: string; links?: FooterLink[] }[];
        footerNote?: string | null;
        footerLegal?: FooterLink[];
      }>('/navigation', {
        query: { populate: ['footerColumns', 'footerColumns.links', 'footerLegal'] },
        revalidate: 300,
      }),
      strapiFetch<{ phone?: string | null; email?: string | null; socials?: Social[] }>('/global', {
        query: { populate: ['socials'] },
        revalidate: 300,
      }),
    ]);
    const columns = (nav.data?.footerColumns ?? [])
      .map((c) => ({ title: c.title, links: c.links ?? [] }))
      .filter((c) => c.links.length > 0);
    const legal = nav.data?.footerLegal ?? [];
    return {
      columns: columns.length > 0 ? columns : FALLBACK_COLUMNS,
      note: nav.data?.footerNote ?? null,
      legal: legal.length > 0 ? legal : FALLBACK_LEGAL,
      phone: global.data?.phone ?? null,
      email: global.data?.email ?? null,
      socials: global.data?.socials ?? [],
    };
  } catch {
    return { columns: FALLBACK_COLUMNS, note: null, legal: FALLBACK_LEGAL, phone: null, email: null, socials: [] };
  }
}

export const Footer = async () => {
  const [{ columns, note, legal, phone, email, socials }, cookieTexts] = await Promise.all([getFooterData(), getCookieTexts()]);
  const year = new Date().getFullYear();

  return (
    // отступ сверху — место под бургер, который вылезает из newsletteru
    <footer className="mt-24 xl:mt-[180px]">
      <SectionEdge edge="darkTop" fill="var(--color-ink)" />
      <div className="bg-ink text-white">
        <div className="container grid gap-12 pb-16 pt-10 md:grid-cols-2 lg:grid-cols-4 lg:pb-20">
          <div className="space-y-5">
            <Image src="/logo.svg" alt="Gastrozóny" width={274} height={50} className="h-10 w-auto xl:h-[50px]" />
            {note && <p className="max-w-xs text-[15px] leading-relaxed text-white/70">{note}</p>}
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 text-[19px] font-extrabold text-yellow">{col.title}</h2>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.url}>
                    <Link href={l.url} className="text-white/80 transition-colors hover:text-yellow">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="mb-4 text-[19px] font-extrabold text-yellow">Kontakt</h2>
            <ul className="space-y-2.5 text-white/80">
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-yellow">
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-yellow">
                    {email}
                  </a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-4">
                {socials.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 transition-colors hover:text-yellow"
                    >
                      {SOCIAL_LABELS[s.platform] ?? s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container flex flex-col items-start justify-between gap-3 py-6 text-[14px] text-white/60 sm:flex-row sm:items-center">
            <p>© {year} Gastrozóny</p>
            <ul className="flex flex-wrap gap-5">
              {legal.map((l) => (
                <li key={l.url}>
                  <Link href={l.url} className="hover:text-yellow">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton label={cookieTexts.footerLinkLabel} className="hover:text-yellow" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
