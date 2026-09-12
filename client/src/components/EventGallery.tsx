'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CmsImage } from './CmsImage';

export type GalleryImage = { src: string; alt: string };

// aria-popisky ovládacích prvků (ne obsah) — proto v kódu, ne ve Strapi
const LABELS = { open: 'Zvětšit fotografii', close: 'Zavřít', prev: 'Předchozí fotografie', next: 'Další fotografie' };

const iconButton =
  'absolute flex size-12 items-center justify-center rounded-full bg-yellow text-ink shadow-btn transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={3}>
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

/**
 * Galerie akce: mřížka náhledů + lehký lightbox na nativním <dialog> (Esc, šipky, klik mimo = zavřít).
 * Bez knihoven — fotky přes next/image.
 */
/** Počet sloupců od md (`blocks.gallery.columns`); na mobilu 2 (u 1 sloupce 1). */
const COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
};

export const EventGallery = ({ images, columns = 3 }: { images: GalleryImage[]; columns?: number }) => {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = images.length;
  const isOpen = index !== null;

  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // pod otevřeným lightboxem se stránka neroluje
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [isOpen]);

  const current = index === null ? null : images[index];

  return (
    <>
      <ul className={`grid gap-3 sm:gap-4 lg:gap-6 ${COLUMNS[columns] ?? COLUMNS[3]}`}>
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={img.alt ? `${LABELS.open}: ${img.alt}` : `${LABELS.open} ${i + 1}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-grey-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <CmsImage
                src={img.src}
                alt=""
                fill
                sizes="(min-width: 1520px) 460px, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={current?.alt || LABELS.open}
        onClose={() => setIndex(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIndex(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none items-center justify-center bg-ink/95 p-4 text-white backdrop:bg-transparent open:flex sm:p-20"
      >
        {current && (
          <figure className="pointer-events-none relative size-full">
            <CmsImage src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
          </figure>
        )}

        <button type="button" onClick={() => setIndex(null)} aria-label={LABELS.close} className={`${iconButton} right-4 top-4`}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {count > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label={LABELS.prev} className={`${iconButton} left-4 top-1/2 -translate-y-1/2`}>
              <Chevron dir="left" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label={LABELS.next} className={`${iconButton} right-4 top-1/2 -translate-y-1/2`}>
              <Chevron dir="right" />
            </button>
            <p aria-live="polite" className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[16px] font-extrabold">
              {index === null ? '' : `${index + 1} / ${count}`}
            </p>
          </>
        )}
      </dialog>
    </>
  );
};
