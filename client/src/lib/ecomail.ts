import { strapiFetch } from './strapi';

/**
 * Přihlášení odběratele do Ecomailu (API v2).
 * `ECOMAIL_API_KEY` se čte JEN tady, na serveru — nikdy v klientském bundlu.
 * Vzor volání: D:\bombastica-ecomail\src\index.ts
 *
 * Bez klíče nebo bez ID seznamu se nic neposílá: vrátí `synced: false`, odběratel zůstane
 * uložený ve Strapi s `syncedToEcomail = false` a dá se doplnit později.
 */

const API_BASE = 'https://api2.ecomailapp.cz';
const TIMEOUT_MS = 10_000;

export type EcomailResult = { ok: true; synced: boolean } | { ok: false; error: string };

type NewsletterConfigApi = {
  ecomailListId?: string | null;
  ecomailTags?: string | null;
  doubleOptIn?: boolean | null;
};

export type EcomailConfig = {
  listId: string;
  tags: string[];
  /** true = Ecomail pošle potvrzovací e-mail (skip_confirmation: false). */
  doubleOptIn: boolean;
};

/**
 * Nastavení ze single type `newsletter`; prázdné hodnoty z ENV.
 * Pole nejsou `private` — private pole Strapi nevrací ani na serverový token a admin by je nemohl měnit.
 * ID seznamu není tajemství, bez API klíče je k ničemu.
 */
export async function getEcomailConfig(): Promise<EcomailConfig> {
  let data: NewsletterConfigApi | null = null;
  try {
    ({ data } = await strapiFetch<NewsletterConfigApi | null>('/newsletter', {
      query: { fields: ['ecomailListId', 'ecomailTags', 'doubleOptIn'] },
      tags: ['newsletter'],
    }));
  } catch (e) {
    console.error('[ecomail] nastavení ze Strapi se nepodařilo načíst', e);
  }

  const tags = (data?.ecomailTags || process.env.ECOMAIL_TAGS || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    listId: (data?.ecomailListId || process.env.ECOMAIL_LIST_ID || '').trim(),
    tags,
    doubleOptIn: data?.doubleOptIn ?? true,
  };
}

/** Přidá e-mail do seznamu (existujícího odběratele aktualizuje). Chybu nevyhazuje. */
export async function subscribeToEcomail(email: string): Promise<EcomailResult> {
  const apiKey = process.env.ECOMAIL_API_KEY;
  const config = await getEcomailConfig();

  if (!apiKey || !config.listId) {
    console.info(
      `[ecomail] ${!apiKey ? 'ECOMAIL_API_KEY' : 'ID seznamu'} není nastavené — ${email} se do Ecomailu neodesílá.`,
    );
    return { ok: true, synced: false };
  }

  try {
    const res = await fetch(`${API_BASE}/lists/${encodeURIComponent(config.listId)}/subscribe`, {
      method: 'POST',
      headers: { key: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriber_data: { email, ...(config.tags.length ? { tags: config.tags } : {}) },
        update_existing: true,
        // double opt-in: Ecomail pošle potvrzovací e-mail a zapíše souhlas
        skip_confirmation: !config.doubleOptIn,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `ecomail ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true, synced: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
