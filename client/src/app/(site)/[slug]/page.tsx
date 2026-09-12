import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Blocks } from '@/components/blocks/Blocks';
import { Button } from '@/components/Button';
import { CmsImage } from '@/components/CmsImage';
import { PageIntro } from '@/components/PageIntro';
import { getPage, getPageSlugs } from '@/lib/pages';
import { seoMetadata } from '@/lib/seo';
import { mediaUrl } from '@/lib/strapi';

/**
 * Obecná šablona (collection `page`): úvod (titulek, perex, CTA, obálka) + bloky z dynamic zone.
 * Statické routy (/akce, /kontakt, /prihlaska…) mají přednost před tímto slugem.
 */

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return seoMetadata(page.seo, { title: page.title, description: page.perex, image: page.cover, path: `/${slug}` });
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const cover = mediaUrl(page.cover);

  return (
    <>
      <PageIntro title={page.title} perex={page.perex}>
        {page.cta && (
          <Button href={page.cta.url} variant={page.cta.variant ?? 'primary'} newTab={Boolean(page.cta.newTab)}>
            {page.cta.label}
          </Button>
        )}
      </PageIntro>

      {cover && (
        <div className="container pb-16 xl:pb-[110px]">
          <div className="relative aspect-[1440/560] overflow-hidden bg-grey-muted">
            <CmsImage
              src={cover}
              alt={page.cover?.alternativeText ?? ''}
              fill
              priority
              sizes="(min-width: 1520px) 1440px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <Blocks blocks={page.blocks} />
    </>
  );
}
