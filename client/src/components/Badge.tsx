import type { ReactNode } from 'react';
import type { EventStatus } from '@/lib/events';

/**
 * Бейдж статуса акции из макета: h 37, r 19, текст 20/23 ExtraBold, паддинг ~13.
 * aktualni — #FFD100, pripravujeme — #CCCCCC, ukonceno — чёрный (карточка ч/б).
 */

const variants: Record<EventStatus, string> = {
  aktualni: 'bg-yellow text-ink',
  pripravujeme: 'bg-grey-muted text-ink',
  ukonceno: 'bg-ink text-white',
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  aktualni: 'Aktuální',
  pripravujeme: 'Připravujeme',
  ukonceno: 'Již ukončeno',
};

type BadgeProps = {
  status?: EventStatus;
  className?: string;
  children?: ReactNode;
};

export const Badge = ({ status = 'aktualni', className = '', children }: BadgeProps) => (
  <span
    className={`inline-flex h-[37px] items-center rounded-[19px] px-[13px] text-[20px] font-extrabold leading-[23px] ${variants[status]} ${className}`}
  >
    {children ?? STATUS_LABELS[status]}
  </span>
);
