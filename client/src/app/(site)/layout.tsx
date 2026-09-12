import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Newsletter } from '@/components/Newsletter';
import { RichInline } from '@/components/RichText';
import { getCookieTexts } from '@/lib/cookie-texts';

/** Veřejný web: hlavička, obsah, newsletter nad patičkou (zadání), patička, cookie lišta + GA4. */
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieTexts = await getCookieTexts();
  return (
    <>
      <Header />
      <main>{children}</main>
      <Newsletter />
      <Footer />
      <CookieConsent
        texts={cookieTexts}
        text={<RichInline>{cookieTexts.text}</RichInline>}
        gtmId={process.env.NEXT_PUBLIC_GTM_ID || null}
        gaId={process.env.NEXT_PUBLIC_GA_ID || null}
      />
    </>
  );
}
