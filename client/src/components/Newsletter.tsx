import Image from 'next/image';
import type { CSSProperties } from 'react';
import { strapiFetch } from '@/lib/strapi';
import { SectionEdge, edgeHeight } from './SectionEdge';
import { NewsletterForm, type NewsletterTexts } from './NewsletterForm';

/**
 * Блок newsletter — всегда над патичкой (см. layout.tsx). Макет y 4111…4763:
 * жёлтая секция, волна сверху (кривая низа тёмной секции) и снизу,
 * слева H2 41/47 + текст 680, справа белая карта 680×243 с формой.
 * Декор (≥ xl — ниже ему не хватает места над патичкой): пицца слева обрезана нижней волной,
 * бургер 582 справа висит между секциями и заходит на патичку (z-20). Координаты от краёв контейнера, как в XD.
 *
 * Нижняя кромка заливается цветом патички, а не белым: жёлтое переходит прямо в тёмное,
 * без белой полосы между ними. Заливка идёт поверх пиццы — потому кривая её и обрезает.
 */

const FALLBACK: NewsletterTexts = {
  title: 'Nezmeškejte žádnou akci',
  text: 'Přihlaste se k odběru novinek. Nové termíny, volná místa v zónách a otevřené přihlášky pro prodejce — vždy dřív než veřejnost.',
  emailLabel: 'Váš e-mail',
  placeholder: 'jmeno@email.cz',
  buttonLabel: 'Odebírat',
  consentText: 'Souhlasím se zpracováním osobních údajů pro zasílání novinek. Odhlásit se lze kdykoli.',
  successText: 'Děkujeme! Jste přihlášeni k odběru.',
  errorText: 'Něco se pokazilo, zkuste to prosím znovu.',
};

async function getTexts(): Promise<NewsletterTexts & { enabled: boolean }> {
  try {
    const { data } = await strapiFetch<{ [K in keyof NewsletterTexts]?: string | null } & { enabled?: boolean }>(
      '/newsletter',
      { revalidate: 300 },
    );
    const pick = (k: keyof NewsletterTexts) => data?.[k] || FALLBACK[k];
    return {
      title: pick('title'),
      text: pick('text'),
      emailLabel: pick('emailLabel'),
      placeholder: pick('placeholder'),
      buttonLabel: pick('buttonLabel'),
      consentText: pick('consentText'),
      successText: pick('successText'),
      errorText: pick('errorText'),
      enabled: data?.enabled ?? true,
    };
  } catch {
    return { ...FALLBACK, enabled: true };
  }
}

/** Левый край контента контейнера (1440 по центру, поля 40 на lg+). */
const CONTENT_LEFT = 'max((100% - 1440px) / 2, 40px)';
const CONTENT_RIGHT = 'min((100% + 1440px) / 2, 100% - 40px)';

export const Newsletter = async () => {
  const { enabled, ...texts } = await getTexts();
  if (!enabled) return null;

  return (
    <section
      aria-labelledby="newsletter-title"
      className="relative z-20 overflow-x-clip"
      style={{ '--nl-band': edgeHeight('darkBottom') } as CSSProperties}
    >
      <SectionEdge edge="darkBottom" fill="var(--color-yellow)" />
      <div className="bg-yellow">
        <div className="container grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-x-20 xl:pb-[101px] xl:pt-[114px]">
          <div>
            <h2 id="newsletter-title" className="text-h2-sm">
              {texts.title}
            </h2>
            <p className="mt-6 max-w-[680px] text-body xl:mt-[37px]">{texts.text}</p>
          </div>
          <NewsletterForm texts={texts} />
        </div>
        {/* жёлтая полоса под контентом — по ней проходит нижняя кромка */}
        <div style={{ height: edgeHeight('yellowBottom') }} />
      </div>

      {/* пицца (Mask Group 3) — лежит на жёлтом, но под заливкой нижней кромки, которая её и обрезает */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block">
        <div
          className="absolute h-[410px] w-[400.8px] origin-top-left"
          style={{
            left: `calc(${CONTENT_LEFT} - 388px)`,
            top: 'calc(var(--nl-band) + 601.5px)',
            transform: 'matrix(0.342,-0.9397,0.9397,0.342,0,0)',
            filter: 'drop-shadow(0 0 10px rgb(0 0 0 / 0.35))',
          }}
        >
          <Image src="/food/pizza-big.png" alt="" fill sizes="410px" quality={80} className="object-contain" />
        </div>
      </div>

      {/* нижняя кромка: тёмным заливаем то, что под кривой — дальше сразу патичка */}
      <div className="absolute inset-x-0 bottom-0">
        <SectionEdge edge="yellowBottom" side="below" fill="var(--color-ink)" />
      </div>

      {/* бургер (burger-2025 582×582 @ 1553,4450, +12°) */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden h-[582px] w-[582px] origin-top-left xl:block"
        style={{
          left: `calc(${CONTENT_RIGHT} - 127px)`,
          top: 'calc(var(--nl-band) + 241.9px)',
          transform: 'matrix(0.9781,0.2079,-0.2079,0.9781,0,0)',
          filter: 'drop-shadow(0 0 10px rgb(0 0 0 / 0.35))',
        }}
      >
        <Image src="/food/burger-big.png" alt="" fill sizes="582px" quality={80} className="object-contain" />
      </div>
    </section>
  );
};
