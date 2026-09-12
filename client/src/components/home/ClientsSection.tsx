import type { CSSProperties } from 'react';
import { Button } from '@/components/Button';
import { CmsImage } from '@/components/CmsImage';
import { renderFlecks } from '@/lib/flecks';
import type { ClientLogo, Homepage } from '@/lib/homepage';
import { mediaUrl } from '@/lib/strapi';

/**
 * Белая секция клиентов (макет y 2200…2858): слева H2 + текст 680 + кнопка,
 * справа свободная раскладка логотипов (коробка 680×471 с x 1000, y 2270) и «a další…»
 * на круглом флеке (Path 22, blur 21). Раскладка в % коробки → масштабируется целиком.
 * Логотипы парят (.gz-float), флек дрейфует так же, как пятна в hero (.gz-blob).
 */

/**
 * Слоты первых 4 логотипов (x, y, w, h в % коробки 680×471) — из XD.
 * `f` — парение: амплитуды сдвига (% от логотипа), покачивания, период и фаза.
 * У каждого свои, чтобы кластер не колыхался единым куском.
 */
const SLOTS = [
  { l: 0, t: 10.828, w: 35.588, h: 35.669, f: { x: '2.4%', y: '4%', r: '1.2deg', dur: '8s', delay: '-1.5s' } }, // Pilsner Fest 242×168 @ 1000,2321
  { l: 53.382, t: 0, w: 32.5, h: 46.921, f: { x: '2%', y: '3.2%', r: '0.9deg', dur: '6.5s', delay: '-4s' } }, // Burger Arena 221×221 @ 1363,2270
  { l: 10.441, t: 56.9, w: 29.706, h: 43.1, f: { x: '2.6%', y: '3.6%', r: '1.4deg', dur: '9s', delay: '-6s' } }, // BSF 202×203 @ 1071,2538
  { l: 64.118, t: 68.153, w: 35.882, h: 22.93, f: { x: '1.8%', y: '5.2%', r: '1deg', dur: '7.2s', delay: '-2.5s' } }, // Hip Hop Žije 244×108 @ 1436,2591
] as const;

const FLECK_D =
  'M223.516,586.514c-6.152-63.075-9.312-87.7,18.92-111.815s43.183,31.108,94.005,15.339,16.274-91.889,115.968-44.009,82.345,43.472,92.153,91.746-15.877,85.833-52.923,101.35-46.831-20.085-90.367-31.537-59.142-13.332-102.8,0S229.669,649.589,223.516,586.514Z';

const LogoImage = ({ logo, sizes }: { logo: ClientLogo; sizes: string }) => {
  const src = mediaUrl(logo.logo);
  if (!src) return null;
  const img = <CmsImage src={src} alt={logo.logo?.alternativeText ?? logo.name} fill sizes={sizes} className="object-contain" />;
  return logo.url ? (
    <a href={logo.url} target="_blank" rel="noopener noreferrer" className="relative block size-full" aria-label={logo.name}>
      {img}
    </a>
  ) : (
    <div className="relative size-full">{img}</div>
  );
};

export const LogoCluster = ({ logos, moreLabel }: { logos: ClientLogo[]; moreLabel: string | null }) => {
  const placed = logos.slice(0, SLOTS.length);
  const rest = logos.slice(SLOTS.length);
  return (
    <div>
      <div className="relative mx-auto aspect-[680/471] w-full max-w-[680px] [container-type:inline-size]">
        <svg
          aria-hidden
          viewBox="0 0 453.309 338.555"
          preserveAspectRatio="none"
          className="gz-blob gz-blob--a absolute left-[15.147%] top-[16.773%] h-[71.975%] w-[66.663%] blur-[3.09cqw]"
          style={
            {
              // амплитуды скромнее, чем в hero: под кляксой лежит «a další…», текст не должен вылезти
              '--blob-x': '8%',
              '--blob-y': '10%',
              '--blob-s': 0.12,
              '--blob-r': '4deg',
              '--blob-dur': '19s',
              '--blob-delay': '-5s',
            } as CSSProperties
          }
        >
          <path d={FLECK_D} transform="translate(-156.355 -367.423)" fill="#FFD100" />
        </svg>
        {placed.map((logo, i) => {
          const s = SLOTS[i];
          return (
            <div
              key={logo.id}
              // multiply на самой обёртке: логотипы с белым (непрозрачным) фоном не перекрывают
              // флек «a další…». Ставить его глубже нельзя — парение изолирует наложение.
              className="gz-float absolute mix-blend-multiply"
              style={
                {
                  left: `${s.l}%`,
                  top: `${s.t}%`,
                  width: `${s.w}%`,
                  height: `${s.h}%`,
                  '--float-x': s.f.x,
                  '--float-y': s.f.y,
                  '--float-r': s.f.r,
                  '--float-dur': s.f.dur,
                  '--float-delay': s.f.delay,
                } as CSSProperties
              }
            >
              <LogoImage logo={logo} sizes="(min-width: 1024px) 250px, 36vw" />
            </div>
          );
        })}
        {moreLabel && (
          <p className="absolute left-[49.56%] top-[52.44%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[6.47cqw] font-extrabold leading-[1.136]">
            {moreLabel}
          </p>
        )}
      </div>
      {rest.length > 0 && (
        <ul className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {rest.map((logo) => (
            <li key={logo.id} className="relative aspect-[3/2] mix-blend-multiply">
              <LogoImage logo={logo} sizes="160px" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ClientsSection = ({ clients }: Pick<Homepage, 'clients'>) => (
  <section className="relative bg-white" aria-labelledby="clients-title">
    <div className="container grid gap-12 pb-16 pt-12 lg:grid-cols-2 lg:gap-x-20 xl:pb-[109px] xl:pt-[70px]">
      <div className="lg:pt-[78px]">
        <h2 id="clients-title" className="text-h2">
          {renderFlecks(clients.title)}
        </h2>
        {clients.text && <p className="mt-8 max-w-[680px] text-body xl:mt-[53px]">{clients.text}</p>}
        {clients.cta && (
          <div className="mt-8 xl:mt-[43px]">
            <Button href={clients.cta.url} variant={clients.cta.variant} newTab={clients.cta.newTab}>
              {clients.cta.label}
            </Button>
          </div>
        )}
      </div>
      <LogoCluster logos={clients.logos} moreLabel={clients.moreLabel} />
    </div>
  </section>
);
