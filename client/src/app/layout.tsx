import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

/*
 * Root layout: jen <html>/<body>, font a výchozí metadata.
 * Veřejný web (hlavička, newsletter, patička, cookie lišta) — app/(site)/layout.tsx; interní správa — app/sprava/layout.tsx.
 */

/* Шрифт макета: Plus Jakarta Sans, только 400 и 800; latin-ext ради češtiny */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Gastrozóny — gastrozóny pro každou příležitost',
    template: '%s | Gastrozóny',
  },
  description:
    'Kompletní gastrozóny pro festivaly a akce — food trucky, stánky, technika i logistika. Od dvou stánků po celé food městečko.',
  applicationName: SITE_NAME,
  formatDetection: { telephone: false, email: false, address: false },
  // stránky bez vlastních metadat (404…) — ostatní přepisuje seoMetadata()
  openGraph: { type: 'website', locale: 'cs_CZ', siteName: SITE_NAME, images: [DEFAULT_OG_IMAGE] },
  twitter: { card: 'summary_large_image', images: [DEFAULT_OG_IMAGE] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
