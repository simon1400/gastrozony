import type { EventSummary } from '@/lib/events';
import { EventCard } from './EventCard';

/** Сетка карточек акций как на HP: 3 × 427 gap 80 (≥ 1520), 2 колонки от md, 1 на мобиле. */
export const EventGrid = ({
  events,
  showMeta = false,
  className = '',
}: {
  events: EventSummary[];
  showMeta?: boolean;
  className?: string;
}) => (
  <ul className={`grid gap-x-10 gap-y-14 md:grid-cols-2 xl:grid-cols-3 min-[1520px]:gap-x-20 ${className}`}>
    {events.map((e) => (
      <li key={e.documentId}>
        <EventCard event={e} showMeta={showMeta} />
      </li>
    ))}
  </ul>
);
