import { BLOBS, FOOD, FoodScene, type Food, type PlacedBlob } from './home/HeroFood';

/**
 * Декор úvodu подстраниц (просьба заказчика 15.10.2026): большой бургер и пицца из hero HP
 * + жёлтые кляксы, те же анимации. Своя система координат 700 × 600 (`--fw/--fh`),
 * поворот кусков — те же матрицы из XD (origin — левый верх, поэтому x/y — точка до поворота).
 * Только ≥ lg: на мобиле картинка между perexem и текстом только отодвигала бы контент.
 */

const food = (src: string, o: Pick<Food, 'x' | 'y' | 'w' | 'h' | 'depth'> & Partial<Food>): Food => {
  const base = FOOD.find((f) => f.src === src);
  if (!base) throw new Error(`IntroFood: ${src} нет в FOOD`);
  return { ...base, sizes: '(min-width: 1280px) 330px, 26vw', ...o };
};

const FOODS: Food[] = [
  food('/food/pizza-big.png', { x: 10, y: 490, w: 280, h: 287, depth: '4', priority: false }),
  food('/food/burger-big.png', { x: 360, y: 10, w: 320, h: 320, depth: '8', priority: true }),
];

const SCENE_BLOBS: PlacedBlob[] = [
  { blob: BLOBS[0], at: [120, 40, 560, 491] },
  { blob: BLOBS[4], at: [0, 180, 230, 176] },
  { blob: BLOBS[2], at: [610, 330, 100, 208] },
];

export const IntroFood = ({ className = '' }: { className?: string }) => (
  <FoodScene
    foods={FOODS}
    blobs={SCENE_BLOBS}
    className={`relative hidden w-full [--fx:0] [--fy:0] [--fw:700] [--fh:600] lg:block ${className}`}
  />
);
