import { Button } from '@/components/Button';
import { Stat } from '@/components/Card';
import { renderFlecks } from '@/lib/flecks';
import type { Homepage } from '@/lib/homepage';
import { HeroFood } from './HeroFood';

/**
 * Hero (макет y 102…1104 на 1920): H1 77/88 (baseline 421), perex 544 (y 556),
 * кнопки 66 (y 687), статистика (черта y 971). Справа — еда и пятна (HeroFood).
 * Отступы xl-* — точные значения макета.
 */
export const Hero = ({ hero, stats }: Pick<Homepage, 'hero' | 'stats'>) => (
  <section className="relative overflow-x-clip bg-white" aria-labelledby="hero-title">
    <div className="container">
      <div className="relative pb-12 pt-12 md:pt-20 lg:pb-[48px] lg:pt-[140px] xl:pt-[244px]">
        <div className="relative z-10 lg:max-w-[50%] xl:max-w-[680px]">
          <h1 id="hero-title" className="text-h1">
            {renderFlecks(hero.title)}
          </h1>
          {hero.perex && <p className="mt-[34px] max-w-[544px] text-lead">{hero.perex}</p>}
          {hero.ctas.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-5">
              {hero.ctas.map((c) => (
                <Button key={c.url + c.label} href={c.url} variant={c.variant} newTab={c.newTab}>
                  {c.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <HeroFood />

        {stats.length > 0 && (
          <ul className="relative z-10 mt-10 flex flex-wrap gap-x-10 gap-y-6 lg:mt-24 xl:mt-[214px]">
            {stats.map((s, i) => (
              <li key={s.label}>
                <Stat value={s.value} label={s.label} index={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </section>
);
