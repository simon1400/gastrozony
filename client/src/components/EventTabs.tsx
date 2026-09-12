'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type EventTab = { id: string; label: string; count: number; panel: ReactNode };

/**
 * Záložky /akce (Aktuální / Připravujeme / Proběhlé). Panely renderuje server — všechny jsou v HTML,
 * klient jen přepíná `hidden`. Aktivní záložka je v hash (#probehle), odkaz lze sdílet.
 * Styl záložky = tag «Stavíme pro» (66 px, žlutý rámeček), aktivní — žlutá výplň.
 */
export const EventTabs = ({ tabs, initialId, label }: { tabs: EventTab[]; initialId: string; label: string }) => {
  const [active, setActive] = useState(initialId);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // záložka z hash — při načtení i při kliknutí na odkaz #probehle na téže stránce
  useEffect(() => {
    const sync = () => {
      const fromHash = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === fromHash)) setActive(fromHash);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [tabs]);

  const select = (i: number) => {
    const { id } = tabs[i];
    setActive(id);
    window.history.replaceState(null, '', `#${id}`);
    buttons.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next);
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-3 sm:gap-4">
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`inline-flex h-[52px] items-center gap-3 border border-yellow px-5 text-[17px] font-extrabold leading-[24px] text-ink shadow-btn transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:h-[66px] sm:px-[27.5px] sm:text-[19px] ${
                selected ? 'bg-yellow' : 'bg-white hover:bg-[#fffbe6]'
              }`}
            >
              {t.label}
              <span className={`text-[15px] ${selected ? '' : 'text-grey-line'}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="mt-14 focus-visible:outline-none xl:mt-[70px]"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
};
