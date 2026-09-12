import type { Metadata } from 'next';
import { Blocks, type SectionEntry } from '@/components/blocks/Blocks';
import { Button } from '@/components/Button';
import { PageIntro } from '@/components/PageIntro';
import { RichText } from '@/components/RichText';
import { TeamList } from '@/components/TeamList';
import { getContactPage } from '@/lib/pages';
import { seoMetadata } from '@/lib/seo';

/**
 * /kontakt — single type `contact-page`: kontakty (prázdná doplní `global`), text, mapa, tým, bloky.
 * Mapa: odkaz „Vložit mapu“ (…/maps/embed…) jako iframe; jinak podle adresy; jiný odkaz = tlačítko.
 */

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContactPage();
  return seoMetadata(page.seo, { title: page.title, description: page.perex, path: '/kontakt' });
}

type Fact = { label: string; value: string; href?: string };

const isEmbed = (url: string | null): url is string => Boolean(url && /google\.[a-z.]+\/maps\/embed/.test(url));

const mapEmbedUrl = (url: string | null, address: string | null): string | null => {
  if (isEmbed(url)) return url;
  if (address) return `https://maps.google.com/maps?q=${encodeURIComponent(address.replace(/\s+/g, ' '))}&z=15&output=embed`;
  return null;
};

const linkClass = 'font-extrabold underline decoration-yellow decoration-[3px] underline-offset-4 hover:decoration-ink';

export default async function ContactPage() {
  const page = await getContactPage();

  const facts: Fact[] = [];
  if (page.email) facts.push({ label: page.emailLabel, value: page.email, href: `mailto:${page.email}` });
  if (page.phone) facts.push({ label: page.phoneLabel, value: page.phone, href: `tel:${page.phone.replace(/\s/g, '')}` });
  if (page.address) facts.push({ label: page.addressLabel, value: page.address });

  const embed = mapEmbedUrl(page.googleMapsUrl, page.address);
  const mapLink = page.googleMapsUrl && !isEmbed(page.googleMapsUrl) ? page.googleMapsUrl : null;

  const leading: SectionEntry[] =
    page.team.length > 0
      ? [{ key: 'team', background: 'grey', render: () => <TeamList title={page.teamTitle} members={page.team} /> }]
      : [];

  return (
    <>
      <PageIntro title={page.title} perex={page.perex} />

      <div className={`container grid items-start gap-12 pb-16 xl:pb-[110px] ${embed ? 'lg:grid-cols-2 lg:gap-x-20' : ''}`}>
        <div>
          {facts.length > 0 && (
            <dl className="grid gap-x-10 gap-y-3 border-t border-grey-muted pt-8 sm:grid-cols-[auto_1fr] sm:gap-y-4">
              {facts.map((f) => (
                <div key={f.label} className="contents">
                  <dt className="text-[15px] font-extrabold uppercase leading-[33px] tracking-wider text-grey-line">{f.label}</dt>
                  <dd className="-mt-2 whitespace-pre-line text-lead sm:mt-0">
                    {f.href ? (
                      <a href={f.href} className={linkClass}>
                        {f.value}
                      </a>
                    ) : (
                      f.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <RichText className={`max-w-[680px] ${facts.length > 0 ? 'mt-10' : ''}`}>{page.body}</RichText>
          {mapLink && (
            <div className="mt-10">
              <Button href={mapLink} variant="outline" newTab>
                {page.mapLabel}
              </Button>
            </div>
          )}
        </div>

        {embed && (
          <iframe
            src={embed}
            title={page.address ? `${page.addressLabel}: ${page.address}` : page.mapLabel}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="aspect-[4/3] w-full border-0 bg-grey-muted"
          />
        )}
      </div>

      <Blocks blocks={page.blocks} leading={leading} />
    </>
  );
}
