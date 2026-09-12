/**
 * GA4 s Consent Mode v2 (základní režim) — jen v prohlížeči.
 * Výchozí stav: vše `denied`, gtag.js se nenačítá → bez souhlasu žádný požadavek na Google.
 * Po souhlasu: `consent update` → granted a teprve pak se načte gtag.js. Reklamní signály zůstávají denied.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SCRIPT_ID = 'gz-gtag';

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

export function enableAnalytics(gaId: string) {
  const gtag = ensureGtag();
  gtag('consent', 'update', { analytics_storage: 'granted' });
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', gaId);
}

/** Odvolání souhlasu: GA přestane ukládat a smažou se jeho cookies (_ga, _ga_*). */
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
