import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination } from '@/components/Pagination';
import {
  APPLICATION_STATUSES,
  eventLabel,
  filtersQuery,
  formatDateTime,
  getApplications,
  parseFilters,
  resultColumns,
  resultValue,
  strapiAdminUrl,
  type ApplicationStatus,
} from '@/lib/applications';
import { getEvents } from '@/lib/events';
import { getForm } from '@/lib/forms';
import { mediaUrl } from '@/lib/strapi';

/**
 * /sprava/prihlasky — tabulka přihlášek (jako v BSF), filtr podle akce a stavu, po 50, export CSV.
 * Sloupce z `result[]` podle polí formuláře. Stav se mění v adminu Strapi (odkaz u každé přihlášky).
 */

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Přihlášky' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUS_CLASS: Record<ApplicationStatus, string> = {
  nova: 'bg-yellow text-ink',
  kontaktovana: 'bg-grey-muted text-ink',
  schvalena: 'bg-ink text-white',
  zamitnuta: 'bg-white text-grey-line line-through ring-1 ring-grey-muted',
};

const control = 'h-12 rounded border-[1.5px] border-grey-line/35 bg-white px-4 text-[16px] outline-none focus:border-ink';
const linkClass = 'font-extrabold underline decoration-yellow decoration-[3px] underline-offset-4 hover:decoration-ink';

const withQuery = (path: string, query: string) => (query ? `${path}?${query}` : path);

export default async function ApplicationsAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const pageParam = typeof params.strana === 'string' ? Number(params.strana) : 1;
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [data, form, events] = await Promise.all([
    getApplications(filters, page).catch((e: unknown) => {
      console.error('[sprava] strapi error', e);
      return null;
    }),
    getForm('prodejce'),
    getEvents(),
  ]);

  if (!data) {
    return <p className="bg-grey-bg p-6 text-lead font-extrabold">Strapi je nedostupné — přihlášky teď nelze načíst.</p>;
  }

  const columns = resultColumns(form, data.rows);
  const query = filtersQuery(filters);
  const filtered = Boolean(filters.akce || filters.status);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-h2-sm">Přihlášky</h1>
        <p className="text-[16px] text-ink/70">
          {filtered ? 'Odpovídá filtru' : 'Celkem'}: <strong className="text-ink">{data.total}</strong>
        </p>
      </div>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-4 bg-grey-bg p-5">
        {/* šířku selectu jinak určí nejdelší volba (název · datum · místo) a na mobilu přeteče */}
        <label className="flex w-full min-w-0 flex-col gap-1.5 text-[14px] font-extrabold sm:w-[420px]">
          Akce
          <select name="akce" defaultValue={filters.akce ?? ''} className={`${control} w-full min-w-0`}>
            <option value="">Všechny akce</option>
            {events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {eventLabel(e)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[14px] font-extrabold">
          Stav
          <select name="status" defaultValue={filters.status ?? ''} className={control}>
            <option value="">Všechny stavy</option>
            {Object.entries(APPLICATION_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-12 bg-ink px-6 text-[16px] font-extrabold text-yellow hover:bg-black">
          Filtrovat
        </button>
        {filtered && (
          <Link href="/sprava/prihlasky" className={`${linkClass} self-center text-[15px]`}>
            Zrušit filtr
          </Link>
        )}
        <a
          href={withQuery('/sprava/prihlasky/export', query)}
          className="ml-auto inline-flex h-12 items-center bg-yellow px-6 text-[16px] font-extrabold shadow-btn hover:brightness-105"
        >
          Exportovat CSV
        </a>
      </form>

      {data.rows.length === 0 ? (
        <p className="mt-8 text-lead">Žádné přihlášky{filtered ? ' pro tento filtr' : ''}.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-grey-muted">
          <table className="min-w-full text-left text-[14px] leading-[20px]">
            <thead className="bg-ink text-yellow">
              <tr>
                {['Datum', 'Jméno', 'E-mail', 'Akce', 'Stav', ...columns.map((c) => c.label), 'Přílohy', ''].map((label, i) => (
                  <th key={`${label}-${i}`} scope="col" className="whitespace-nowrap px-3 py-3 font-extrabold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.documentId} className="border-t border-grey-muted align-top even:bg-grey-bg/60">
                  <td className="whitespace-nowrap px-3 py-3">{formatDateTime(row.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-extrabold">{row.contactName}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {row.contactEmail && (
                      <a href={`mailto:${row.contactEmail}`} className={linkClass}>
                        {row.contactEmail}
                      </a>
                    )}
                  </td>
                  <td className="min-w-[220px] px-3 py-3">{eventLabel(row.event)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-[13px] font-extrabold ${STATUS_CLASS[row.status] ?? ''}`}>
                      {APPLICATION_STATUSES[row.status] ?? row.status}
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="min-w-[120px] max-w-[360px] whitespace-pre-line px-3 py-3">
                      {resultValue(row, c.key)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-3">
                    {(row.attachments ?? []).map((file, i) => {
                      const url = mediaUrl(file);
                      return url ? (
                        <a key={file.id} href={url} target="_blank" rel="noopener noreferrer" className={`${linkClass} block`}>
                          Příloha {i + 1}
                        </a>
                      ) : null;
                    })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <a href={strapiAdminUrl(row.documentId)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      Otevřít ve Strapi
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.pageCount > 1 && (
        <Pagination
          page={page}
          pageCount={data.pageCount}
          hrefFor={(p) => withQuery('/sprava/prihlasky', filtersQuery(filters, p > 1 ? { strana: String(p) } : {}))}
          prevLabel="Předchozí"
          nextLabel="Další"
          className="mt-10"
        />
      )}
    </>
  );
}
