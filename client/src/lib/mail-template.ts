/**
 * HTML šablona e-mailů (Gastrozóny: černá #0E0E0E / žlutá #FFD100).
 * Tabulkové rozvržení a inline styly — Outlook a Gmail jinak layout rozbijí.
 * Vzor struktury: D:\burger\client\mail-templates\form.ts, vzhled ale podle webu Gastrozóny.
 *
 * Vždy vrací HTML i textovou verzi (text = lepší doručitelnost a čtečky bez HTML).
 */

export type MailField = { label: string; value: string };

export type MailContent = {
  /** Řádek v náhledu schránky (v těle skrytý). */
  preheader: string;
  heading: string;
  /** Odstavce nad výpisem polí. */
  intro: string[];
  fields?: MailField[];
  fieldsTitle?: string;
  /** Drobný text pod výpisem (např. „na tuto zprávu neodpovídejte“). */
  note?: string;
  /** Kontakty do patičky e-mailu. */
  contact?: { siteName: string; email?: string; phone?: string; url: string };
};

export type RenderedMail = { html: string; text: string };

const YELLOW = '#FFD100';
const BLACK = '#0E0E0E';
const GREY_TEXT = '#5A5A5A';
const BORDER = '#EBEBEB';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Text z formuláře: escapovat, odkazy (přílohy) udělat klikací, nové řádky na <br>. */
function richValue(value: string): string {
  return value
    .split('\n')
    .map((line) => {
      const safe = escapeHtml(line.trim());
      return /^https?:\/\/\S+$/.test(line.trim())
        ? `<a href="${safe}" style="color:${BLACK};text-decoration:underline">${safe}</a>`
        : safe;
    })
    .join('<br>');
}

const paragraph = (html: string, extra = '') =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:${BLACK};${extra}">${html}</p>`;

function fieldRows(fields: MailField[]): string {
  return fields
    .map(
      (f) => `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER}">
          <div style="font-family:${FONT};font-size:12px;line-height:18px;letter-spacing:0.06em;text-transform:uppercase;color:${GREY_TEXT}">${escapeHtml(f.label)}</div>
          <div style="margin-top:4px;font-family:${FONT};font-size:16px;line-height:24px;color:${BLACK};font-weight:600">${richValue(f.value)}</div>
        </td>
      </tr>`,
    )
    .join('');
}

export function renderMail(content: MailContent): RenderedMail {
  const { preheader, heading, intro, fields = [], fieldsTitle, note, contact } = content;

  const contactLine = contact
    ? [
        contact.email ? `<a href="mailto:${escapeHtml(contact.email)}" style="color:${YELLOW};text-decoration:none">${escapeHtml(contact.email)}</a>` : '',
        contact.phone ? `<a href="tel:${escapeHtml(contact.phone.replace(/\s/g, ''))}" style="color:${YELLOW};text-decoration:none">${escapeHtml(contact.phone)}</a>` : '',
      ]
        .filter(Boolean)
        .join('&nbsp;&nbsp;·&nbsp;&nbsp;')
    : '';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#F6F6F6">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F6F6">
  <tr>
    <td align="center" style="padding:24px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">

        <!-- hlavička -->
        <tr>
          <td align="center" style="background-color:${BLACK};padding:28px 24px">
            <div style="font-family:${FONT};font-size:24px;line-height:28px;font-weight:800;letter-spacing:0.12em;color:${YELLOW};text-transform:uppercase">Gastrozóny</div>
          </td>
        </tr>
        <tr><td style="background-color:${YELLOW};height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>

        <!-- obsah -->
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 32px 8px">
            <h1 style="margin:0 0 20px;font-family:${FONT};font-size:26px;line-height:34px;font-weight:800;color:${BLACK}">${escapeHtml(heading)}</h1>
            ${intro.map((t) => paragraph(escapeHtml(t))).join('')}
          </td>
        </tr>
        ${
          fields.length
            ? `<tr>
          <td style="background-color:#FFFFFF;padding:8px 32px 12px">
            ${fieldsTitle ? `<div style="font-family:${FONT};font-size:13px;line-height:20px;letter-spacing:0.08em;text-transform:uppercase;color:${GREY_TEXT};padding-bottom:4px">${escapeHtml(fieldsTitle)}</div>` : ''}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:3px solid ${YELLOW}">
              ${fieldRows(fields)}
            </table>
          </td>
        </tr>`
            : ''
        }
        ${
          note
            ? `<tr>
          <td style="background-color:#FFFFFF;padding:20px 32px 36px">
            ${paragraph(escapeHtml(note), `font-size:14px;line-height:22px;color:${GREY_TEXT};margin:0`)}
          </td>
        </tr>`
            : `<tr><td style="background-color:#FFFFFF;padding:0 32px 28px">&nbsp;</td></tr>`
        }

        <!-- patička -->
        <tr>
          <td align="center" style="background-color:${BLACK};padding:24px">
            ${
              contact
                ? `<div style="font-family:${FONT};font-size:14px;line-height:22px;color:#FFFFFF;font-weight:700">${escapeHtml(contact.siteName)}</div>
            ${contactLine ? `<div style="margin-top:6px;font-family:${FONT};font-size:14px;line-height:22px;color:#FFFFFF">${contactLine}</div>` : ''}
            <div style="margin-top:6px;font-family:${FONT};font-size:13px;line-height:20px"><a href="${escapeHtml(contact.url)}" style="color:#9A9A9A;text-decoration:none">${escapeHtml(contact.url.replace(/^https?:\/\//, ''))}</a></div>`
                : ''
            }
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    heading,
    '',
    ...intro,
    ...(fields.length ? ['', fieldsTitle ?? '', ...fields.map((f) => `${f.label}: ${f.value.replace(/\n/g, ', ')}`)] : []),
    ...(note ? ['', note] : []),
    ...(contact
      ? ['', '—', contact.siteName, [contact.email, contact.phone].filter(Boolean).join(' · '), contact.url]
      : []),
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n');

  return { html, text };
}
