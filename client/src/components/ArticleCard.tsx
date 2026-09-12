import Link from 'next/link';
import { articleDate, formatArticleDate, type ArticleSummary } from '@/lib/articles';
import { mediaUrl } from '@/lib/strapi';
import { Badge } from './Badge';
import { CmsImage } from './CmsImage';

/**
 * Karta článku ve stylu karty akce: 427 široká, obálka 427×321, místo bejdže stavu žlutý bejdž s datem
 * (h 37, napůl nad obálkou), titulek 23/33, perex 18/33 (max 5 řádků). Celá karta je odkaz.
 */
export const ArticleCard = ({ article }: { article: ArticleSummary }) => {
  const src = mediaUrl(article.cover);
  const date = articleDate(article);
  return (
    <article className="group relative flex h-full flex-col bg-white text-ink">
      <div className="relative aspect-[427/321] overflow-hidden bg-grey-muted">
        {src && (
          <CmsImage
            src={src}
            alt={article.cover?.alternativeText ?? ''}
            fill
            sizes="(min-width: 1280px) 427px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>
      {date && (
        <Badge className="absolute left-7 top-[-18px] sm:left-10">
          <time dateTime={date}>{formatArticleDate(date)}</time>
        </Badge>
      )}
      <div className="flex flex-1 flex-col px-7 pb-8 pt-8 sm:px-10 xl:pb-[29px] xl:pt-[33px]">
        <h3 className="text-h4">
          <Link
            href={`/novinky/${article.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-yellow"
          >
            {article.title}
          </Link>
        </h3>
        {article.perex && <p className="mt-[19px] line-clamp-5 max-w-[340px] text-body">{article.perex}</p>}
      </div>
    </article>
  );
};

/** Mřížka jako u akcí: 3 × 427 gap 80 (≥ 1520), 2 sloupce od md, 1 na mobilu. */
export const ArticleGrid = ({ articles, className = '' }: { articles: ArticleSummary[]; className?: string }) => (
  <ul className={`grid gap-x-10 gap-y-14 md:grid-cols-2 xl:grid-cols-3 min-[1520px]:gap-x-20 ${className}`}>
    {articles.map((a) => (
      <li key={a.documentId}>
        <ArticleCard article={a} />
      </li>
    ))}
  </ul>
);
