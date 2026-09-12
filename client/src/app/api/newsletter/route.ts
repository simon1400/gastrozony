import { NextResponse } from 'next/server';
import { z } from 'zod';
import { subscribeToEcomail } from '@/lib/ecomail';
import { strapiPost, strapiPut, StrapiError } from '@/lib/strapi';

/**
 * Přihlášení k odběru novinek:
 * validace → záznam ve Strapi (`newsletter-subscriber`) → Ecomail (`lib/ecomail.ts`) → `syncedToEcomail`.
 *
 * Už přihlášený e-mail (unikátní index ve Strapi) není chyba — do Ecomailu ho pošleme znovu
 * (`update_existing`), aby se doplnily případné chybějící štítky.
 * Selhání Ecomailu uživateli nehlásíme: záznam ve Strapi je zdroj pravdy a `syncedToEcomail`
 * zůstane `false`, takže jde dosynchronizovat.
 */

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  consent: z.literal(true),
  // honeypot: люди его не видят и не заполняют
  website: z.string().max(0).optional(),
});

type Subscriber = { documentId: string };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation' }, { status: 422 });
  }
  const { email } = parsed.data;

  let documentId: string | null = null;
  let already = false;
  try {
    const created = await strapiPost<Subscriber>('/newsletter-subscribers', {
      email,
      consent: true,
      source: 'web',
    });
    documentId = created.data.documentId;
  } catch (e) {
    // уникальный индекс по email → повторная подписка не ошибка для пользователя
    if (e instanceof StrapiError && e.status === 400) {
      already = true;
    } else {
      console.error('[newsletter] strapi error', e);
      return NextResponse.json({ ok: false, error: 'server' }, { status: 502 });
    }
  }

  const ecomail = await subscribeToEcomail(email);
  if (!ecomail.ok) {
    console.error('[newsletter] ecomail error', ecomail.error);
  } else if (ecomail.synced && documentId) {
    await strapiPut(`/newsletter-subscribers/${documentId}`, { syncedToEcomail: true }).catch((e: unknown) =>
      console.error('[newsletter] syncedToEcomail update failed', e),
    );
  }

  return NextResponse.json({ ok: true, ...(already ? { already: true } : {}) });
}
