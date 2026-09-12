/**
 * In-memory rate-limit (klouzavé okno) s LRU stropem počtu klíčů.
 * Stačí pro jeden pm2 proces; při více instancích by bylo potřeba sdílené úložiště.
 */

type Options = { limit: number; windowMs: number; maxKeys?: number };
export type RateLimitResult = { ok: boolean; retryAfter: number };

export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: Options) {
  const hits = new Map<string, number[]>();

  /** `peek` — jen zjistí, zda je klíč zablokovaný, pokus nezapočítá (např. kontrola před ověřením hesla). */
  return (key: string, { peek = false }: { peek?: boolean } = {}): RateLimitResult => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    // delete + set → klíč se přesune na konec (nejčerstvější), nejstarší jsou na začátku Map
    hits.delete(key);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return { ok: false, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000) };
    }
    if (peek) {
      if (recent.length > 0) hits.set(key, recent);
      return { ok: true, retryAfter: 0 };
    }

    recent.push(now);
    hits.set(key, recent);
    if (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
    return { ok: true, retryAfter: 0 };
  };
}

/**
 * IP klienta za nginx. `X-Real-IP` nastavuje proxy (`proxy_set_header X-Real-IP $remote_addr`);
 * z `X-Forwarded-For` jen poslední položka — tu přidal náš nginx, první si klient může podvrhnout.
 */
export const clientIp = (request: Request): string =>
  request.headers.get('x-real-ip')?.trim() ||
  request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
  'unknown';
