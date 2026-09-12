import type { CSSProperties, ReactNode } from 'react';

/**
 * Žluté fleky — жёлтые кляксы за текстом.
 *
 * Заказчик пишет в админке `**text**` → слово ложится на жёлтую кляксу.
 * В XD это векторные кляксы (design/assets/Path 17/20/21/23.svg) + gaussian blur 21px.
 * Клякса — `::before` у `.fleck` (globals.css): контур как data-URI, размер и вылеты
 * за слово сняты с макета в em, blur ≈ 0.3em (21px при 61–77px заголовках).
 * Она же медленно «дышит» — период и фазу задаёт fleckStyle через CSS-переменные.
 */

const svg = (w: number, h: number, d: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><path d='${d}' transform='translate(-156.355 -367.423)' fill='%23FFD100'/></svg>`;

type Shape = {
  svg: string;
  /** Вылет кляксы за бокс слова (top right bottom left), em — по макету. */
  inset: string;
};

/** От короткого слова к длинной фразе — как в макете. */
const SHAPES: Shape[] = [
  // Path 23 — под «akce» (4 znaky)
  {
    svg: svg(354.143, 225.544, 'M222.256,503.524c-4.288-29.54-6.49-41.07,13.188-52.366s30.1,14.568,65.524,7.184,11.343-43.034,80.833-20.611,57.4,20.359,64.233,42.967-11.067,40.2-36.889,47.465-32.642-9.406-62.988-14.77-41.223-6.244-71.657,0S226.544,533.064,222.256,503.524Z'),
    inset: '-1.1em -1.65em -1.45em -1.8em',
  },
  // Path 17 — под «Gastrozóny» (10 znaků)
  {
    svg: svg(580.398, 259.966, 'M225.132,528.8c-8.541-39.754-12.927-55.272,26.266-70.474S311.348,477.935,381.9,468s22.593-57.915,161-27.738,114.319,27.4,127.934,57.824-22.042,54.1-73.473,63.878S532.348,549.3,471.908,542.083s-82.106-8.4-142.72,0S233.673,568.556,225.132,528.8Z'),
    inset: '-1.08em -0.8em -1.16em -1.04em',
  },
  // Path 20 — под «jídlo i nápoje» (14 znaků)
  {
    svg: svg(530.811, 220.923, 'M224.5,500.13c-7.609-28.168-11.516-39.163,23.4-49.934s53.407,13.892,116.264,6.85,20.128-41.036,143.428-19.654,101.844,19.414,113.973,40.972S601.93,516.7,556.112,523.625s-57.92-8.97-111.764-14.084-73.146-5.954-127.146,0S232.111,528.3,224.5,500.13Z'),
    inset: '-1.26em -1.36em -1.21em -1.26em',
  },
  // Path 21 — под «náročné klienty» (15+ znaků)
  {
    svg: svg(598, 220.923, 'M225.356,500.13c-8.872-28.168-13.428-39.163,27.283-49.934s62.272,13.892,135.562,6.85,23.468-41.036,167.234-19.654,118.747,19.414,132.89,40.972-22.9,38.331-76.319,45.261-67.533-8.97-130.314-14.084-85.286-5.954-148.249,0S234.228,528.3,225.356,500.13Z'),
    inset: '-1.13em -1.26em -1.34em -1.0em',
  },
];

const shapeFor = (text: string): Shape => {
  const n = text.trim().length;
  return SHAPES[n <= 5 ? 0 : n <= 12 ? 1 : n <= 14 ? 2 : 3];
};

export type FleckSegment = { text: string; fleck: boolean };

/** Разбить строку по `**…**` на сегменты. Незакрытые `**` остаются текстом. */
export const splitFlecks = (input: string): FleckSegment[] => {
  const segments: FleckSegment[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  for (let m = re.exec(input); m !== null; m = re.exec(input)) {
    if (m.index > last) segments.push({ text: input.slice(last, m.index), fleck: false });
    segments.push({ text: m[1], fleck: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) segments.push({ text: input.slice(last), fleck: false });
  return segments;
};

/**
 * Детерминированный хеш строки — фаза и период «дыхания» кляксы должны совпасть
 * на сервере и в браузере (иначе hydration mismatch), поэтому не Math.random().
 */
const hash = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
};

const fleckStyle = (text: string): CSSProperties => {
  const shape = shapeFor(text);
  const h = hash(text);
  return {
    '--fleck-img': `url("data:image/svg+xml,${shape.svg}")`,
    '--fleck-inset': shape.inset,
    // период 4,5…7 с и отрицательная задержка 0…−6 с: соседние кляксы не дышат в такт
    '--fleck-dur': `${4.5 + (h % 26) / 10}s`,
    '--fleck-delay': `-${((h >> 6) % 61) / 10}s`,
  } as CSSProperties;
};

/**
 * `renderFlecks('Dodáme **jídlo i nápoje** pro vaše akce')` →
 * ReactNode, где «jídlo i nápoje» лежит на жёлтой кляксе.
 * Применять ко всем заголовкам, приходящим из Strapi.
 */
export const renderFlecks = (input: string | null | undefined): ReactNode => {
  if (!input) return null;
  const segments = splitFlecks(input);
  if (segments.length === 1 && !segments[0].fleck) return input;
  return segments.map((s, i) =>
    s.fleck ? (
      <span key={i} className="fleck" style={fleckStyle(s.text)}>
        {s.text}
      </span>
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );
};

/** Убрать `**` из строки — для <title>, meta и alt-текстов. */
export const stripFlecks = (input: string | null | undefined): string =>
  input ? input.replace(/\*\*([^*]+)\*\*/g, '$1') : '';
