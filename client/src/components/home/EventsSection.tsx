import type { CSSProperties } from 'react';
import { Button } from '@/components/Button';
import { EventGrid } from '@/components/EventGrid';
import { SectionEdge, edgeHeight } from '@/components/SectionEdge';
import type { EventSummary } from '@/lib/events';
import { renderFlecks } from '@/lib/flecks';
import type { Homepage } from '@/lib/homepage';

/**
 * Тёмная секция «Aktuální akce» (макет y 2858…4208): H2 белый + текст справа,
 * карточки 427×600, кнопка «Všechny akce».
 * Низ секции уходит под верхнюю волну newsletteru (она жёлтая только под кривой),
 * поэтому тёмный фон продлён на высоту этой волны и стянут отрицательным margin.
 */
export const EventsSection = ({ block, events }: { block: Homepage['events']; events: EventSummary[] }) => (
  <section
    className="relative mb-[calc(-1*var(--nl-band))]"
    style={{ '--nl-band': edgeHeight('darkBottom') } as CSSProperties}
    aria-labelledby="events-title"
  >
    <SectionEdge edge="darkTop" fill="var(--color-ink)" />
    <div className="bg-ink pb-[calc(4rem+var(--nl-band))] text-white xl:pb-[calc(114px+var(--nl-band))]">
      <div className="container pt-12 xl:pt-[79px]">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-20">
          <h2 id="events-title" className="text-h2">
            {renderFlecks(block.title)}
          </h2>
          {block.text && <p className="text-body lg:pt-[10px]">{block.text}</p>}
        </div>

        {events.length > 0 && <EventGrid events={events} className="mt-16 xl:mt-[90px]" />}

        {block.cta && (
          <div className="mt-12 xl:mt-[73px]">
            <Button href={block.cta.url} variant={block.cta.variant} newTab={block.cta.newTab}>
              {block.cta.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  </section>
);
