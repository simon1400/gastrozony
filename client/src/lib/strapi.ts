import qs from 'qs';

/**
 * Типизированный REST-клиент Strapi 5.
 * Вызывается только на сервере (RSC / route handlers) — токен не попадает в бандл.
 */

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://127.0.0.1:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export type StrapiMedia = {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  mime: string;
  formats?: Record<string, { url: string; width: number; height: number }>;
};

export type StrapiResponse<T> = {
  data: T;
  meta: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
};

export class StrapiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

type FetchOptions = {
  query?: Record<string, unknown>;
  /** Секунды ISR-кэша; 0 = no-store. По умолчанию 60. */
  revalidate?: number;
  tags?: string[];
};

export async function strapiFetch<T>(path: string, options: FetchOptions = {}): Promise<StrapiResponse<T>> {
  const { query, revalidate = 60, tags } = options;
  const search = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : '';
  const url = `${STRAPI_URL}/api${path}${search}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    },
    ...(revalidate === 0 ? { cache: 'no-store' as const } : { next: { revalidate, tags } }),
  });

  if (!res.ok) {
    throw new StrapiError(res.status, `Strapi ${res.status} on ${path}`);
  }
  return res.json() as Promise<StrapiResponse<T>>;
}

/** Zápis do Strapi — jen z route handlers (serverový token). FormData posílá bez Content-Type (boundary doplní fetch). */
async function strapiSend<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: string | FormData): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method,
    headers: {
      ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new StrapiError(res.status, `Strapi ${res.status} on ${method} ${path}: ${text.slice(0, 300)}`);
  }
  return (res.status === 204 ? null : res.json()) as Promise<T>;
}

/** POST в Strapi (заявки, подписчики) — только из route handlers. */
export const strapiPost = <T>(path: string, data: unknown) =>
  strapiSend<StrapiResponse<T>>('POST', path, JSON.stringify({ data }));

export const strapiPut = <T>(path: string, data: unknown) =>
  strapiSend<StrapiResponse<T>>('PUT', path, JSON.stringify({ data }));

/** Nahrání souborů do Media Library (→ ImageKit); vrací vytvořené soubory. */
export const strapiUpload = (files: File[]) => {
  const form = new FormData();
  for (const file of files) form.append('files', file, file.name);
  return strapiSend<StrapiMedia[]>('POST', '/upload', form);
};

export const strapiDeleteFile = (id: number) => strapiSend<unknown>('DELETE', `/upload/files/${id}`);

/** Абсолютный URL медиа-файла Strapi (в БД лежат относительные пути). */
export const mediaUrl = (media: StrapiMedia | null | undefined): string | null => {
  if (!media?.url) return null;
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
};
