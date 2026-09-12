import { NextResponse, type NextRequest } from 'next/server';
import { clientIp, createRateLimiter } from './lib/rate-limit';

/**
 * Basic Auth pro interní správu (/sprava/*): ADMIN_USER / ADMIN_PASS z env.
 * Bez nastavených údajů je správa zavřená (503). Po 10 chybných pokusech z jedné IP za 15 minut → 429.
 * Vždy noindex + no-store (osobní údaje z přihlášek nesmí do cache ani do vyhledávačů).
 */

const PRIVATE_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };

const failures = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });

const unauthorized = () =>
  new NextResponse('Přístup jen pro tým Gastrozóny.', {
    status: 401,
    headers: { ...PRIVATE_HEADERS, 'WWW-Authenticate': 'Basic realm="Gastrozony - sprava", charset="UTF-8"' },
  });

/** Porovnání bez časového úniku (délka ani shoda prefixu se nepozná podle doby odpovědi). */
const safeEqual = (a: string, b: string) => {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
};

const credentials = (header: string | null): [string, string] | null => {
  const [scheme, encoded] = (header ?? '').split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  try {
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
    const colon = decoded.indexOf(':');
    return colon < 0 ? null : [decoded.slice(0, colon), decoded.slice(colon + 1)];
  } catch {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) {
    return new NextResponse('Správa není nastavená (ADMIN_USER / ADMIN_PASS).', { status: 503, headers: PRIVATE_HEADERS });
  }

  // zablokovaná IP dostane 429 ještě před ověřením — jinak by i během blokace poznala správné heslo (200)
  const ip = clientIp(request);
  const blocked = failures(ip, { peek: true });
  if (!blocked.ok) {
    return new NextResponse('Příliš mnoho pokusů o přihlášení. Zkuste to později.', {
      status: 429,
      headers: { ...PRIVATE_HEADERS, 'Retry-After': String(blocked.retryAfter) },
    });
  }

  const given = credentials(request.headers.get('authorization'));
  // obě porovnání vždy — && by zkrátil výpočet při špatném jménu
  const userOk = safeEqual(given?.[0] ?? '', user);
  const passOk = safeEqual(given?.[1] ?? '', pass);
  if (given && userOk && passOk) {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(PRIVATE_HEADERS)) response.headers.set(key, value);
    return response;
  }

  // první požadavek bez hlavičky (prohlížeč teprve zobrazí dialog) se do limitu nepočítá
  if (given) failures(ip);
  return unauthorized();
}

export const config = { matcher: ['/sprava', '/sprava/:path*'] };
