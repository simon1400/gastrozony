/**
 * Ikony a výchozí OG obrázek ze statického logotypu (client/public/logo.svg) — logo se v CMS nemění.
 * Zdroj pravdy: tento skript. Spuštění: node scripts/gen-icons.mjs (z kořene projektu).
 *
 *   client/src/app/icon.svg        — favicon (vektor): žlutý znak na černém kruhu
 *   client/src/app/favicon.ico     — 16/32/48 px pro staré prohlížeče a /favicon.ico
 *   client/src/app/apple-icon.png  — 180 px (iOS si rohy zakulatí sám → čtverec)
 *   client/public/icon-512.png     — logo pro JSON-LD Organization
 *   client/public/og-default.png   — 1200×630, výchozí sdílecí obrázek
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = join(ROOT, 'client');
const sharp = createRequire(join(CLIENT, 'package.json'))('sharp');

const INK = '#0E0E0E';
const YELLOW = '#FFD100';

const logo = readFileSync(join(CLIENT, 'public', 'logo.svg'), 'utf8');
// znak = kruh s křížem (jediná žlutá cesta loga), střed 65.613 / 65.613
const mark = logo.match(/<path d="([^"]+)"[^>]*fill="#ffd100"/i)?.[1];
if (!mark) throw new Error('V logo.svg jsem nenašel žlutý znak (path s fill="#ffd100").');

const markSvg = ({ size, round, scale }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 132 132">` +
  (round ? `<circle cx="66" cy="66" r="66" fill="${INK}"/>` : `<rect width="132" height="132" fill="${INK}"/>`) +
  `<g transform="translate(66 66) scale(${scale}) translate(-65.613 -65.613)"><path d="${mark}" fill="${YELLOW}"/></g></svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/** ICO s PNG obrázky (podporováno od Windows Vista / všemi prohlížeči). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const iconSvg = markSvg({ size: 132, round: true, scale: 0.8 });
writeFileSync(join(CLIENT, 'src', 'app', 'icon.svg'), `${iconSvg}\n`);

const icoImages = [];
for (const size of [16, 32, 48]) icoImages.push({ size, data: await png(iconSvg, size) });
writeFileSync(join(CLIENT, 'src', 'app', 'favicon.ico'), ico(icoImages));

writeFileSync(join(CLIENT, 'src', 'app', 'apple-icon.png'), await png(markSvg({ size: 180, round: false, scale: 0.72 }), 180));
writeFileSync(join(CLIENT, 'public', 'icon-512.png'), await png(markSvg({ size: 512, round: false, scale: 0.78 }), 512));

// OG: černé pozadí, celé logo uprostřed, žlutý pruh dole
const logoPng = await sharp(Buffer.from(logo)).resize({ width: 760 }).png().toBuffer();
const { height: logoHeight } = await sharp(logoPng).metadata();
const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: INK } })
  .composite([
    { input: logoPng, left: Math.round((1200 - 760) / 2), top: Math.round((630 - 24 - logoHeight) / 2) },
    { input: { create: { width: 1200, height: 24, channels: 4, background: YELLOW } }, left: 0, top: 606 },
  ])
  .png()
  .toBuffer();
writeFileSync(join(CLIENT, 'public', 'og-default.png'), og);

console.log('icon.svg, favicon.ico (16/32/48), apple-icon.png (180), icon-512.png, og-default.png (1200×630) ✔');
