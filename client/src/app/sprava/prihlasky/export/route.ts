import {
  APPLICATION_STATUSES,
  eventLabel,
  formatDateTime,
  getAllApplications,
  parseFilters,
  resultColumns,
  resultValue,
  type ApplicationRow,
} from '@/lib/applications';
import { toCsv } from '@/lib/csv';
import { getForm } from '@/lib/forms';
import { mediaUrl } from '@/lib/strapi';

/**
 * GET /sprava/prihlasky/export?akce=&status= — CSV pro český Excel (BOM, středník), stejný filtr jako tabulka.
 * Chráněno stejnou Basic Auth (middleware na /sprava/*).
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const filters = parseFilters(Object.fromEntries(new URL(request.url).searchParams));

  let rows: ApplicationRow[];
  try {
    rows = await getAllApplications(filters);
  } catch (e) {
    console.error('[sprava/export] strapi error', e);
    return new Response('Strapi je nedostupné — export teď nelze vytvořit.', { status: 502 });
  }

  const form = await getForm('prodejce');
  const columns = resultColumns(form, rows);

  const header = ['Datum', 'Jméno', 'E-mail', 'Akce', 'Stav', ...columns.map((c) => c.label), 'Přílohy', 'Poznámka', 'ID'];
  const body = rows.map((row) => [
    formatDateTime(row.createdAt),
    row.contactName ?? '',
    row.contactEmail ?? '',
    eventLabel(row.event),
    APPLICATION_STATUSES[row.status] ?? row.status,
    ...columns.map((c) => resultValue(row, c.key)),
    (row.attachments ?? []).flatMap((file) => mediaUrl(file) ?? []).join('\n'),
    row.note ?? '',
    row.documentId,
  ]);

  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague' }).format(new Date());
  return new Response(toCsv([header, ...body]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="prihlasky_${today}.csv"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
