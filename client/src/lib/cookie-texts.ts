import type { CookieTexts } from './consent';
import { strapiFetch } from './strapi';

/** Texty cookie lišty ze single type `cookie-consent` + český fallback (lišta funguje i bez CMS). */

const FALLBACK: CookieTexts = {
  title: 'Používáme cookies',
  text:
    'Nutné cookies zajišťují fungování webu. Analytické (Google Analytics) nám pomáhají web zlepšovat — použijeme je jen s vaším souhlasem. Více v [zásadách cookies](/cookies) a [ochraně osobních údajů](/ochrana-osobnich-udaju).',
  acceptAllLabel: 'Přijmout vše',
  necessaryOnlyLabel: 'Pouze nutné',
  settingsLabel: 'Nastavení',
  saveLabel: 'Uložit volbu',
  necessaryTitle: 'Nutné',
  necessaryText: 'Základní funkce webu a uložení vaší volby cookies. Nelze je vypnout.',
  alwaysActiveLabel: 'Vždy aktivní',
  analyticsTitle: 'Analytické',
  analyticsText: 'Google Analytics 4 — měření návštěvnosti, díky kterému víme, co na webu funguje.',
  footerLinkLabel: 'Nastavení cookies',
};

export async function getCookieTexts(): Promise<CookieTexts> {
  try {
    const { data } = await strapiFetch<{ [K in keyof CookieTexts]?: string | null } | null>('/cookie-consent', {
      revalidate: 300,
      tags: ['cookie-consent'],
    });
    const keys = Object.keys(FALLBACK) as (keyof CookieTexts)[];
    return Object.fromEntries(keys.map((k) => [k, data?.[k] || FALLBACK[k]])) as CookieTexts;
  } catch {
    return FALLBACK;
  }
}
