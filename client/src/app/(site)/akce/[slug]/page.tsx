import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BackLink } from '@/components/BackLink';
import { JsonLd } from '@/components/JsonLd';
import { eventJsonLd } from '@/lib/global';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CmsImage } from '@/components/CmsImage';
import { EventGallery, type GalleryImage } from '@/components/EventGallery';
import { GreyClosingSection } from '@/components/GreyClosingSection';
import { RichText } from '@/components/RichText';
import { CAPACITY_LABELS, formatEventDate, getEventBySlug, getEvents, getEventsPage } from '@/lib/events';
import { seoMetadata } from '@/lib/seo';
import { mediaUrl } from '@/lib/strapi';

/**
 * Detail akce: bejdž stavu, termín / místo (+ Google Maps) / kapacita, perex, obálka,
 * obsah (markdown), galerie s lightboxem. CTA na přihlášku jen když `applicationOpen` a akce neskončila.
 */

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

type Fact = { label: string; value: string; link?: { href: string; label: string } };

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return seoMetadata(event.seo, { title: event.title, description: event.perex, image: event.cover, path: `/akce/${slug}` });
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const [event, page] = await Promise.all([getEventBySlug(slug), getEventsPage()]);
  if (!event) notFound();

  const cover = mediaUrl(event.cover);
  const ended = event.status === 'ukonceno';
  const canApply = event.applicationOpen && !ended;
  const applyHref = `/prihlaska?akce=${encodeURIComponent(event.slug)}`;
  const date = formatEventDate(event.dateFrom, event.dateTo);
  const jsonLd = eventJsonLd(event);

  const facts: Fact[] = [];
  if (date) facts.push({ label: page.dateLabel, value: date });
  if (event.place) {
    facts.push({
      label: page.placeLabel,
      value: event.place,
      ...(event.googleMapsUrl ? { link: { href: event.googleMapsUrl, label: page.mapLabel } } : {}),
    });
  }
  if (event.capacityState && !ended) facts.push({ label: page.capacityLabel, value: CAPACITY_LABELS[event.capacityState] });

  const gallery: GalleryImage[] = event.gallery.flatMap((m) => {
    const src = mediaUrl(m);
    return src ? [{ src, alt: m.alternativeText ?? '' }] : [];
  });

  return (
    <article>
      {jsonLd && <JsonLd data={jsonLd} />}
      <div className={`container pt-10 xl:pt-[70px] ${gallery.length > 0 ? 'pb-16 xl:pb-[100px]' : 'pb-20 xl:pb-[140px]'}`}>
        <BackLink href="/akce">{page.backLabel}</BackLink>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-x-20 xl:mt-12">
          <div>
            <Badge status={event.status} />
            <h1 className="mt-6 text-h2">{event.title}</h1>
            {event.perex && <p className="mt-6 text-lead">{event.perex}</p>}

            {facts.length > 0 && (
              <dl className="mt-8 grid gap-x-10 gap-y-3 border-t border-grey-muted pt-8 sm:grid-cols-[auto_1fr] sm:gap-y-4">
                {facts.map((f) => (
                  <div key={f.label} className="contents">
                    <dt className="text-[15px] font-extrabold uppercase leading-[33px] tracking-wider text-grey-line">{f.label}</dt>
                    <dd className="-mt-2 text-body sm:mt-0">
                      {f.value}
                      {f.link && (
                        <>
                          {' · '}
                          <a
                            href={f.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-extrabold underline decoration-yellow decoration-[3px] underline-offset-4 hover:decoration-ink"
                          >
                            {f.link.label}
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-10">
              {canApply ? (
                <Button href={applyHref}>{page.applyLabel}</Button>
              ) : (
                <p className="inline-block bg-grey-bg px-6 py-4 font-extrabold">{page.applicationClosedText}</p>
              )}
            </div>
          </div>

          {cover && (
            <div className={`relative aspect-[427/321] overflow-hidden bg-grey-muted ${ended ? 'grayscale' : ''}`}>
              <CmsImage
                src={cover}
                alt={event.cover?.alternativeText ?? ''}
                fill
                priority
                sizes="(min-width: 1520px) 680px, (min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>

        {event.content && (
          <>
            <RichText className="mt-16 max-w-[800px] xl:mt-[100px]">{event.content}</RichText>
            {canApply && (
              <div className="mt-12">
                <Button href={applyHref}>{page.applyLabel}</Button>
              </div>
            )}
          </>
        )}
      </div>

      {gallery.length > 0 && (
        <GreyClosingSection labelledBy="gallery-title">
          <h2 id="gallery-title" className="text-h2-sm">
            {page.galleryTitle}
          </h2>
          <div className="mt-10 xl:mt-14">
            <EventGallery images={gallery} />
          </div>
        </GreyClosingSection>
      )}
    </article>
  );
}
