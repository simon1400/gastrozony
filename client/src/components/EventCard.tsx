import Link from 'next/link';
import { formatEventDate, type EventSummary } from '@/lib/events';
import { mediaUrl } from '@/lib/strapi';
import { Badge } from './Badge';
import { CmsImage } from './CmsImage';

/**
 * Карточка акции из макета: 427 широкая, обложка 427×321, бейдж h37 наполовину
 * над обложкой (x+40), заголовок 23/33, перекс 18/33 (до 5 строк). Вся карточка — ссылка.
 * Ukončená akce — ч/б. `showMeta` (на /akce) — строка «datum · místo» над заголовком (в макете HP её нет).
 */
export const EventCard = ({ event, showMeta = false }: { event: EventSummary; showMeta?: boolean }) => {
  const src = mediaUrl(event.cover);
  const meta = showMeta ? [formatEventDate(event.dateFrom, event.dateTo), event.place].filter(Boolean).join(' · ') : '';
  return (
    <article className={`group relative flex h-full flex-col bg-white text-ink ${event.status === 'ukonceno' ? 'grayscale' : ''}`}>
      <div className="relative aspect-[427/321] overflow-hidden bg-grey-muted">
        {src && (
          <CmsImage
            src={src}
            alt={event.cover?.alternativeText ?? ''}
            fill
            sizes="(min-width: 1280px) 427px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <Badge status={event.status} className="absolute left-7 top-[-18px] sm:left-10" />
      <div className="flex flex-1 flex-col px-7 pb-8 pt-8 sm:px-10 xl:pb-[29px] xl:pt-[33px]">
        {meta && <p className="mb-2 text-[15px] font-extrabold leading-[24px] text-grey-line">{meta}</p>}
        <h3 className="text-h4">
          <Link
            href={`/akce/${event.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-yellow"
          >
            {event.title}
          </Link>
        </h3>
        {event.perex && <p className="mt-[19px] line-clamp-5 max-w-[340px] text-body">{event.perex}</p>}
      </div>
    </article>
  );
};
