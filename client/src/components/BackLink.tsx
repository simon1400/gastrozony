import Link from 'next/link';

/** Odkaz zpět na výpis nad detailem (akce, článek). */
export const BackLink = ({ href, children }: { href: string; children: string }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-2 text-[16px] font-extrabold leading-[24px] decoration-yellow decoration-[3px] underline-offset-4 hover:underline"
  >
    <span aria-hidden>←</span>
    {children}
  </Link>
);
