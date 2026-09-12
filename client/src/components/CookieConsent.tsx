'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { disableAnalytics, enableAnalytics } from '@/lib/analytics';
import { CONSENT_OPEN_EVENT, readConsent, writeConsent, type Consent, type CookieTexts } from '@/lib/consent';
import { Button } from './Button';

/**
 * Cookie lišta dole (černá / žlutá): „Přijmout vše“, „Pouze nutné“, „Nastavení“ (nutné vždy, analytické volitelné).
 * Volba se čte až v prohlížeči — čtení cookie v root layoutu by udělalo všechny stránky dynamické (bez ISR).
 * Z patičky se nastavení znovu otevře událostí CONSENT_OPEN_EVENT.
 */

type Props = {
  texts: CookieTexts;
  /** `texts.text` vykreslený na serveru z markdownu (odkazy na /cookies a GDPR). */
  text: ReactNode;
  /** GA4 Measurement ID (NEXT_PUBLIC_GA_ID); prázdné → analytika se nikdy nenačte. */
  gaId: string | null;
};

type View = 'closed' | 'bar' | 'settings';

const textButton =
  'px-2 py-3 text-[16px] font-extrabold underline decoration-yellow decoration-[3px] underline-offset-4 ' +
  'transition-colors hover:text-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow';

export const CookieConsent = ({ texts, text, gaId }: Props) => {
  const [view, setView] = useState<View>('closed');
  const [analytics, setAnalytics] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const apply = useCallback(
    (consent: Consent) => {
      if (!gaId) return;
      if (consent.analytics) enableAnalytics(gaId);
      else disableAnalytics();
    },
    [gaId],
  );

  useEffect(() => {
    const saved = readConsent(document.cookie);
    if (saved) {
      setAnalytics(saved.analytics);
      apply(saved);
    } else {
      setView('bar');
    }

    const openSettings = () => {
      setAnalytics(readConsent(document.cookie)?.analytics ?? false);
      setView('settings');
    };
    window.addEventListener(CONSENT_OPEN_EVENT, openSettings);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openSettings);
  }, [apply]);

  // nastavení otevřené z patičky: fokus do panelu (lišta při načtení stránky fokus nekrade)
  useEffect(() => {
    if (view === 'settings') panelRef.current?.focus();
  }, [view]);

  const save = (consent: Consent) => {
    writeConsent(consent);
    apply(consent);
    setAnalytics(consent.analytics);
    setView('closed');
  };

  if (view === 'closed') return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-yellow bg-ink text-white shadow-[0_-6px_24px_rgba(0,0,0,0.25)] outline-none"
    >
      <div className="container max-h-[85dvh] overflow-y-auto py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-16">
          <div>
            <h2 id="cookie-title" className="text-[22px] font-extrabold leading-[28px] text-yellow">
              {texts.title}
            </h2>
            <p id="cookie-text" className="mt-2 max-w-[860px] text-[15px] leading-[24px] text-white/85">
              {text}
            </p>
          </div>

          {view === 'bar' && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button onClick={() => save({ analytics: true })}>{texts.acceptAllLabel}</Button>
              <Button variant="outline" onClick={() => save({ analytics: false })}>
                {texts.necessaryOnlyLabel}
              </Button>
              <button type="button" onClick={() => setView('settings')} className={textButton}>
                {texts.settingsLabel}
              </button>
            </div>
          )}
        </div>

        {view === 'settings' && (
          <div className="mt-6 border-t border-white/15 pt-6">
            <ul className="grid gap-5 md:grid-cols-2 md:gap-x-10">
              <li className="flex items-start gap-4">
                <input
                  id="cookie-necessary"
                  type="checkbox"
                  className="gz-checkbox mt-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  checked
                  disabled
                />
                <label htmlFor="cookie-necessary">
                  <span className="block font-extrabold">
                    {texts.necessaryTitle} <span className="font-normal text-white/60">· {texts.alwaysActiveLabel}</span>
                  </span>
                  <span className="block text-[15px] leading-[22px] text-white/75">{texts.necessaryText}</span>
                </label>
              </li>
              <li className="flex items-start gap-4">
                <input
                  id="cookie-analytics"
                  type="checkbox"
                  className="gz-checkbox mt-0.5"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <label htmlFor="cookie-analytics" className="cursor-pointer">
                  <span className="block font-extrabold">{texts.analyticsTitle}</span>
                  <span className="block text-[15px] leading-[22px] text-white/75">{texts.analyticsText}</span>
                </label>
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={() => save({ analytics })}>{texts.saveLabel}</Button>
              <Button variant="outline" onClick={() => save({ analytics: true })}>
                {texts.acceptAllLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
