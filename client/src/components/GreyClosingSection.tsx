import type { CSSProperties, ReactNode } from 'react';
import { SectionEdge, edgeHeight } from './SectionEdge';

/**
 * Poslední (šedá) sekce podstránky nad newsletterem: vlna nahoře (kromka šedé sekce HP),
 * pozadí protažené pod horní vlnu newsletteru — ta je žlutá jen pod křivkou
 * (stejný trik jako EventsSection na HP, jen šedě).
 */
export const GreyClosingSection = ({ labelledBy, children }: { labelledBy?: string; children: ReactNode }) => (
  <section
    aria-labelledby={labelledBy}
    className="relative mb-[calc(-1*var(--nl-band))]"
    style={{ '--nl-band': edgeHeight('darkBottom') } as CSSProperties}
  >
    <SectionEdge edge="greyTop" fill="var(--color-grey-bg)" />
    <div className="bg-grey-bg pb-[calc(4rem+var(--nl-band))] xl:pb-[calc(114px+var(--nl-band))]">
      <div className="container pt-6 xl:pt-10">{children}</div>
    </div>
  </section>
);
