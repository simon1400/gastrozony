import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { SectionEdge, edgeHeight } from '@/components/SectionEdge';
import { getEvents, type EventSummary } from '@/lib/events';
import type { Background, PageBlock } from '@/lib/pages';
import {
  AccordionBlock,
  CardsBlock,
  CtaBlock,
  EventsBlock,
  GalleryBlock,
  ImageTextBlock,
  LogosBlock,
  StatsBlock,
  TagsBlock,
  TextBlock,
} from './BlockComponents';

/**
 * Dynamic zone `blocks` → sekce ve stylu HP.
 * Po sobě jdoucí bloky se stejným pozadím tvoří jednu sekci; šedá a tmavá sekce mají vlnité kromky jako na HP.
 * Bloky bez pole `background`: loga a akordeon bílé, akce tmavé (jako na HP), štítky / statistiky / galerie / CTA
 * přebírají pozadí předchozího bloku. Poslední šedá / tmavá sekce pokračuje pod horní vlnu newsletteru.
 */

export type SectionEntry = { key: string; background: Background | 'inherit'; render: (background: Background) => ReactNode };

const defaultBackground = (block: PageBlock): Background | 'inherit' => {
  switch (block.__component) {
    case 'blocks.text':
    case 'blocks.cards':
    case 'blocks.image-text':
      return block.background ?? 'white';
    case 'blocks.logos':
    case 'blocks.accordion':
      return 'white';
    case 'blocks.events':
      return 'black';
    default:
      return 'inherit';
  }
};

const renderBlock = (block: PageBlock, background: Background, events: EventSummary[]): ReactNode => {
  switch (block.__component) {
    case 'blocks.text':
      return <TextBlock block={block} />;
    case 'blocks.gallery':
      return <GalleryBlock block={block} />;
    case 'blocks.cta':
      return <CtaBlock block={block} />;
    case 'blocks.cards':
      return <CardsBlock block={block} background={background} />;
    case 'blocks.tags':
      return <TagsBlock block={block} />;
    case 'blocks.logos':
      return <LogosBlock block={block} />;
    case 'blocks.stats':
      return <StatsBlock block={block} />;
    case 'blocks.image-text':
      return <ImageTextBlock block={block} />;
    case 'blocks.events':
      return <EventsBlock block={block} events={events} />;
    case 'blocks.accordion':
      return <AccordionBlock block={block} />;
  }
};

const FILL: Record<Exclude<Background, 'white'>, string> = {
  grey: 'var(--color-grey-bg)',
  black: 'var(--color-ink)',
};

const STACK = 'container space-y-20 xl:space-y-[120px]';

const BlockSection = ({
  background,
  first,
  last,
  children,
}: {
  background: Background;
  first: boolean;
  last: boolean;
  children: ReactNode;
}) => {
  if (background === 'white') {
    return <div className={`bg-white ${first ? 'pb-16 xl:pb-[110px]' : 'py-16 xl:py-[110px]'}`}><div className={STACK}>{children}</div></div>;
  }
  return (
    <div
      className={`relative ${last ? 'mb-[calc(-1*var(--nl-band))]' : ''}`}
      style={last ? ({ '--nl-band': edgeHeight('darkBottom') } as CSSProperties) : undefined}
    >
      <SectionEdge edge={background === 'grey' ? 'greyTop' : 'darkTop'} fill={FILL[background]} />
      <div
        className={`${background === 'grey' ? 'bg-grey-bg' : 'bg-ink text-white'} ${
          last ? 'pb-[calc(4rem+var(--nl-band))] xl:pb-[calc(114px+var(--nl-band))]' : 'pb-10 xl:pb-10'
        }`}
      >
        <div className={`${STACK} pt-10 xl:pt-[70px]`}>{children}</div>
      </div>
      {!last && <SectionEdge edge="greyBottom" fill={FILL[background]} />}
    </div>
  );
};

/** Sekce z libovolných položek (bloky ze Strapi + vlastní sekce stránky, např. tým na /kontakt). */
export const SectionGroups = ({ entries }: { entries: SectionEntry[] }) => {
  const groups: { background: Background; nodes: ReactNode[] }[] = [];
  for (const entry of entries) {
    const previous = groups.at(-1);
    const background = entry.background === 'inherit' ? (previous?.background ?? 'white') : entry.background;
    const node = <Fragment key={entry.key}>{entry.render(background)}</Fragment>;
    if (previous && previous.background === background) previous.nodes.push(node);
    else groups.push({ background, nodes: [node] });
  }

  return (
    <>
      {groups.map((g, i) => (
        <BlockSection key={i} background={g.background} first={i === 0} last={i === groups.length - 1}>
          {g.nodes}
        </BlockSection>
      ))}
    </>
  );
};

export async function Blocks({ blocks, leading = [] }: { blocks: PageBlock[]; leading?: SectionEntry[] }) {
  const events = blocks.some((b) => b.__component === 'blocks.events') ? await getEvents() : [];
  const entries: SectionEntry[] = [
    ...leading,
    ...blocks.map((block) => ({
      key: `${block.__component}-${block.id}`,
      background: defaultBackground(block),
      render: (background: Background) => renderBlock(block, background, events),
    })),
  ];
  return <SectionGroups entries={entries} />;
}
