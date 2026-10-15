import type { ReactNode } from 'react';
import { renderFlecks } from '@/lib/flecks';
import { IntroFood } from './IntroFood';

/**
 * Úvod podstránky: H1 s fleky + perex (+ volitelně obsah pod ním — tlačítko, kontakty).
 * Typografie jako hero HP; `decor` — vpravo jídlo a žluté skvrny z hero (≥ lg).
 */
export const PageIntro = ({
  title,
  perex,
  className = '',
  decor = false,
  children,
}: {
  title: string;
  perex?: string | null;
  className?: string;
  decor?: boolean;
  children?: ReactNode;
}) => {
  const text = (
    <>
      <h1 className="max-w-[1000px] text-h1">{renderFlecks(title)}</h1>
      {perex && <p className="mt-6 max-w-[680px] text-lead xl:mt-[37px]">{perex}</p>}
      {children && <div className="mt-8 xl:mt-10">{children}</div>}
    </>
  );

  const intro = (
    <div className={`container pb-10 pt-12 xl:pb-[60px] xl:pt-[90px] ${className}`}>
      {decor ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-x-12 xl:gap-x-20">
          <div className="relative z-10">{text}</div>
          <IntroFood className="max-w-[580px] justify-self-end" />
        </div>
      ) : (
        text
      )}
    </div>
  );

  // дрейф клякс не должен давать горизонтальный скролл (clip, а не hidden — по вертикали не режем)
  return decor ? <div className="overflow-x-clip">{intro}</div> : intro;
};
