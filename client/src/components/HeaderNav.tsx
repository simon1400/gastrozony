'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

export type NavLink = { label: string; url: string };

type HeaderNavProps = {
  items: NavLink[];
  cta: NavLink;
};

/**
 * Шапка по макету: 102px, лого 50px (x=240), пункты 19/24 ExtraBold,
 * CTA «Přihláška» 121×46 жёлтая, прижата к правому краю контейнера.
 * < xl — бургер и выпадающее меню на всю ширину.
 *
 * При прокрутке шапка ужимается: высота, лого и кегль лежат в CSS-переменных
 * (globals.css, .gz-header), `data-compact` переключает их набор, переход — transition.
 */
export const HeaderNav = ({ items, cta }: HeaderNavProps) => {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();

  /*
   * Ужатая шапка при прокрутке. Пороги разные на сжатие и на разжатие (гистерезис):
   * шапка стоит в потоке, и её сжатие укорачивает документ, а scroll anchoring
   * компенсирует это, подтягивая scrollY назад. С одним порогом это замыкается в
   * петлю — шапка начинает прыгать. Зазор 24…80 заведомо больше сжатия (34px).
   */
  useEffect(() => {
    const onScroll = () => setCompact((v) => window.scrollY > (v ? 24 : 80));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // закрыть мобильное меню при переходе
  useEffect(() => setOpen(false), [pathname]);

  // Esc закрывает меню, фон не скроллится
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const isActive = (url: string) => pathname === url || (url !== '/' && pathname.startsWith(`${url}/`));

  return (
    <header className="gz-header sticky top-0 z-50 bg-ink text-white" data-compact={compact || undefined}>
      <div className="gz-header__bar container flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Gastrozóny — domů">
          <Logo className="gz-header__logo w-auto" />
        </Link>

        <nav className="hidden items-center gap-[37px] xl:flex" aria-label="Hlavní navigace">
          {items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              aria-current={isActive(item.url) ? 'page' : undefined}
              className={`gz-header__link font-extrabold leading-[24px] hover:text-yellow ${
                isActive(item.url) ? 'text-yellow' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={cta.url}
            className="gz-header__cta ml-[15px] inline-flex items-center bg-yellow font-extrabold leading-[24px] text-ink hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            {cta.label}
          </Link>
        </nav>

        <button
          type="button"
          className="flex size-11 flex-col items-center justify-center gap-1.5 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-0.5 w-7 bg-white transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-0.5 w-7 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-7 bg-white transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="h-[calc(100dvh-var(--hdr-h))] overflow-y-auto border-t border-white/10 bg-ink xl:hidden"
          aria-label="Mobilní navigace"
        >
          <ul className="container flex flex-col gap-2 pb-10 pt-6">
            {items.map((item) => (
              <li key={item.url}>
                <Link
                  href={item.url}
                  aria-current={isActive(item.url) ? 'page' : undefined}
                  className={`block py-2 text-[26px] font-extrabold hover:text-yellow ${
                    isActive(item.url) ? 'text-yellow' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-6">
              <Link
                href={cta.url}
                className="inline-flex h-[66px] items-center bg-yellow px-[29px] text-[19px] font-extrabold text-ink"
              >
                {cta.label}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
