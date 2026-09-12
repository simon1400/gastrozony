import Image from 'next/image';
import type { CSSProperties } from 'react';

/**
 * Еда и жёлтые пятна hero — декор, статикой (не CMS).
 *
 * Все координаты и матрицы поворота — из AGC-JSON артборда (design/specs/hp.agc.json),
 * в пикселях артборда 1920. «Сцена» — окно в эти координаты: `--fx/--fy` (левый верх),
 * `--fw/--fh` (размер). Элементы позиционируются в % от сцены, поэтому вся композиция
 * масштабируется целиком:
 *   ≥ xl — окно = контейнер 1440 (x 240…1680) → на 1920 совпадает с макетом 1:1;
 *   lg   — окно шире, еда уезжает в правую половину;
 *   < lg — сцена в потоке под кнопками, окно обрезано по еде.
 */

type Matrix = readonly [number, number, number, number];

type Food = {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  m: Matrix;
  shadow: boolean;
  sizes: string;
  priority?: boolean;
  /**
   * Парение: амплитуды сдвига (% от картинки) и покачивания, период, фаза
   * и задержка появления. Крупные куски качает меньше — иначе выглядит мультяшно.
   */
  anim: {
    x: string;
    y: string;
    r: string;
    dur: string;
    delay: string;
    in: string;
  };
  /**
   * Глубина параллакса: на сколько vh еда отстаёт от прокрутки и тянется вниз,
   * догоняя её. Больше число — ленивее кусок.
   */
  depth: string;
};

const ROT_FRIES: Matrix = [0.9455, -0.3256, 0.3256, 0.9455]; // −19°
const ROT_PIZZA: Matrix = [0.342, -0.9397, 0.9397, 0.342]; // −70°
const ROT_BURGER: Matrix = [0.9781, 0.2079, -0.2079, 0.9781]; // +12°

/** Порядок = порядок слоёв в XD (снизу вверх). */
const FOOD: Food[] = [
  { src: '/food/hranolky.png', x: 1253, y: 853.4, w: 271.6, h: 363.4, m: ROT_FRIES, shadow: false, sizes: '(min-width: 1024px) 280px, 30vw', anim: { x: '0.7%', y: '2.6%', r: '0.9deg', dur: '6.5s', delay: '-1.2s', in: '0.3s' }, depth: '5' },
  { src: '/food/pizza-big.png', x: 1421.7, y: 830.8, w: 400.8, h: 410, m: ROT_PIZZA, shadow: true, sizes: '(min-width: 1024px) 410px, 42vw', priority: true, anim: { x: '0.4%', y: '1.7%', r: '0.5deg', dur: '7.5s', delay: '-3s', in: '0.1s' }, depth: '19' },
  { src: '/food/pizza-small.png', x: 909, y: 440.8, w: 199.8, h: 205, m: ROT_PIZZA, shadow: true, sizes: '(min-width: 1024px) 210px, 22vw', anim: { x: '1%', y: '3.4%', r: '1.2deg', dur: '5.5s', delay: '-2s', in: '0.25s' }, depth: '9' },
  { src: '/food/burger-small.png', x: 1100.3, y: 606.6, w: 232.5, h: 225.7, m: ROT_FRIES, shadow: true, sizes: '(min-width: 1024px) 240px, 25vw', anim: { x: '0.9%', y: '3%', r: '1.1deg', dur: '6s', delay: '-4s', in: '0.2s' }, depth: '14' },
  { src: '/food/burger-big.png', x: 1231.7, y: 182.7, w: 379.9, h: 379.9, m: ROT_BURGER, shadow: true, sizes: '(min-width: 1024px) 380px, 40vw', priority: true, anim: { x: '0.5%', y: '1.9%', r: '0.6deg', dur: '8s', delay: '-0.5s', in: '0s' }, depth: '24' },
];

/** Большие кляксы за едой (Path 12/13/14/16/24/25): контур, матрица и blur из XD. */
const BLOB_A =
  'M1134.842,263.335c-30.377-22.514-48.009-10-69.527,22.5s.931,80.943-16.7,116.9-17.663,64.015-2.3,91.923c5.345,9.712,27.978,25.452,27.978,25.452s11.6,11.916,37.8,2.607c14.227-5.054,19.425,3.376,37.461-32.7s31.61-71.183,34.684-111.613c.8-10.514,6.046-35.439-6.3-64.207S1160.116,282.066,1134.842,263.335Z';

type Blob = {
  d: string;
  /** Матрица из XD — кладёт контур в координаты артборда. */
  m: string;
  blur: 16 | 46 | 50;
  /** Габарит кляксы в координатах артборда (посчитан по контуру + матрице). */
  box: readonly [number, number, number, number];
  /**
   * Дрейф: амплитуды сдвига в % от самой кляксы (подобраны под её габарит, чтобы путь
   * был сопоставим у крупных и мелких), масштаб, поворот, период и маршрут (a или b).
   */
  anim: {
    x: string;
    y: string;
    s: number;
    r: string;
    dur: string;
    delay: string;
    path: 'a' | 'b';
  };
};

const BLOBS: Blob[] = [
  {
    d: 'M1407.958,280.8c-113.54-56.981-179.443-25.3-259.869,56.956s3.48,204.86-62.407,295.874-66.02,162.018-8.615,232.651,95.646,107.151,245.866,71.016,251.874-206.855,269.654-365.252S1521.5,337.786,1407.958,280.8Z',
    m: '-0.2588 0.9659 -0.9659 -0.2588 2541.8 -193.31',
    blur: 16,
    box: [1294, 586, 697, 611],
    anim: {
      x: '29%',
      y: '33%',
      s: 0.18,
      r: '9deg',
      dur: '21s',
      delay: '-3s',
      path: 'a',
    },
  },
  {
    d: BLOB_A,
    m: '0.0872 -0.9962 0.9962 0.0872 668.33 2192.47',
    blur: 50,
    box: [1005, 1037, 288, 170],
    anim: {
      x: '87%',
      y: '118%',
      s: 0.34,
      r: '20deg',
      dur: '16s',
      delay: '-5s',
      path: 'b',
    },
  },
  {
    d: BLOB_A,
    m: '-0.9816 0.1908 -0.1908 -0.9816 3005.68 272.05',
    blur: 50,
    box: [1766, -43, 139, 289],
    anim: {
      x: '180%',
      y: '69%',
      s: 0.36,
      r: '22deg',
      dur: '18s',
      delay: '-8s',
      path: 'a',
    },
  },
  {
    d: 'M1294.162,271.99c-78.89-39.592-124.68-17.578-180.562,39.574s2.418,142.34-43.362,205.578-45.872,112.573-5.986,161.65,66.457,74.451,170.832,49.343,175.006-143.727,187.36-253.784S1373.052,311.582,1294.162,271.99Z',
    m: '-0.5592 -0.829 0.829 -0.5592 1525.39 1668.93',
    blur: 16,
    box: [1016, 173, 502, 398],
    anim: {
      x: '40%',
      y: '45%',
      s: 0.24,
      r: '11deg',
      dur: '24s',
      delay: '-11s',
      path: 'b',
    },
  },
  {
    d: 'M1182.409,263.335c-44.861-22.514-70.9-10-102.678,22.5s1.375,80.943-24.658,116.9-26.085,64.015-3.4,91.923c7.893,9.712,41.318,25.452,41.318,25.452s17.128,11.916,55.827,2.607c21.011-5.054,28.687,3.376,55.323-32.7s46.683-71.183,51.221-111.613c1.18-10.514,8.929-35.439-9.308-64.207S1219.734,282.066,1182.409,263.335Z',
    m: '-0.4226 -0.9063 0.9063 -0.4226 1227.47 1946.56',
    blur: 46,
    box: [965, 636, 276, 211],
    anim: {
      x: '90%',
      y: '95%',
      s: 0.32,
      r: '18deg',
      dur: '15s',
      delay: '-6s',
      path: 'a',
    },
  },
  {
    d: BLOB_A,
    m: '-0.9816 0.1908 -0.1908 -0.9816 2805.15 584.49',
    blur: 46,
    box: [1566, 269, 139, 289],
    anim: {
      x: '180%',
      y: '76%',
      s: 0.38,
      r: '24deg',
      dur: '19s',
      delay: '-1s',
      path: 'b',
    },
  },
];

const place = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `calc((${x} - var(--fx)) / var(--fw) * 100%)`,
  top: `calc((${y} - var(--fy)) / var(--fh) * 100%)`,
  width: `calc(${w} / var(--fw) * 100%)`,
  height: `calc(${h} / var(--fh) * 100%)`,
});

export const HeroFood = () => (
  <div
    aria-hidden
    className={
      'pointer-events-none relative mx-auto mt-10 w-full max-w-[520px] ' +
      '[--fx:880] [--fy:150] [--fw:970] [--fh:1080] ' +
      'lg:absolute lg:inset-x-0 lg:top-0 lg:mt-0 lg:max-w-none lg:[--fx:-5] lg:[--fy:102] lg:[--fw:1828] lg:[--fh:1400] ' +
      'xl:[--fx:240] xl:[--fw:1440] xl:[--fh:1100]'
    }
    style={{ aspectRatio: 'var(--fw) / var(--fh)' }}
  >
    {/* Фильтры размытия — общие на все кляксы (каждая клякса в своём <svg> ради отдельного слоя). */}
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        {[16, 46, 50].map((b) => (
          <filter key={b} id={`gz-blob-${b}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={b} />
          </filter>
        ))}
      </defs>
    </svg>

    {BLOBS.map((b, i) => (
      <div
        key={i}
        className={`gz-blob gz-blob--${b.anim.path} absolute`}
        style={
          {
            ...place(...b.box),
            '--blob-x': b.anim.x,
            '--blob-y': b.anim.y,
            '--blob-s': b.anim.s,
            '--blob-r': b.anim.r,
            '--blob-dur': b.anim.dur,
            '--blob-delay': b.anim.delay,
          } as CSSProperties
        }
      >
        <svg viewBox={b.box.join(' ')} overflow="visible" className="h-full w-full">
          <path d={b.d} transform={`matrix(${b.m})`} fill="#FFD100" filter={`url(#gz-blob-${b.blur})`} />
        </svg>
      </div>
    ))}

    {FOOD.map((f) => (
      <div key={f.src} className="gz-parallax absolute" style={{ ...place(f.x, f.y, f.w, f.h), '--depth': f.depth } as CSSProperties}>
        <div
          className="gz-food gz-float absolute inset-0 origin-top-left"
          style={
            {
              // поворот из макета остаётся в transform; парение (.gz-float) и появление идут
              // через отдельные свойства translate/rotate/scale — они с ним не конфликтуют
              transform: `matrix(${f.m.join(',')},0,0)`,
              filter: f.shadow ? 'drop-shadow(0 0 10px rgb(0 0 0 / 0.35))' : undefined,
              '--float-x': f.anim.x,
              '--float-y': f.anim.y,
              '--float-r': f.anim.r,
              '--float-dur': f.anim.dur,
              '--float-delay': f.anim.delay,
              '--food-in-delay': f.anim.in,
            } as CSSProperties
          }
        >
          <Image src={f.src} alt="" fill sizes={f.sizes} priority={f.priority} quality={80} className="object-contain" />
        </div>
      </div>
    ))}
  </div>
);
