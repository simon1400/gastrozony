import { Button, type ButtonVariant } from '@/components/Button';
import { NumberedCardList, Stat, Tag } from '@/components/Card';
import { CmsImage } from '@/components/CmsImage';
import { EventGallery, type GalleryImage } from '@/components/EventGallery';
import { EventGrid } from '@/components/EventGrid';
import { LogoCluster } from '@/components/home/ClientsSection';
import { RichText } from '@/components/RichText';
import { groupByStatus, type EventSummary } from '@/lib/events';
import { renderFlecks } from '@/lib/flecks';
import type { Cta } from '@/lib/homepage';
import type {
  AccordionBlockData,
  Background,
  CardsBlockData,
  CtaBlockData,
  EventsBlockData,
  GalleryBlockData,
  ImageTextBlockData,
  LogosBlockData,
  StatsBlockData,
  TagsBlockData,
  TextBlockData,
} from '@/lib/pages';
import { mediaUrl } from '@/lib/strapi';

/** Bloky obecné šablony — typografie a rozměry z HP (H2 61/70, karty 427, štítky 66, tlačítka 66). */

const CtaButton = ({ cta, variant }: { cta: Cta | null; variant?: ButtonVariant }) =>
  cta ? (
    <Button href={cta.url} variant={variant ?? cta.variant ?? 'primary'} newTab={Boolean(cta.newTab)}>
      {cta.label}
    </Button>
  ) : null;

const Heading = ({ title, small = false }: { title: string | null; small?: boolean }) =>
  title ? <h2 className={small ? 'text-h2-sm' : 'text-h2'}>{renderFlecks(title)}</h2> : null;

/** Nadpis vlevo, text vpravo — jako úvody sekcí HP. */
const SplitIntro = ({ title, text }: { title: string | null; text: string | null }) =>
  title || text ? (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-20">
      <Heading title={title} />
      {text && <p className="text-body lg:pt-[7px]">{text}</p>}
    </div>
  ) : null;

export const TextBlock = ({ block }: { block: TextBlockData }) => (
  <div>
    <Heading title={block.title} small />
    <RichText className={`max-w-[800px] ${block.title ? 'mt-8 xl:mt-10' : ''}`}>{block.body}</RichText>
  </div>
);

export const GalleryBlock = ({ block }: { block: GalleryBlockData }) => {
  const images: GalleryImage[] = (block.images ?? []).flatMap((m) => {
    const src = mediaUrl(m);
    return src ? [{ src, alt: m.alternativeText ?? '' }] : [];
  });
  if (images.length === 0) return null;
  return (
    <div>
      <Heading title={block.title} small />
      <div className={block.title ? 'mt-10 xl:mt-14' : ''}>
        <EventGallery images={images} columns={block.columns ?? 3} />
      </div>
    </div>
  );
};

const CTA_CARD: Record<NonNullable<CtaBlockData['background']>, string> = {
  yellow: 'bg-yellow text-ink',
  white: 'bg-white text-ink shadow-card',
  grey: 'bg-grey-bg text-ink',
  black: 'bg-ink text-white',
};

/** CTA jako karta uvnitř sekce — žlutý pruh přes celou šířku by splynul s newsletterem pod ním. */
export const CtaBlock = ({ block }: { block: CtaBlockData }) => {
  const card = block.background ?? 'yellow';
  // žluté tlačítko na žluté kartě by zmizelo
  const variant: ButtonVariant | undefined = card === 'yellow' && (block.cta?.variant ?? 'primary') === 'primary' ? 'dark' : undefined;
  return (
    <div
      className={`grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-20 xl:px-20 xl:py-[70px] ${CTA_CARD[card]}`}
    >
      <div>
        {block.title && <h2 className="text-h2-sm">{renderFlecks(block.title)}</h2>}
        {block.text && <p className="mt-4 max-w-[680px] text-lead">{block.text}</p>}
      </div>
      <CtaButton cta={block.cta} variant={variant} />
    </div>
  );
};

const CARD_BG: Record<Background, string> = {
  white: 'bg-grey-bg',
  grey: 'bg-white',
  black: 'bg-white text-ink',
};

export const CardsBlock = ({ block, background }: { block: CardsBlockData; background: Background }) => (
  <div>
    <SplitIntro title={block.title} text={block.text} />
    <NumberedCardList
      cards={block.items}
      cardClassName={CARD_BG[background]}
      className={block.title || block.text ? 'mt-16 xl:mt-[65px]' : 'mt-8'}
    />
  </div>
);

export const TagsBlock = ({ block }: { block: TagsBlockData }) => (
  <div>
    {block.title && <h2 className="text-h2-sm">{block.title}</h2>}
    <ul className={`flex flex-wrap gap-5 ${block.title ? 'mt-8 xl:mt-[44px]' : ''}`}>
      {block.items.map((t) => (
        <li key={t.id}>
          <Tag>{t.label}</Tag>
        </li>
      ))}
    </ul>
  </div>
);

export const LogosBlock = ({ block }: { block: LogosBlockData }) => (
  <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-20">
    <div className="lg:pt-[78px]">
      <Heading title={block.title} />
      {block.text && <p className="mt-8 max-w-[680px] text-body xl:mt-[53px]">{block.text}</p>}
      {block.cta && (
        <div className="mt-8 xl:mt-[43px]">
          <CtaButton cta={block.cta} />
        </div>
      )}
    </div>
    <LogoCluster logos={block.logos} moreLabel={block.moreLabel} />
  </div>
);

export const StatsBlock = ({ block }: { block: StatsBlockData }) => (
  <ul className="flex flex-wrap gap-x-16 gap-y-8">
    {block.items.map((s) => (
      <li key={s.id}>
        <Stat value={s.value} label={s.label} />
      </li>
    ))}
  </ul>
);

export const ImageTextBlock = ({ block }: { block: ImageTextBlockData }) => {
  const image = block.image?.[0] ?? null;
  const src = mediaUrl(image);
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-x-20">
      {src && (
        <div className={`relative aspect-[4/3] overflow-hidden bg-grey-muted ${block.imagePosition === 'left' ? '' : 'lg:order-2'}`}>
          <CmsImage
            src={src}
            alt={image?.alternativeText ?? ''}
            fill
            sizes="(min-width: 1520px) 680px, (min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div>
        <Heading title={block.title} />
        <RichText className={block.title ? 'mt-8 xl:mt-10' : ''}>{block.body}</RichText>
        {block.cta && (
          <div className="mt-10">
            <CtaButton cta={block.cta} />
          </div>
        )}
      </div>
    </div>
  );
};

export const EventsBlock = ({ block, events }: { block: EventsBlockData; events: EventSummary[] }) => {
  const { aktualni, pripravujeme, ukonceno } = groupByStatus(events);
  const upcoming = [...aktualni, ...pripravujeme];
  const pool = block.filter === 'past' ? ukonceno : block.filter === 'all' ? [...upcoming, ...ukonceno] : upcoming;
  const list = pool.slice(0, block.limit ?? 3);
  return (
    <div>
      <SplitIntro title={block.title} text={block.text} />
      {list.length > 0 && <EventGrid events={list} showMeta className="mt-16 xl:mt-[90px]" />}
      {block.cta && (
        <div className="mt-12 xl:mt-[73px]">
          <CtaButton cta={block.cta} />
        </div>
      )}
    </div>
  );
};

/** FAQ na nativním <details> — funguje bez JS, klávesnicí i čtečkou. */
export const AccordionBlock = ({ block }: { block: AccordionBlockData }) => (
  <div className="max-w-[1000px]">
    <Heading title={block.title} small />
    <div className={`divide-y divide-current/15 border-y border-current/15 ${block.title ? 'mt-10 xl:mt-12' : ''}`}>
      {block.items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-h4 font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow text-[26px] leading-none text-ink transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <RichText className="max-w-[800px] pb-8">{item.answer}</RichText>
        </details>
      ))}
    </div>
  </div>
);
