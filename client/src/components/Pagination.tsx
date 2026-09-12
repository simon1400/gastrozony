import Link from 'next/link';

/**
 * Stránkování výpisu: Předchozí · 1 … 4 5 6 … 12 · Další. Čtverce 56 px, aktuální žlutý (aria-current).
 * `hrefFor(1)` má vracet kanonickou adresu bez parametru.
 */

// aria-popisek navigace (ne obsah) — proto v kódu, jako popisky galerie
const NAV_LABEL = 'Stránkování';

type Props = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  prevLabel: string;
  nextLabel: string;
  className?: string;
};

/** Čísla stránek: všechny do 7, jinak první, poslední a okolí aktuální s „…“ mezi mezerami. */
const pageItems = (page: number, count: number): (number | 'gap')[] => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages = [...new Set([1, page - 1, page, page + 1, count])].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ['gap' as const, p] : [p]));
};

const item =
  'flex h-14 min-w-14 items-center justify-center px-4 text-[18px] font-extrabold leading-none transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export const Pagination = ({ page, pageCount, hrefFor, prevLabel, nextLabel, className = '' }: Props) => (
  <nav aria-label={NAV_LABEL} className={className}>
    <ul className="flex flex-wrap items-center gap-2">
      {page > 1 && (
        <li>
          <Link href={hrefFor(page - 1)} rel="prev" className={`${item} bg-white hover:bg-yellow`}>
            <span aria-hidden className="mr-2">←</span>
            {prevLabel}
          </Link>
        </li>
      )}
      {pageItems(page, pageCount).map((p, i) =>
        p === 'gap' ? (
          <li key={`gap-${i}`} aria-hidden className="px-2 text-[18px] font-extrabold">
            …
          </li>
        ) : (
          <li key={p}>
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${item} ${p === page ? 'bg-yellow shadow-btn' : 'bg-white hover:bg-yellow'}`}
            >
              {p}
            </Link>
          </li>
        ),
      )}
      {page < pageCount && (
        <li>
          <Link href={hrefFor(page + 1)} rel="next" className={`${item} bg-white hover:bg-yellow`}>
            {nextLabel}
            <span aria-hidden className="ml-2">→</span>
          </Link>
        </li>
      )}
    </ul>
  </nav>
);
