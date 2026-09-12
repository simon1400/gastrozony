/**
 * Souhlas s cookies: cookie `gz_consent` (12 měsíců), jediná volitelná kategorie — analytické (GA4).
 * Hodnota nese verzi — po změně kategorií stačí zvýšit VERSION a lišta se zeptá znovu.
 */

export const CONSENT_COOKIE = 'gz_consent';
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60;
const VERSION = 'v1';

/** Událost, kterou tlačítko „Nastavení cookies“ v patičce otevírá nastavení souhlasu. */
export const CONSENT_OPEN_EVENT = 'gz:cookie-settings';

export type Consent = { analytics: boolean };

export type CookieTexts = {
  title: string;
  text: string;
  acceptAllLabel: string;
  necessaryOnlyLabel: string;
  settingsLabel: string;
  saveLabel: string;
  necessaryTitle: string;
  necessaryText: string;
  alwaysActiveLabel: string;
  analyticsTitle: string;
  analyticsText: string;
  footerLinkLabel: string;
};

const PATTERN = new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=${VERSION}\\.analytics-([01])(?:;|$)`);

/** Uložený souhlas z `document.cookie`; `null` = ještě nevybráno (nebo starší verze). */
export const readConsent = (cookies: string): Consent | null => {
  const match = cookies.match(PATTERN);
  return match ? { analytics: match[1] === '1' } : null;
};

/** Jen v prohlížeči. */
export const writeConsent = (consent: Consent) => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${CONSENT_COOKIE}=${VERSION}.analytics-${consent.analytics ? 1 : 0}; ` +
    `Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
};
