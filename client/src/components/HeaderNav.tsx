'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type NavLink = { label: string; url: string };

type HeaderNavProps = {
  items: NavLink[];
  cta: NavLink;
};

/**
 * Шапка по макету: 102px, лого 50px (x=240), пункты 19/24 ExtraBold,
 * CTA «Přihláška» 121×46 жёлтая, прижата к правому краю контейнера.
 * < xl — бургер и выпадающее меню на всю ширину.
 */
export const HeaderNav = ({ items, cta }: HeaderNavProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    <header className="sticky top-0 z-50 bg-ink text-white">
      <div className="container flex h-[72px] items-center justify-between gap-6 xl:h-[102px]">
        <Link href="/" className="shrink-0" aria-label="Gastrozóny — domů">
          <Image
            src="/logo.svg"
            alt="Gastrozóny"
            width={274}
            height={50}
            priority
            className="h-9 w-auto xl:h-[50px]"
          />
        </Link>

        <nav className="hidden items-center gap-[37px] xl:flex" aria-label="Hlavní navigace">
          {items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              aria-current={isActive(item.url) ? 'page' : undefined}
              className={`text-[19px] font-extrabold leading-[24px] transition-colors hover:text-yellow ${
                isActive(item.url) ? 'text-yellow' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={cta.url}
            className="ml-[15px] inline-flex h-[46px] items-center bg-yellow px-[19px] text-[19px] font-extrabold leading-[24px] text-ink transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
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
          className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-white/10 bg-ink xl:hidden"
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
