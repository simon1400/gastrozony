import { cache } from 'react';
import type { EventDetail } from './events';
import { SITE_NAME, SITE_URL } from './seo';
import { mediaUrl, strapiFetch } from './strapi';

/** Single type `global`: kontakty a sítě pro JSON-LD Organization, texty stránky 404. */

type Social = { platform: string; url: string };

type GlobalApi = {
  siteName?: string | null;
  email?: string | null;
  phone?: string | null;
  socials?: Social[] | null;
  notFoundTitle?: string | null;
  notFoundText?: string | null;
  notFoundHomeLabel?: string | null;
  notFoundEventsLabel?: string | null;
};

const getGlobal = cache(async (): Promise<GlobalApi> => {
  try {
    const { data } = await strapiFetch<GlobalApi | null>('/global', {
      query: { populate: ['socials'] },
      revalidate: 300,
      tags: ['global'],
    });
    return data ?? {};
  } catch {
    return {};
  }
});

export type ContactInfo = { siteName: string; email?: string; phone?: string };

/** Kontakty do patičky e-mailů (`lib/mailer.ts`). */
export async function getContactInfo(): Promise<ContactInfo> {
  const g = await getGlobal();
  return {
    siteName: g.siteName || SITE_NAME,
    ...(g.email ? { email: g.email } : {}),
    ...(g.phone ? { phone: g.phone } : {}),
  };
}

export type NotFoundTexts = { title: string; text: string; homeLabel: string; eventsLabel: string };

export async function getNotFoundTexts(): Promise<NotFoundTexts> {
  const g = await getGlobal();
  return {
    title: g.notFoundTitle || 'Tahle stránka **neexistuje**',
    text:
      g.notFoundText ||
      'Odkaz je možná starý nebo v něm je překlep. Zkuste to z úvodní stránky — nebo se rovnou podívejte, na jaké akce hledáme prodejce.',
    homeLabel: g.notFoundHomeLabel || 'Zpět na úvod',
    eventsLabel: g.notFoundEventsLabel || 'Aktuální akce',
  };
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** JSON-LD Organization + WebSite pro úvodní stránku. */
export async function organizationJsonLd(): Promise<Record<string, unknown>> {
  const g = await getGlobal();
  const name = g.siteName || SITE_NAME;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        ...(g.email ? { email: g.email } : {}),
        ...(g.phone ? { telephone: g.phone } : {}),
        ...(g.socials?.length ? { sameAs: g.socials.map((s) => s.url) } : {}),
      },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name, url: SITE_URL, inLanguage: 'cs', publisher: { '@id': ORGANIZATION_ID } },
    ],
  };
}

/** JSON-LD Event pro detail akce; bez data začátku `null` (Google ho vyžaduje). */
export function eventJsonLd(event: EventDetail): Record<string, unknown> | null {
  if (!event.dateFrom) return null;
  const image = mediaUrl(event.cover);
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    ...(event.perex ? { description: event.perex } : {}),
    startDate: event.dateFrom,
    endDate: event.dateTo ?? event.dateFrom,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.place ? { location: { '@type': 'Place', name: event.place, address: event.place } } : {}),
    ...(image ? { image: [image] } : {}),
    url: `${SITE_URL}/akce/${event.slug}`,
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}
