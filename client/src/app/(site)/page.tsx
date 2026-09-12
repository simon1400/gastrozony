import type { Metadata } from 'next';
import { ClientsSection } from '@/components/home/ClientsSection';
import { EventsSection } from '@/components/home/EventsSection';
import { Hero } from '@/components/home/Hero';
import { IntroSection } from '@/components/home/IntroSection';
import { JsonLd } from '@/components/JsonLd';
import { getUpcomingEvents } from '@/lib/events';
import { stripFlecks } from '@/lib/flecks';
import { organizationJsonLd } from '@/lib/global';
import { getHomepage } from '@/lib/homepage';
import { seoMetadata } from '@/lib/seo';

/**
 * Homepage — пиксельно по макету XD (design/specs/hp-spec.md), все тексты из `homepage`.
 * Newsletter и патичка — в layout.tsx.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { seo, hero } = await getHomepage();
  const metadata = await seoMetadata(seo, { title: hero.title, description: hero.perex, path: '/' });
  // HP bez šablony „%s | Gastrozóny“ — titulek už název obsahuje
  return { ...metadata, title: { absolute: seo?.metaTitle || `${stripFlecks(hero.title)} | Gastrozóny` } };
}

export default async function Home() {
  const [hp, organization] = await Promise.all([getHomepage(), organizationJsonLd()]);
  const events = await getUpcomingEvents(hp.events.limit);

  return (
    <>
      <JsonLd data={organization} />
      <Hero hero={hp.hero} stats={hp.stats} />
      <IntroSection intro={hp.intro} cards={hp.cards} tagsTitle={hp.tagsTitle} tags={hp.tags} />
      <ClientsSection clients={hp.clients} />
      <EventsSection block={hp.events} events={events} />
    </>
  );
}
