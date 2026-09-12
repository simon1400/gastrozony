import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleGrid } from '@/components/ArticleCard';
import { GreyClosingSection } from '@/components/GreyClosingSection';
import { PageIntro } from '@/components/PageIntro';
import { Pagination } from '@/components/Pagination';
import { getArticles, getBlogPage } from '@/lib/articles';
import { seoMetadata } from '@/lib/seo';

/**
 * /novinky — výpis článků po 9 (`?strana=N`; 1. strana bez parametru), nejnovější nahoře.
 * Texty ze single type `blog-page`. Strana mimo rozsah → 404.
 */

type Props = { searchParams: Promise<{ strana?: string | string[] }> };

const parsePage = (value: string | string[] | undefined): number | null => {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  return Number(value);
};

const hrefFor = (page: number) => (page === 1 ? '/novinky' : `/novinky?strana=${page}`);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).strana);
  const blog = await getBlogPage();
  const metadata = await seoMetadata(blog.seo, { title: blog.title, description: blog.perex, path: '/novinky' });
  // další strany výpisu: kanonická je první, do indexu nepatří
  return page && page > 1 ? { ...metadata, alternates: { canonical: '/novinky' }, robots: { index: false, follow: true } } : metadata;
}

export default async function BlogListPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).strana);
  if (page === null) notFound();

  const [blog, { articles, pageCount }] = await Promise.all([getBlogPage(), getArticles(page)]);
  if (page > pageCount) notFound();

  return (
    <>
      <PageIntro title={blog.title} perex={blog.perex} />
      <GreyClosingSection>
        {articles.length > 0 ? (
          <ArticleGrid articles={articles} className="mt-8" />
        ) : (
          <p className="max-w-[680px] text-lead">{blog.emptyText}</p>
        )}
        {pageCount > 1 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            hrefFor={hrefFor}
            prevLabel={blog.prevLabel}
            nextLabel={blog.nextLabel}
            className="mt-16 xl:mt-20"
          />
        )}
      </GreyClosingSection>
    </>
  );
}
