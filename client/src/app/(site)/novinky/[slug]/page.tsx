import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleGrid } from '@/components/ArticleCard';
import { BackLink } from '@/components/BackLink';
import { Badge } from '@/components/Badge';
import { CmsImage } from '@/components/CmsImage';
import { GreyClosingSection } from '@/components/GreyClosingSection';
import { RichText } from '@/components/RichText';
import {
  articleDate,
  formatArticleDate,
  getArticleBySlug,
  getArticleSlugs,
  getBlogPage,
  getOtherArticles,
} from '@/lib/articles';
import { seoMetadata } from '@/lib/seo';
import { mediaUrl } from '@/lib/strapi';

/** Detail článku: datum, titulek, perex, obálka, obsah (markdown) a „Další články“. ISR 60. */

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getArticleSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const metadata = await seoMetadata(article.seo, {
    title: article.title,
    description: article.perex,
    image: article.cover,
    path: `/novinky/${slug}`,
  });
  const date = articleDate(article);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article', ...(date ? { publishedTime: date } : {}) } };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, blog, others] = await Promise.all([getArticleBySlug(slug), getBlogPage(), getOtherArticles(slug)]);
  if (!article) notFound();

  const cover = mediaUrl(article.cover);
  const date = articleDate(article);

  return (
    <article>
      <div className={`container pt-10 xl:pt-[70px] ${others.length > 0 ? 'pb-16 xl:pb-[100px]' : 'pb-20 xl:pb-[140px]'}`}>
        <BackLink href="/novinky">{blog.backLabel}</BackLink>

        <header className="mt-8 max-w-[1000px] xl:mt-12">
          {date && (
            <Badge>
              <time dateTime={date}>{formatArticleDate(date)}</time>
            </Badge>
          )}
          <h1 className="mt-6 text-h2">{article.title}</h1>
          {article.perex && <p className="mt-6 max-w-[800px] text-lead">{article.perex}</p>}
        </header>

        {cover && (
          <div className="relative mt-10 aspect-[1440/640] overflow-hidden bg-grey-muted xl:mt-14">
            <CmsImage
              src={cover}
              alt={article.cover?.alternativeText ?? ''}
              fill
              priority
              sizes="(min-width: 1520px) 1440px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <RichText className="mt-12 max-w-[800px] xl:mt-16">{article.content}</RichText>
      </div>

      {others.length > 0 && (
        <GreyClosingSection labelledBy="more-articles">
          <h2 id="more-articles" className="text-h2-sm">
            {blog.moreTitle}
          </h2>
          <ArticleGrid articles={others} className="mt-14 xl:mt-16" />
        </GreyClosingSection>
      )}
    </article>
  );
}
