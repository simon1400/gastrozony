'use client';

import Image, { type ImageLoader, type ImageProps } from 'next/image';

/**
 * next/image pro média ze Strapi.
 * Soubory v ImageKit (strapi-plugin-imagekit) zmenšuje a převádí na AVIF/WebP přímo CDN ImageKit
 * (`?tr=w-…,q-…`); ostatní (lokální /uploads v dev, dokud není ImageKit zapnutý) jdou přes
 * vestavěný optimalizátor Next. Loader je funkce, proto je komponenta klientská.
 */

const IMAGEKIT_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/';

const imagekitLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes('?') ? '&' : '?'}tr=w-${width},q-${quality ?? 75}`;

export const CmsImage = ({ src, alt, ...props }: Omit<ImageProps, 'src' | 'loader'> & { src: string }) => (
  <Image src={src} alt={alt} {...(src.startsWith(IMAGEKIT_ENDPOINT) ? { loader: imagekitLoader } : {})} {...props} />
);
