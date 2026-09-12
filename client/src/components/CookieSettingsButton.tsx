'use client';

import { CONSENT_OPEN_EVENT } from '@/lib/consent';

/** „Nastavení cookies“ v patičce — znovu otevře nastavení souhlasu (CookieConsent). */
export const CookieSettingsButton = ({ label, className = '' }: { label: string; className?: string }) => (
  <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className={className}>
    {label}
  </button>
);
