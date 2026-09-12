'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

/**
 * Статистика: жёлтая черта 4×80, справа число 49/56 жёлтым и подпись 20/33.
 *
 * Когда блок попадает в кадр, содержимое выезжает из-под черты, а число досчитывается
 * от нуля. Соседние карточки стартуют со сдвигом (`index`), поэтому вторая выезжает,
 * пока первая ещё считает.
 *
 * Разметка с финальным значением приходит с сервера, анимацию включает только клиент —
 * без JS и при `prefers-reduced-motion` сразу видно готовое число.
 */

/** Секунд между стартом соседних карточек. */
const STEP = 0.55;
/** Длительность счёта: успеть разглядеть, но не затягивать. */
const DURATION = 1900;

type Parsed = { to: number; format: (v: number) => string };

/** «120+», «8 let», «1 200 Kč» → число и то, что его окружает. */
const parseValue = (value: string): Parsed | null => {
  const m = /^(\D*?)(\d[\d\s., ]*?)(\D*)$/.exec(value);
  if (!m) return null;
  const [, prefix, middle, suffix] = m;
  const n = Number(middle.replace(/[\s., ]/g, ''));
  if (!Number.isFinite(n)) return null;
  const grouped = /[\s ]/.test(middle);
  return {
    to: n,
    format: (v) => prefix + (grouped ? v.toLocaleString('cs-CZ') : String(v)) + suffix,
  };
};

export const Stat = ({ value, label, index = 0 }: { value: string; label: string; index?: number }) => {
  const num = useMemo(() => parseValue(value), [value]);
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);
  const [run, setRun] = useState(false);

  // старт — когда карточка попала в кадр (блок статистики бывает и внизу страницы)
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setRun(true);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!run || !num) return;
    let raf = 0;
    const start = performance.now() + index * STEP * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / DURATION));
      // easeOutQuad: счёт идёт ровно и мягко тормозит в конце, а не выстреливает
      setDisplay(num.format(Math.round(num.to * (1 - (1 - p) ** 2))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, num, index]);

  return (
    <div ref={ref} className="gz-stat flex items-center gap-[6px]" data-anim={run ? 'in' : undefined} style={{ '--stat-delay': `${index * STEP}s` } as CSSProperties}>
      <span aria-hidden className="h-20 w-1 shrink-0 bg-yellow" />
      <div className="gz-stat__clip">
        <div className="gz-stat__inner">
          <div className="grid text-[38px] font-extrabold leading-[44px] text-yellow sm:text-[49px] sm:leading-[56px]">
            {/* распорка по финальному значению: счёт не должен дёргать ширину ряда */}
            <span aria-hidden className="invisible col-start-1 row-start-1">
              {value}
            </span>
            <span className="col-start-1 row-start-1">{display}</span>
          </div>
          <div className="text-lead">{label}</div>
        </div>
      </div>
    </div>
  );
};
