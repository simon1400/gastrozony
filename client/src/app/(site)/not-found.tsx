import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/NotFoundContent';

/** 404 uvnitř webu (notFound() na stránkách, neznámý /slug) — s hlavičkou, newsletterem a patičkou ze (site)/layout. */

export const metadata: Metadata = { title: 'Stránka nenalezena' };

export default function SiteNotFound() {
  return <NotFoundContent />;
}
