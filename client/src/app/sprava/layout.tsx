import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Interní správa (za Basic Auth v middleware.ts): jen tmavá lišta a obsah — bez newsletteru, patičky a GA.
 * Texty správy jsou v kódu: stránka je jen pro tým, ne pro návštěvníky webu.
 */

export const metadata: Metadata = {
  title: { default: 'Správa', template: '%s | Správa Gastrozóny' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="bg-ink text-white">
        <div className="container flex h-[72px] items-center justify-between gap-6">
          <Link href="/sprava/prihlasky" className="flex items-center gap-4">
            <Image src="/logo.svg" alt="Gastrozóny" width={274} height={50} className="h-8 w-auto" />
            <span className="border-l border-white/20 pl-4 text-[16px] font-extrabold text-yellow">Správa</span>
          </Link>
          <Link href="/" className="text-[15px] text-white/70 transition-colors hover:text-yellow">
            ← Web
          </Link>
        </div>
      </header>
      <main className="container py-10 xl:py-14">{children}</main>
    </>
  );
}
