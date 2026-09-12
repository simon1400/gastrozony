import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { NotFoundContent } from '@/components/NotFoundContent';

/**
 * 404 pro adresy mimo (site) — např. víc segmentů (/a/b), které nechytí ani /[slug].
 * Root layout nemá hlavičku ani patičku, proto je tu vykreslujeme sami.
 */

export const metadata: Metadata = { title: 'Stránka nenalezena' };

export default function RootNotFound() {
  return (
    <>
      <Header />
      <main>
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
