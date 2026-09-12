import { NumberedCardList, Tag } from '@/components/Card';
import { SectionEdge } from '@/components/SectionEdge';
import { renderFlecks } from '@/lib/flecks';
import { paragraphs, type Homepage } from '@/lib/homepage';

/**
 * Серая секция (макет y 1104…2200): H2 61/70 слева, 2 абзаца справа (x 1000, w 680),
 * карты 01/02/03 427×246 с кругом-номером наполовину над картой, «Stavíme pro:» + теги.
 * z-10 — верхняя волна перекрывает еду из hero, как в макете.
 */
export const IntroSection = ({ intro, cards, tagsTitle, tags }: Pick<Homepage, 'intro' | 'cards' | 'tagsTitle' | 'tags'>) => (
  <section className="relative z-10" aria-labelledby="intro-title">
    <SectionEdge edge="greyTop" fill="var(--color-grey-bg)" />
    <div className="bg-grey-bg">
      <div className="container pb-10 pt-12 xl:pb-[20px] xl:pt-[94px]">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-20">
          <h2 id="intro-title" className="text-h2">
            {renderFlecks(intro.title)}
          </h2>
          <div className="space-y-[18px] text-body lg:pt-[7px]">
            {paragraphs(intro.text).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        {cards.length > 0 && <NumberedCardList cards={cards} className="mt-16 xl:mt-[65px]" />}

        {tags.length > 0 && (
          <>
            <h3 className="mt-16 text-h2-sm xl:mt-[105px]">{tagsTitle}</h3>
            <ul className="mt-8 flex flex-wrap gap-5 xl:mt-[44px]">
              {tags.map((t) => (
                <li key={t.label}>
                  <Tag>{t.label}</Tag>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
    <SectionEdge edge="greyBottom" fill="var(--color-grey-bg)" />
  </section>
);
