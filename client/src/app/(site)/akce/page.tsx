import type { Metadata } from 'next';
import { EventGrid } from '@/components/EventGrid';
import { EventTabs, type EventTab } from '@/components/EventTabs';
import { GreyClosingSection } from '@/components/GreyClosingSection';
import { PageIntro } from '@/components/PageIntro';
import { getEvents, getEventsPage, groupByStatus, type EventStatus } from '@/lib/events';
import { stripFlecks } from '@/lib/flecks';
import { seoMetadata } from '@/lib/seo';

/**
 * /akce — výpis akcí se záložkami podle stavu (stav z dat, `statusOverride` má přednost).
 * Texty z single type `events-page`.
 */

export const revalidate = 60;

const STATUSES: EventStatus[] = ['aktualni', 'pripravujeme', 'ukonceno'];

/** Kotvy záložek (/akce#probehle). */
const TAB_IDS: Record<EventStatus, string> = { aktualni: 'aktualni', pripravujeme: 'pripravujeme', ukonceno: 'probehle' };

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEventsPage();
  return seoMetadata(page.seo, { title: page.title, description: page.perex, path: '/akce' });
}

export default async function EventsPage() {
  const [page, events] = await Promise.all([getEventsPage(), getEvents()]);
  const groups = groupByStatus(events);
  const labels: Record<EventStatus, string> = {
    aktualni: page.tabCurrentLabel,
    pripravujeme: page.tabUpcomingLabel,
    ukonceno: page.tabPastLabel,
  };

  const tabs: EventTab[] = STATUSES.map((status) => ({
    id: TAB_IDS[status],
    label: labels[status],
    count: groups[status].length,
    panel:
      groups[status].length > 0 ? (
        <EventGrid events={groups[status]} showMeta />
      ) : (
        <p className="max-w-[680px] text-lead">{page.emptyText}</p>
      ),
  }));
  const initialId = tabs.find((t) => t.count > 0)?.id ?? tabs[0].id;

  return (
    <>
      <PageIntro title={page.title} perex={page.perex} />
      <GreyClosingSection>
        <EventTabs tabs={tabs} initialId={initialId} label={stripFlecks(page.title)} />
      </GreyClosingSection>
    </>
  );
}
