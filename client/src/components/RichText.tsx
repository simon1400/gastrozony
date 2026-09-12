import Link from 'next/link';
import Markdown, { type Components } from 'react-markdown';

/**
 * Rich text ze Strapi (markdown) ve stylu webu. Surové HTML se nevykresluje (výchozí chování react-markdown).
 * Interní odkazy (/…) → next/link, externí http(s) → nová záložka.
 */

const linkClass =
  'font-extrabold underline decoration-yellow decoration-[3px] underline-offset-4 transition-colors hover:decoration-ink';

const components: Components = {
  h2: ({ children }) => <h2 className="mt-12 text-h3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-10 text-h4 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mt-6 first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-6 space-y-2 first:mt-0 [&>li]:relative [&>li]:pl-8 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:size-3 [&>li]:before:rounded-full [&>li]:before:bg-yellow">
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="mt-6 list-decimal space-y-2 pl-6 first:mt-0 marker:font-extrabold">{children}</ol>,
  strong: ({ children }) => <strong className="font-extrabold">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="mt-6 border-l-4 border-yellow pl-6 first:mt-0">{children}</blockquote>,
  a: ({ href = '', children }) =>
    href.startsWith('/') ? (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    ) : (
      <a
        href={href}
        className={linkClass}
        {...(/^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    ),
};

export const RichText = ({ children, className = '' }: { children: string | null | undefined; className?: string }) =>
  children ? (
    <div className={`text-body ${className}`}>
      <Markdown components={components}>{children}</Markdown>
    </div>
  ) : null;

const inlineComponents: Components = { ...components, p: ({ children }) => <>{children}</> };

/** Jednořádkový markdown bez odstavců — popisky checkboxů (souhlas s odkazem na GDPR). */
export const RichInline = ({ children }: { children: string }) => (
  <Markdown components={inlineComponents}>{children}</Markdown>
);
