import { getApplicationMailTexts } from './forms';
import { getContactInfo } from './global';
import { renderMail, type MailField } from './mail-template';
import { SITE_URL } from './seo';

/**
 * Odesílání e-mailů přes Resend (účet na doméně gastrozony.cz, DKIM + SPF).
 * `RESEND_API_KEY` se čte JEN tady, na serveru — nikdy v klientském bundlu.
 *
 * Bez klíče (lokální vývoj) se nic neodesílá: funkce vypíše e-mail do konzole a vrátí `sent: false`,
 * takže se přihláška uloží a `mailSent` zůstane `false` — nikdy se netváříme, že e-mail odešel.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Odesílatel musí být na ověřené doméně v Resendu. */
const FROM = process.env.MAIL_FROM ?? 'Gastrozóny <info@gastrozony.cz>';
/** Kam chodí odpovědi na potvrzení přihlášky; prázdné = adresa z `global`. */
const REPLY_TO = process.env.MAIL_REPLY_TO;

const TIMEOUT_MS = 10_000;

export type ApplicationMailPayload = {
  formKey: 'prodejce' | 'poradatel';
  applicantEmail: string;
  applicantName?: string;
  /** key/label/value — to, co se uložilo do Strapi `application.result` */
  fields: { key: string; label?: string; value: string }[];
  eventTitles?: string[];
  /** Kopie týmu — z `global.applicationRecipients` v administraci */
  teamRecipients: string[];
};

/** `sent: false` = nebylo co odeslat nebo není nastavený klíč (ne chyba). */
export type MailResult = { ok: true; sent: boolean } | { ok: false; error: string };

type Message = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/** Jedno odeslání přes Resend. Chybu nevyhazuje — vrací ji jako text. */
async function resendSend(message: Message): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'missing-api-key' };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const mailFields = (payload: ApplicationMailPayload): MailField[] =>
  payload.fields.map((f) => ({ label: f.label || f.key, value: f.value }));

/**
 * Potvrzení odesílateli (texty ze `application-page`) + kopie týmu (`global.applicationRecipients`).
 * Kopie týmu má `reply_to` na přihlašujícího, aby šlo odpovědět přímo z e-mailu.
 */
export async function sendApplicationMail(payload: ApplicationMailPayload): Promise<MailResult> {
  const eventTitle = (payload.eventTitles ?? []).filter(Boolean).join(', ');
  const [texts, contact] = await Promise.all([getApplicationMailTexts(), getContactInfo()]);

  const footer = {
    siteName: contact.siteName,
    email: contact.email,
    phone: contact.phone,
    url: SITE_URL,
  };

  const messages: Message[] = [];

  if (payload.applicantEmail) {
    const intro = [
      // bez jména: čeština by vyžadovala 5. pád („Dobrý den Jane“), skloňovat cizí jméno automaticky nelze
      `${texts.greeting},`,
      texts.intro,
      ...(eventTitle ? [`${texts.eventLabel}: ${eventTitle}`] : []),
    ];
    const { html, text } = renderMail({
      preheader: texts.intro,
      heading: texts.subject,
      intro,
      fields: mailFields(payload),
      fieldsTitle: texts.fieldsTitle,
      note: texts.note,
      contact: footer,
    });
    messages.push({
      to: [payload.applicantEmail],
      subject: eventTitle ? `${texts.subject} — ${eventTitle}` : texts.subject,
      html,
      text,
      replyTo: REPLY_TO || contact.email,
    });
  }

  if (payload.teamRecipients.length) {
    const heading = eventTitle ? `Nová přihláška — ${eventTitle}` : 'Nová přihláška';
    const intro = [
      `Formulář: ${payload.formKey}`,
      ...(payload.applicantName ? [`Odesílatel: ${payload.applicantName}`] : []),
      ...(payload.applicantEmail ? [`E-mail: ${payload.applicantEmail}`] : []),
    ];
    const { html, text } = renderMail({
      preheader: heading,
      heading,
      intro,
      fields: mailFields(payload),
      fieldsTitle: 'Odpovědi z formuláře',
      note: `Přehled všech přihlášek: ${SITE_URL}/sprava/prihlasky`,
      contact: footer,
    });
    messages.push({
      to: payload.teamRecipients,
      subject: heading,
      html,
      text,
      replyTo: payload.applicantEmail || undefined,
    });
  }

  if (messages.length === 0) return { ok: true, sent: false };

  if (!process.env.RESEND_API_KEY) {
    console.info(
      `[mailer] RESEND_API_KEY není nastavený — e-mail se neodesílá. ` +
        `Příjemci: ${messages.flatMap((m) => m.to).join(', ')}; předmět: „${messages[0].subject}“.`,
    );
    return { ok: true, sent: false };
  }

  const results = await Promise.all(messages.map(resendSend));
  const errors = results.flatMap((r) => (r.ok ? [] : [r.error]));
  if (errors.length === results.length) return { ok: false, error: errors.join(' | ') };
  if (errors.length) {
    // část odešla (typicky kopie týmu selhala) — přihlášku bereme jako odeslanou, chybu jen zalogujeme
    console.error('[mailer] část e-mailů selhala', errors.join(' | '));
  }
  return { ok: true, sent: true };
}
