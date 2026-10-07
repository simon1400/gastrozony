import type { ReactNode } from 'react';
import type { Cta } from '@/lib/homepage';
import { mediaUrl, type StrapiMedia } from '@/lib/strapi';
import { Button } from './Button';
import { CmsImage } from './CmsImage';

/** Жёлтый кружок с номером (01/02/03) — 53×53, цифра 29/33 ExtraBold. */
export const NumberDot = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span
    className={`flex size-[53px] items-center justify-center rounded-full bg-yellow text-[29px] font-extrabold leading-[33px] text-ink ${className}`}
  >
    {children}
  </span>
);

export type NumberedCardData = {
  number: string;
  title: string;
  text: string | null;
  image?: StrapiMedia | null;
  cta?: Cta | null;
};

/**
 * Карты 01/02/03 (427×246 на 1920): круг-номер наполовину над картой, заголовок 29/33, текст 340.
 * Необязательная кнопка (`cta`) прижата к низу карты — в ряду карт кнопки стоят на одной линии.
 */
export const NumberedCardList = ({
  cards,
  cardClassName = 'bg-white',
  className = '',
}: {
  cards: NumberedCardData[];
  cardClassName?: string;
  className?: string;
}) => (
  <ul className={`grid gap-x-10 gap-y-[60px] md:grid-cols-2 xl:grid-cols-3 min-[1520px]:gap-x-20 ${className}`}>
    {cards.map((c, i) => {
      const image = mediaUrl(c.image);
      return (
        <li
          key={`${c.number}-${i}`}
          className={`relative flex flex-col px-7 pb-8 pt-12 sm:px-10 xl:min-h-[246px] xl:pb-[38px] xl:pt-[55px] ${cardClassName}`}
        >
          <NumberDot className="absolute left-7 top-[-26px] sm:left-10">{c.number}</NumberDot>
          {image && (
            <div className="relative mb-6 aspect-[16/10] overflow-hidden bg-grey-muted">
              <CmsImage
                src={image}
                alt={c.image?.alternativeText ?? ''}
                fill
                sizes="(min-width: 1520px) 347px, (min-width: 768px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
          )}
          <h3 className="text-h3">{c.title}</h3>
          {c.text && <p className="mt-[21px] max-w-[340px] text-body">{c.text}</p>}
          {c.cta?.label && c.cta.url && (
            <div className="mt-auto pt-8">
              <Button href={c.cta.url} variant={c.cta.variant ?? 'primary'} newTab={c.cta.newTab}>
                {c.cta.label}
              </Button>
            </div>
          )}
        </li>
      );
    })}
  </ul>
);

/** Статистика (жёлтая черта 4×80 + число 49/56): клиентский — со счётчиком и выездом из-под черты. */
export { Stat } from './Stat';

/**
 * Тег «Stavíme pro»: как outline-кнопка — 66px, рамка 1px жёлтая, 19/24 ExtraBold.
 * Паддинг 27.5 (в XD 29): браузер рисует текст на ~3px шире XD — так ширины тегов совпадают с макетом.
 * На мобиле уменьшен вместе с кнопками (Button.tsx).
 */
export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex h-[50px] items-center border border-yellow bg-white px-5 text-[15px] font-extrabold leading-[20px] text-ink shadow-btn md:h-[66px] md:px-[27.5px] md:text-[19px] md:leading-[24px]">
    {children}
  </span>
);
