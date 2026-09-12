import { NextResponse } from 'next/server';
import { getOpenEvents, type OpenEvent } from '@/lib/events';
import { detectFileType } from '@/lib/files';
import {
  acceptedTypes,
  buildFormSchema,
  contactFieldNames,
  EVENT_KEY,
  FORM_MESSAGES,
  HONEYPOT_KEY,
  itemValue,
  MAX_FILE_SIZE,
  MAX_FILES,
  valuesFromFormData,
  type FormDefinition,
  type FormValues,
  type UploadField,
} from '@/lib/form-schema';
import { getForm, getTeamRecipients } from '@/lib/forms';
import { sendApplicationMail, type MailResult } from '@/lib/mailer';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { mediaUrl, strapiDeleteFile, strapiPost, strapiPut, strapiUpload, type StrapiMedia } from '@/lib/strapi';

/**
 * Přihláška prodejce (multipart/form-data):
 * rate-limit → honeypot → zod (stejné schéma jako v prohlížeči) → kontrola obsahu souborů
 * → upload do Strapi (ImageKit) → záznam `application` přes serverový token → e-mail přes Resend → `mailSent`.
 *
 * Soubory jdou spolu s přihláškou, ne předem přes samostatný upload: boti tak nenaplní ImageKit osiřelými
 * soubory a na vše platí jeden rate-limit. Když zápis přihlášky selže, nahrané soubory se smažou.
 */

const FORM_KEY = 'prodejce';

/** 5 odeslání za 10 minut z jedné IP. */
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

/** Soubory + rezerva na textová pole. TODO(deploy): nginx `client_max_body_size 32m;`. */
const MAX_BODY = MAX_FILES * MAX_FILE_SIZE + 1024 * 1024;

type ResultItem = { key: string; label: string; value: string };

const fail = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: HeadersInit) =>
  NextResponse.json({ ok: false, error, ...extra }, { status, headers });

const fieldErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
};

/** Hodnoty jako text pro `result[]` (tabulka přihlášek, CSV, e-mail): u výběrů popisky, u souborů URL. Prázdná pole vynechá. */
function resultItems(form: FormDefinition, values: FormValues, fileUrls: Map<string, string[]>): ResultItem[] {
  return form.fields.flatMap((field) => {
    const raw = values[field.name];
    let value = '';
    switch (field.__component) {
      case 'form.upload':
        value = (fileUrls.get(field.name) ?? []).join('\n');
        break;
      case 'form.checkbox':
        value = raw === true ? 'Ano' : '';
        break;
      case 'form.select':
      case 'form.radio': {
        const picked: unknown[] = Array.isArray(raw) ? raw : [raw];
        value = field.items
          .filter((i) => picked.includes(itemValue(i)))
          .map((i) => i.label)
          .join(', ');
        break;
      }
      default:
        value = typeof raw === 'string' ? raw : '';
    }
    return value ? [{ key: field.name, label: field.label, value }] : [];
  });
}

/** Kontaktní údaje pro seznam přihlášek (contactFieldNames: první e-mailové pole, `name` / `jmeno`). */
function contactOf(form: FormDefinition, values: FormValues) {
  const text = (name: string | undefined) => {
    const v = name ? values[name] : undefined;
    return typeof v === 'string' && v !== '' ? v : undefined;
  };
  const fields = contactFieldNames(form);
  return { email: text(fields.email), name: text(fields.name) };
}

/** Upload souborů + záznam přihlášky. Při chybě smaže už nahrané soubory a chybu propustí dál. */
async function saveApplication(form: FormDefinition, values: FormValues, event: OpenEvent | undefined) {
  const uploaded: StrapiMedia[] = [];
  try {
    const fileUrls = new Map<string, string[]>();
    for (const field of form.fields) {
      if (field.__component !== 'form.upload') continue;
      const files = values[field.name] as File[];
      if (files.length === 0) continue;
      const media = await strapiUpload(files);
      uploaded.push(...media);
      fileUrls.set(field.name, media.flatMap((m) => mediaUrl(m) ?? []));
    }

    const result = resultItems(form, values, fileUrls);
    const contact = contactOf(form, values);
    const created = await strapiPost<{ documentId: string }>('/applications', {
      formKey: form.key,
      result,
      ...(event ? { event: event.documentId } : {}),
      contactEmail: contact.email ?? null,
      contactName: contact.name ?? null,
      attachments: uploaded.map((m) => m.id),
      status: 'nova',
      source: 'web',
    });
    return { documentId: created.data.documentId, result, contact };
  } catch (e) {
    await Promise.allSettled(uploaded.map((m) => strapiDeleteFile(m.id)));
    throw e;
  }
}

export async function POST(request: Request) {
  const rate = limiter(clientIp(request));
  if (!rate.ok) return fail(429, 'rate-limit', {}, { 'Retry-After': String(rate.retryAfter) });

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return fail(413, 'too-large');

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return fail(400, 'invalid-body');
  }

  // bot vyplnil honeypot → tváříme se, že je vše v pořádku, a nic neukládáme
  const honeypot = data.get(HONEYPOT_KEY);
  if (typeof honeypot === 'string' && honeypot !== '') return NextResponse.json({ ok: true });

  let form: FormDefinition | null;
  let events: OpenEvent[];
  try {
    [form, events] = await Promise.all([getForm(FORM_KEY), getOpenEvents()]);
  } catch (e) {
    console.error('[application] strapi unavailable', e);
    return fail(503, 'unavailable');
  }
  if (!form) return fail(503, 'unavailable');

  const parsed = buildFormSchema(form, events.map((e) => e.slug)).safeParse(valuesFromFormData(form, data));
  if (!parsed.success) return fail(422, 'validation', { errors: fieldErrors(parsed.error.issues) });
  const values = parsed.data as FormValues;

  // obsah souborů, ne jen deklarovaný MIME typ
  const uploadFields = form.fields.filter((f): f is UploadField => f.__component === 'form.upload');
  for (const field of uploadFields) {
    const types = acceptedTypes(field);
    for (const file of values[field.name] as File[]) {
      const real = await detectFileType(file);
      if (!real || !types.includes(real)) {
        return fail(422, 'validation', { errors: { [field.name]: FORM_MESSAGES.fileType } });
      }
    }
  }

  const event = events.find((e) => e.slug === values[EVENT_KEY]);

  let saved: Awaited<ReturnType<typeof saveApplication>>;
  try {
    saved = await saveApplication(form, values, event);
  } catch (e) {
    console.error('[application] strapi error', e);
    return fail(502, 'server');
  }

  // přihláška je uložená — selhání e-mailu už uživateli nehlásíme, jen zůstane `mailSent: false`
  // (stejně tak, když není nastavený RESEND_API_KEY: `ok: true, sent: false`)
  const mail = await sendApplicationMail({
    formKey: form.key,
    applicantEmail: saved.contact.email ?? '',
    applicantName: saved.contact.name,
    fields: saved.result,
    eventTitles: event ? [event.title] : [],
    teamRecipients: await getTeamRecipients(),
  }).catch((e: unknown): MailResult => ({ ok: false, error: String(e) }));

  if (mail.ok && mail.sent) {
    await strapiPut(`/applications/${saved.documentId}`, { mailSent: true }).catch((e: unknown) =>
      console.error('[application] mailSent update failed', e),
    );
  } else if (!mail.ok) {
    console.error('[application] mail failed', mail.error);
  }

  return NextResponse.json({ ok: true });
}
