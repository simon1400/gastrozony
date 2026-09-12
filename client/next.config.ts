import type { NextConfig } from 'next';

// медиа Strapi (/uploads) оптимизируем через next/image — хост берём из STRAPI_URL
const strapi = new URL(process.env.STRAPI_URL ?? 'http://127.0.0.1:1337');

const nextConfig: NextConfig = {
  // metadata (canonical, og:*, description) vždy blokující v <head>, i pro Googlebot. Výchozí streaming metadata
  // je posílá do <body> a Google rel=canonical mimo <head> v HTML ignoruje. generateMetadata čte stejná
  // (kešovaná) data jako stránka, TTFB se tím prakticky nemění.
  htmlLimitedBots: /.*/,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: strapi.protocol === 'https:' ? 'https' : 'http',
        hostname: strapi.hostname,
        port: strapi.port,
        pathname: '/uploads/**',
      },
      // média ze Strapi po zapnutí ImageKit (CmsImage je jinak zmenšuje loaderem ImageKit)
      { protocol: 'https', hostname: 'ik.imagekit.io', pathname: '/**' },
    ],
  },
};

export default nextConfig;
