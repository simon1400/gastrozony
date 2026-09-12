import type { ReactNode } from 'react';
import { renderFlecks } from '@/lib/flecks';

/** Úvod podstránky: H1 s fleky + perex (+ volitelně tlačítko). Typografie jako hero HP, bez dekoru. */
export const PageIntro = ({
  title,
  perex,
  className = '',
  children,
}: {
  title: string;
  perex?: string | null;
  className?: string;
  children?: ReactNode;
}) => (
  <div className={`container pb-10 pt-12 xl:pb-[60px] xl:pt-[90px] ${className}`}>
    <h1 className="max-w-[1000px] text-h1">{renderFlecks(title)}</h1>
    {perex && <p className="mt-6 max-w-[680px] text-lead xl:mt-[37px]">{perex}</p>}
    {children && <div className="mt-8 xl:mt-10">{children}</div>}
  </div>
);
