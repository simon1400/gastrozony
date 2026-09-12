/**
 * Skutečný typ nahraného souboru podle „magic bytes“. `File.type` posílá prohlížeč — klient ho může podvrhnout,
 * a soubory končí na veřejném CDN (ImageKit). Rozpoznáváme jen formáty, které formulář přijímá.
 */

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'heim', 'heis'];
const HEIF_BRANDS = ['mif1', 'msf1'];

export async function detectFileType(file: File): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (ascii(b, 0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png';
  if (ascii(b, 0, 4) === 'GIF8') return 'image/gif';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'image/webp';
  if (ascii(b, 0, 5) === '%PDF-') return 'application/pdf';
  if (ascii(b, 4, 8) === 'ftyp') {
    const brand = ascii(b, 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (HEIC_BRANDS.includes(brand)) return 'image/heic';
    if (HEIF_BRANDS.includes(brand)) return 'image/heif';
  }
  return null;
}
