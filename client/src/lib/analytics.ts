/**
 * Google Tag Manager (nebo přímo GA4) s Consent Mode v2 — jen v prohlížeči.
 *
 * Základní režim: bez souhlasu se nenačte vůbec nic, takže na Google nejde jediný požadavek.
 * Po souhlasu: `consent default` (vše denied) → `consent update` na analytics_storage → teprve pak skript.
 * Reklamní signály zůstávají denied vždy.
 *
 * Priorita: `NEXT_PUBLIC_GTM_ID` (GTM-…) → kontejner GTM, uvnitř kterého si zákazník spravuje značky včetně GA4.
 * Když GTM není, ale je `NEXT_PUBLIC_GA_ID` (G-…), načte se gtag.js přímo.
 *
 * Značka `<noscript><iframe …>` z návodu Google tu schválně není: bez JavaScriptu se nedá zjistit souhlas
 * (a ani ho udělit — lišta je klientská), takže by se načítala i bez něj.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SCRIPT_ID = 'gz-tag';

export type AnalyticsIds = {
  /** GTM-XXXXXXX */
  gtmId?: string | null;
  /** G-XXXXXXXXXX */
  gaId?: string | null;
};

function ensureGtag(): (...args: unknown[]) => void {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer ?? [];
    // gtag.js čte z dataLayer objekt `arguments`, ne pole — proto klasická funkce
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }
  return window.gtag;
}

const addScript = (src: string) => {
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

export function enableAnalytics({ gtmId, gaId }: AnalyticsIds) {
  const gtag = ensureGtag();
  gtag('consent', 'update', { analytics_storage: 'granted' });
  if (document.getElementById(SCRIPT_ID)) return;

  if (gtmId) {
    // ekvivalent oficiálního snippetu GTM, jen spuštěný až po souhlasu
    window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
    return;
  }

  if (gaId) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
    gtag('js', new Date());
    gtag('config', gaId);
  }
}

/** Odvolání souhlasu: měření se zastaví a smažou se cookies GA (_ga, _ga_*). */
export function disableAnalytics() {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });

  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}
