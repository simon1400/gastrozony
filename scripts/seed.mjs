/**
 * Seed-контент Gastrozony (REST Strapi 5 + full-access STRAPI_API_TOKEN из client/.env.local).
 * Запуск: node scripts/seed.mjs   (Strapi должен работать на STRAPI_URL)
 *
 * Идемпотентен: коллекции — upsert по slug / key / name, single types — PUT,
 * медиа — переиспользуются по имени файла. Повторный запуск ничего не дублирует.
 * Тексты HP — дословно из макета (design/specs/hp-layers.txt); остальное — черновики,
 * которые заказчик поправит в админке (помечено «(návrh)» там, где это важно).
 */
import { readFileSync, existsSync, openAsBlob } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'design', 'assets');

/* ------------------------------------------------------------------ env */

const env = {};
const envFile = join(ROOT, 'client', '.env.local');
if (existsSync(envFile)) {
  for (const raw of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
}
const STRAPI_URL = process.env.STRAPI_URL ?? env.STRAPI_URL ?? 'http://127.0.0.1:1337';
const TOKEN = process.env.STRAPI_API_TOKEN ?? env.STRAPI_API_TOKEN;
if (!TOKEN) {
  console.error('Chybí STRAPI_API_TOKEN (client/.env.local) — spusťte nejdřív node scripts/create-api-token.mjs');
  process.exit(1);
}
const AUTH = { Authorization: `Bearer ${TOKEN}` };

/* -------------------------------------------------------------- helpers */

async function api(method, path, body) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method,
    headers: { ...AUTH, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 800)}`);
  return res.status === 204 ? null : res.json();
}

const q = (s) => encodeURIComponent(s);

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };

// --reupload-local: soubor, který Strapi drží lokálně (url /uploads/…), smaže a nahraje znovu —
// po zapnutí ImageKit tak seed média přejdou do ImageKit (vazby obnoví upserty níže).
// Pozor: pole `provider` zůstává „local“ i u souborů v ImageKit (Strapi ho přepíše) → rozhoduje url.
const REUPLOAD_LOCAL = process.argv.includes('--reupload-local');

/** Nahraje soubor z design/assets pod jménem `name`; pokud už existuje, vrátí jeho id. */
async function upload(file, name, alt) {
  const existing = await api('GET', `/upload/files?filters[name][$eq]=${q(name)}`);
  if (existing.length > 0) {
    if (!(REUPLOAD_LOCAL && existing[0].url.startsWith('/uploads/'))) return existing[0].id;
    await api('DELETE', `/upload/files/${existing[0].id}`);
    console.log(`  delete ${name} (local)`);
  }

  const path = join(ASSETS, file);
  const form = new FormData();
  form.append('files', await openAsBlob(path, { type: MIME[extname(file).toLowerCase()] }), name);
  form.append('fileInfo', JSON.stringify({ name, alternativeText: alt }));
  const res = await fetch(`${STRAPI_URL}/api/upload`, { method: 'POST', headers: AUTH, body: form });
  if (!res.ok) throw new Error(`upload ${file} → ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const [created] = await res.json();
  console.log(`  media  ${name}`);
  return created.id;
}

/** Upsert dokumentu kolekce podle unikátního pole; vrací documentId. */
async function upsert(plural, field, value, data) {
  const found = await api('GET', `/${plural}?filters[${field}][$eq]=${q(value)}&status=draft&pagination[pageSize]=1`);
  const doc = found.data[0];
  if (doc) {
    await api('PUT', `/${plural}/${doc.documentId}`, { data });
    console.log(`  update ${plural}/${value}`);
    return doc.documentId;
  }
  const created = await api('POST', `/${plural}`, { data });
  console.log(`  create ${plural}/${value}`);
  return created.data.documentId;
}

async function single(uid, data) {
  await api('PUT', `/${uid}`, { data });
  console.log(`  single ${uid}`);
}

const cta = (label, url, variant = 'primary') => ({ label, url, variant });
const seo = (metaTitle, metaDescription) => ({ metaTitle, metaDescription });

/* ---------------------------------------------------------------- media */

console.log('Media…');
// logo se nenahrává: je statické v client/public/logo.svg (v CMS se nemění)
const media = {
  coverMint: await upload('NoPath - kopie (2)-image.jpg', 'gz-akce-mint-market.jpg', 'Návštěvníci MINT Marketu v hale'),
  coverHhz: await upload('Mask Group 1-image.jpg', 'gz-akce-hip-hop-zije.jpg', 'Publikum na festivalu HIP HOP ŽIJE!'),
  photoCrowd: await upload('Mask Group 4-image.jpg', 'gz-akce-dav-noc.jpg', 'Večerní dav pod pódiem, v pozadí stany gastrozóny'),
  logoPilsner: await upload('NoPath.png', 'gz-klient-pilsner-fest.png', 'Pilsner Fest'),
  logoBurgerArena: await upload('NoPath-1.png', 'gz-klient-burger-arena.png', 'Burger Arena'),
  logoBsf: await upload('Image 3.png', 'gz-klient-burger-street-festival.png', 'Burger Street Festival'),
  logoHhz: await upload('hhz-logo.png', 'gz-klient-hip-hop-zije.png', 'Hip Hop Žije'),
};

/* -------------------------------------------------------- client logos */

console.log('Loga klientů…');
const logos = [];
for (const [i, [name, logo, url]] of [
  ['Pilsner Fest', media.logoPilsner, null],
  ['Burger Arena', media.logoBurgerArena, null],
  ['Burger Street Festival', media.logoBsf, 'https://burgerstreetfestival.cz'],
  ['Hip Hop Žije', media.logoHhz, null],
].entries()) {
  logos.push(await upsert('client-logos', 'name', name, { name, logo, url, order: i + 1 }));
}

/* -------------------------------------------------------------- events */

console.log('Akce…');
const HHZ_PEREX =
  'Jeden z nejznámějších slovenských festivalů slaví třinácté narozeniny a projede několik měst. Na každou zastávku hledáme prodejce jídla — kdo pojede s námi?';
const HHZ_CONTENT = `HIP HOP ŽIJE! slaví třinácté narozeniny velkým turné. Na každé zastávce postavíme gastrozónu pro tisíce fanoušků — a hledáme do ní prodejce, kteří zvládnou večerní nápor.

**Co nabízíme**

- místo v gastrozóně s přípojkou elektřiny a vody
- propagaci na sítích festivalu
- koordinaci na místě od našeho týmu

Podmínky účasti a rozvržení zóny pošleme po přihlášce.`;

const events = {
  mint: await upsert('events', 'slug', 'mint-market-food-festival', {
    title: 'MINT Market & Food festival',
    slug: 'mint-market-food-festival',
    perex:
      'Propojení designu, módy a gastronomie na jednom místě. Wannieck Gallery a přilehlé venkovní plochy ožijí konceptem FASHION MINT — hledáme food trucky s výrazným menu.',
    content: `MINT Market spojuje lokální design, módu a dobré jídlo. Tentokrát se koná ve **Wannieck Gallery** a na přilehlých venkovních plochách pod hlavičkou FASHION MINT.

Hledáme food trucky a stánky s výrazným, originálním menu — street food, kávu, dezerty i nealko.

- 2 dny, očekávaná návštěvnost 6 000 lidí
- zóna pro 12 prodejců
- elektřina 230 V / 400 V na místě`,
    place: 'Wannieck Gallery, Brno',
    dateFrom: '2026-09-10',
    dateTo: '2026-09-13',
    cover: media.coverMint,
    gallery: [media.coverMint, media.photoCrowd, media.coverHhz],
    applicationOpen: true,
    capacityState: 'posledni-mista',
    googleMapsUrl: 'https://maps.google.com/?q=Wannieck+Gallery+Brno',
    featured: true,
    order: 1,
    seo: seo('MINT Market & Food festival', 'Hledáme food trucky s výrazným menu na MINT Market ve Wannieck Gallery v Brně.'),
  }),
  hhzBa: await upsert('events', 'slug', 'hip-hop-zije-2026-bratislava', {
    title: 'HIP HOP ŽIJE! 2026',
    slug: 'hip-hop-zije-2026-bratislava',
    perex: HHZ_PEREX,
    content: HHZ_CONTENT,
    place: 'Bratislava',
    dateFrom: '2026-10-17',
    dateTo: '2026-10-17',
    cover: media.coverHhz,
    gallery: [media.coverHhz, media.photoCrowd],
    applicationOpen: true,
    capacityState: 'volno',
    order: 2,
    seo: seo('HIP HOP ŽIJE! 2026 — Bratislava', HHZ_PEREX),
  }),
  hhzKe: await upsert('events', 'slug', 'hip-hop-zije-2026-kosice', {
    title: 'HIP HOP ŽIJE! 2026',
    slug: 'hip-hop-zije-2026-kosice',
    perex: HHZ_PEREX,
    content: HHZ_CONTENT,
    place: 'Košice',
    dateFrom: '2026-10-24',
    dateTo: '2026-10-24',
    cover: media.coverHhz,
    applicationOpen: true,
    capacityState: 'volno',
    order: 3,
    seo: seo('HIP HOP ŽIJE! 2026 — Košice', HHZ_PEREX),
  }),
  // (návrh) proběhlá akce — aby záložka «Proběhlé» na /akce nebyla prázdná; zákazník nahradí skutečnou
  hhzLetni: await upsert('events', 'slug', 'hip-hop-zije-2026-letni-open-air', {
    title: 'HIP HOP ŽIJE! Letní open air',
    slug: 'hip-hop-zije-2026-letni-open-air',
    perex: 'Letní open air pro 8 000 fanoušků. Gastrozóna s 15 prodejci jela bez front až do půlnoci — díky všem, kteří s námi stáli za pultem.',
    content: `Letní zastávka turné HIP HOP ŽIJE! přinesla rekordní návštěvnost i tržby prodejců.

- 8 000 návštěvníků
- 15 prodejců jídla a nápojů
- průměrná fronta pod 5 minut`,
    place: 'Nitra',
    dateFrom: '2026-07-18',
    dateTo: '2026-07-19',
    cover: media.photoCrowd,
    gallery: [media.photoCrowd, media.coverHhz],
    applicationOpen: false,
    order: 4,
    seo: seo('HIP HOP ŽIJE! Letní open air', 'Jak dopadla gastrozóna na letním open airu HIP HOP ŽIJE! v Nitře.'),
  }),
};

/* ---------------------------------------------------------------- team */

console.log('Tým…');
const team = [
  await upsert('team-members', 'name', 'Daniel Kokeš', {
    name: 'Daniel Kokeš',
    position: 'Vedení projektu',
    email: 'info@gastrozony.cz',
    order: 1,
  }),
  await upsert('team-members', 'name', 'Tým prodejců', {
    name: 'Tým prodejců',
    position: 'Přihlášky a koordinace na místě',
    email: 'info@gastrozony.cz',
    order: 2,
  }),
];

/* ------------------------------------------------------------ articles */

console.log('Články…');
await upsert('articles', 'slug', 'hledame-prodejce-na-sezonu-2026', {
  title: 'Hledáme prodejce na sezónu 2026',
  slug: 'hledame-prodejce-na-sezonu-2026',
  date: '2026-09-01',
  perex: 'Otevíráme přihlášky na festivaly a akce sezóny 2026. Podívejte se, jak přihláška funguje a co od vás potřebujeme.',
  cover: media.coverHhz,
  content: `Sezóna 2026 bude nabitá — od městských food festivalů po turné HIP HOP ŽIJE! po Slovensku.

## Jak se přihlásit

1. Vyberte akci v přehledu **Akce**.
2. Vyplňte přihlášku a přiložte fotku stánku nebo menu.
3. Ozveme se s podmínkami i rozvržením zóny.

Přihláška je nezávazná — závazná je až smlouva.`,
  seo: seo('Hledáme prodejce na sezónu 2026', 'Otevíráme přihlášky pro prodejce jídla a nápojů na sezónu 2026.'),
});
await upsert('articles', 'slug', 'jak-pripravit-stanek-na-festival', {
  title: 'Jak připravit stánek na festival',
  slug: 'jak-pripravit-stanek-na-festival',
  date: '2026-08-20',
  perex: 'Krátké menu, rychlé odbavení a jasná cedule. Pět tipů, díky kterým zvládnete i večerní nápor.',
  cover: media.coverMint,
  content: `Na festivalu rozhoduje rychlost. Čím kratší fronta, tím víc prodaných porcí.

- **Zkraťte menu** na 3–5 položek.
- **Připravte si mise en place** — polotovary, omáčky, obaly.
- **Platby kartou** mějte vždy funkční, ideálně dva terminály.
- **Viditelná cedule** s cenami šetří čas u okénka.
- **Počítejte s příkonem** — nahlaste nám ho v přihlášce.`,
  seo: seo('Jak připravit stánek na festival', 'Pět tipů pro prodejce na festivalech — menu, odbavení, platby a elektřina.'),
});
await upsert('articles', 'slug', 'mint-market-v-brne', {
  title: 'MINT Market míří do Wannieck Gallery',
  slug: 'mint-market-v-brne',
  date: '2026-08-05',
  perex: 'Design, móda a gastronomie pod jednou střechou. Na MINT Market v Brně hledáme food trucky s výrazným menu.',
  cover: media.coverMint,
  content: `MINT Market se tentokrát přesouvá do **Wannieck Gallery** v Brně. Gastrozónu postavíme na přilehlých venkovních plochách.

Máte originální menu? [Přihlaste se](/prihlaska?akce=mint-market-food-festival).`,
  seo: seo('MINT Market míří do Wannieck Gallery', 'Na MINT Market v Brně hledáme food trucky s výrazným menu.'),
});

/* --------------------------------------------------------- single types */

console.log('Single types…');
await single('global', {
  siteName: 'Gastrozóny',
  email: 'info@gastrozony.cz',
  applicationRecipients: 'info@gastrozony.cz',
  notFoundTitle: 'Tahle stránka **neexistuje**',
  notFoundText: 'Odkaz je možná starý nebo v něm je překlep. Zkuste to z úvodní stránky — nebo se rovnou podívejte, na jaké akce hledáme prodejce.',
  notFoundHomeLabel: 'Zpět na úvod',
  notFoundEventsLabel: 'Aktuální akce',
  defaultSeo: seo(
    'Gastrozóny — gastrozóny pro každou příležitost',
    'Kompletní gastrozóny pro festivaly a akce — food trucky, stánky, technika i logistika. Od dvou stánků po celé food městečko.',
  ),
});

await single('navigation', {
  header: [
    { label: 'Akce', url: '/akce' },
    { label: 'Info', url: '/info' },
    { label: 'Kontakt', url: '/kontakt' },
    { label: 'Pro prodejce', url: '/pro-prodejce' },
    { label: 'Pro pořadatele', url: '/pro-poradatele' },
  ],
  headerCta: cta('Přihláška', '/prihlaska'),
  footerColumns: [
    {
      title: 'Gastrozóny',
      links: [
        { label: 'Akce', url: '/akce' },
        { label: 'Novinky', url: '/novinky' },
        { label: 'Jak to funguje', url: '/info' },
        { label: 'Kontakt', url: '/kontakt' },
      ],
    },
    {
      title: 'Pro vás',
      links: [
        { label: 'Pro prodejce', url: '/pro-prodejce' },
        { label: 'Pro pořadatele', url: '/pro-poradatele' },
        { label: 'Přihláška', url: '/prihlaska' },
      ],
    },
  ],
  footerNote: 'Gastrozóny pro festivaly, firemní akce i svatby — od dvou stánků po celé food městečko.',
  footerLegal: [
    { label: 'Ochrana osobních údajů', url: '/ochrana-osobnich-udaju' },
    { label: 'Cookies', url: '/cookies' },
  ],
});

await single('homepage', {
  hero: {
    // в макете флек только под «Gastrozóny» (design/screens/hp-1-hero-intro.png)
    title: '**Gastrozóny** pro každou příležitost',
    perex:
      'Bez pořádného občerstvení se neobejde žádná dobrá akce. Postavíme vám gastrozónu, na kterou se lidé budou chtít vracet — od dvou stánků po celé food městečko.',
    ctas: [cta('Přihlásit se na akci', '/prihlaska'), cta('Jak to funguje', '/info', 'outline')],
  },
  stats: [
    { value: '120+', label: 'Odbavených akcí' },
    { value: '8 let', label: 'Na festivalové scéně' },
    { value: '50K', label: 'Nakrmených hostů ročně' },
  ],
  intro: {
    title: 'Dodáme **jídlo i nápoje** pro vaše akce',
    text:
      'Gastrozóna je kompletní jídelní část vaší akce — vybrané food trucky a stánky, technika, obsluha i logistika. Vy řešíte program, my to, co lidi drží na místě.\n\n' +
      'Catering bývá to první, co návštěvníci kritizují, a často rozhoduje, jestli se na akci vrátí. Proto hlídáme kvalitu, čerstvost a to, aby fronty netekly do programu.',
  },
  cards: [
    { number: '01', title: 'Kvalitní street food', text: 'Vybíráme provozovatele, kteří umí odbavit nápor a nesleví z kvality. Žádné náhodné stánky.' },
    { number: '02', title: 'Vše na klíč', text: 'Skladba nabídky, rozvržení zóny, přípojky, odpad, hygiena i platby. Přijedete a je to postavené.' },
    { number: '03', title: 'Zvládneme velké akce', text: 'Festivaly pro desetitisíce lidí i firemní den pro dvě stě. Kapacitu plánujeme podle návštěvnosti.' },
  ],
  tagsTitle: 'Stavíme pro:',
  tags: ['Festivaly', 'Dětské dny', 'Teambuildingy', 'Konference', 'Svatby'].map((label) => ({ label })),
  clients: {
    title: 'Jsme tu pro **náročné klienty**',
    text: 'Cateringu se věnujeme řadu let a dbáme, aby naše služby byly vždy na nejvyšší úrovni. Nejlépe to potvrzují klienti, kteří se k nám pravidelně vracejí a gastrozónou doplňují své povedené akce.',
    cta: cta('Kontaktujte nás', '/kontakt'),
    moreLabel: 'a další...',
    logos,
  },
  events: {
    title: 'Aktuální **akce**',
    text: 'Hledáme prodejce jídla a nápojů na sezónu 2026. Vyber si akci, přihlas se a my se ozveme s podmínkami i rozvržením zóny.',
    limit: 3,
    cta: cta('Všechny akce', '/akce'),
  },
  seo: seo(
    'Gastrozóny — gastrozóny pro každou příležitost',
    'Kompletní gastrozóny pro festivaly a akce — food trucky, stánky, technika i logistika. Od dvou stánků po celé food městečko.',
  ),
});

await single('newsletter', {
  title: 'Nezmeškejte žádnou akci',
  text: 'Přihlaste se k odběru novinek. Nové termíny, volná místa v zónách a otevřené přihlášky pro prodejce — vždy dřív než veřejnost.',
  emailLabel: 'Váš e-mail',
  placeholder: 'jmeno@email.cz',
  buttonLabel: 'Odebírat',
  consentText: 'Souhlasím se zpracováním osobních údajů pro zasílání novinek. Odhlásit se lze kdykoli.',
  successText: 'Děkujeme! Jste přihlášeni k odběru.',
  errorText: 'Něco se pokazilo, zkuste to prosím znovu.',
  // ID seznamu a štítky doplní zadavatel v administraci (nebo ENV ECOMAIL_LIST_ID / ECOMAIL_TAGS)
  ecomailListId: '',
  ecomailTags: 'web',
  doubleOptIn: true,
  enabled: true,
});

await single('application-page', {
  title: 'Přihláška pro **prodejce**',
  perex: 'Vyberte akci, vyplňte údaje o stánku a my se ozveme s podmínkami i rozvržením zóny. Přihláška je nezávazná.',
  contentBefore: 'Pole označená hvězdičkou jsou povinná. Fotku stánku nebo menu můžete přiložit rovnou — urychlí to výběr.',
  contentAfter: 'Máte dotaz? Napište nám na [info@gastrozony.cz](mailto:info@gastrozony.cz).',
  eventSelectLabel: 'Vyberte akci',
  eventPlaceholder: '— vyberte akci —',
  noEventsText: 'Momentálně nepřijímáme přihlášky na žádnou akci. Přihlaste se k odběru novinek a dáme vám vědět, jakmile otevřeme další.',
  uploadLabel: 'Vybrat soubory',
  submitLabel: 'Odeslat přihlášku',
  successTitle: 'Děkujeme!',
  successText: 'Přihlášku jsme přijali. Do několika dnů se vám ozveme s podmínkami a rozvržením zóny.',
  errorText: 'Přihlášku se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám napište na info@gastrozony.cz.',
  rateLimitText: 'Odeslali jste příliš mnoho přihlášek za sebou. Zkuste to prosím znovu za pár minut.',
  mailSubject: 'Přijali jsme vaši přihlášku',
  mailIntro:
    'děkujeme za přihlášku. Prošli jsme ji a brzy se vám ozveme s podmínkami i rozvržením zóny. Níže posíláme přehled toho, co jste vyplnili.',
  mailNote:
    'Na tuto zprávu prosím neodpovídejte — je odeslána automaticky. S dotazy nám napište na info@gastrozony.cz. Pořadatel si vyhrazuje právo přihlášku nepřijmout, případně nabídnout účast na jiné akci.',
  seo: seo('Přihláška pro prodejce', 'Přihlaste se jako prodejce jídla a nápojů na festivaly a akce Gastrozóny.'),
});

await single('contact-page', {
  title: 'Kontakt',
  perex: 'Plánujete akci, nebo se chcete přidat mezi prodejce? Ozvěte se nám.',
  body: 'Na e-maily odpovídáme obvykle do dvou pracovních dnů. Pro přihlášku na konkrétní akci použijte [formulář](/prihlaska).',
  email: 'info@gastrozony.cz',
  emailLabel: 'E-mail',
  phoneLabel: 'Telefon',
  addressLabel: 'Adresa',
  mapLabel: 'Zobrazit na mapě',
  teamTitle: 'Náš tým',
  team,
  blocks: [
    {
      __component: 'blocks.cta',
      title: 'Chcete prodávat na našich akcích?',
      text: 'Vyberte akci a pošlete přihlášku — zabere to pět minut.',
      cta: cta('Přihlásit se na akci', '/prihlaska'),
      background: 'yellow',
    },
  ],
  seo: seo('Kontakt', 'Kontakt na tým Gastrozóny — gastrozóny pro festivaly a akce.'),
});

await single('events-page', {
  title: 'Naše **akce**',
  perex: 'Festivaly a akce, na které hledáme prodejce jídla a nápojů. Vyberte si termín, přihlaste se a my se ozveme s podmínkami i rozvržením zóny.',
  emptyText: 'V této kategorii teď žádné akce nemáme. Přihlaste se k odběru novinek a dáme vám vědět.',
  tabCurrentLabel: 'Aktuální',
  tabUpcomingLabel: 'Připravujeme',
  tabPastLabel: 'Proběhlé',
  applyLabel: 'Přihlásit se na tuto akci',
  applicationClosedText: 'Přihlášky na tuto akci jsou uzavřené.',
  dateLabel: 'Termín',
  placeLabel: 'Místo',
  capacityLabel: 'Kapacita',
  mapLabel: 'Zobrazit na mapě',
  galleryTitle: 'Galerie',
  backLabel: 'Všechny akce',
  seo: seo('Akce', 'Festivaly a akce, na které Gastrozóny hledají prodejce jídla a nápojů. Vyberte si termín a přihlaste se.'),
});

await single('cookie-consent', {
  title: 'Používáme cookies',
  text: 'Nutné cookies zajišťují fungování webu. Analytické (Google Analytics) nám pomáhají web zlepšovat — použijeme je jen s vaším souhlasem. Více v [zásadách cookies](/cookies) a [ochraně osobních údajů](/ochrana-osobnich-udaju).',
  acceptAllLabel: 'Přijmout vše',
  necessaryOnlyLabel: 'Pouze nutné',
  settingsLabel: 'Nastavení',
  saveLabel: 'Uložit volbu',
  necessaryTitle: 'Nutné',
  necessaryText: 'Základní funkce webu a uložení vaší volby cookies. Nelze je vypnout.',
  alwaysActiveLabel: 'Vždy aktivní',
  analyticsTitle: 'Analytické',
  analyticsText: 'Google Analytics 4 — měření návštěvnosti, díky kterému víme, co na webu funguje.',
  footerLinkLabel: 'Nastavení cookies',
});

await single('blog-page', {
  title: 'Novinky',
  perex: 'Nové akce, otevřené přihlášky a tipy pro prodejce.',
  emptyText: 'Zatím tu nejsou žádné články. Přihlaste se k odběru novinek a nic vám neuteče.',
  backLabel: 'Všechny novinky',
  moreTitle: 'Další články',
  prevLabel: 'Předchozí',
  nextLabel: 'Další',
  seo: seo('Novinky', 'Novinky z Gastrozón — nové akce, otevřené přihlášky a tipy pro prodejce.'),
});

/* ---------------------------------------------------------------- form */

console.log('Formulář…');
const text = (name, label, o = {}) => ({ __component: 'form.text-field', name, label, inputType: 'text', width: 'full', required: false, ...o });
const items = (...labels) => labels.map((label) => ({ label, value: label, disabled: false }));

await upsert('forms', 'key', 'prodejce', {
  name: 'Přihláška prodejce',
  key: 'prodejce',
  requiresEvent: true,
  fields: [
    text('company', 'Název společnosti', { required: true, width: 'half', helperText: 'Oficiální název pro fakturaci, u OSVČ jméno a příjmení', errorMessage: 'Vyplňte název společnosti' }),
    text('stand', 'Název stánku', { required: true, width: 'half', helperText: 'Přesný název, který budeme uvádět na akci', errorMessage: 'Vyplňte název stánku' }),
    text('ico', 'IČO', { required: true, width: 'half', placeholder: '12345678', errorMessage: 'Vyplňte IČO' }),
    text('dic', 'DIČ', { width: 'half', placeholder: 'CZ12345678', helperText: 'Jen pro plátce DPH' }),
    text('name', 'Jméno a příjmení', { required: true, width: 'half', helperText: 'Osoba odpovědná za prezentaci na akci', errorMessage: 'Vyplňte jméno a příjmení' }),
    text('phone', 'Telefon', { required: true, width: 'half', inputType: 'tel', placeholder: '+420 123 456 789', errorMessage: 'Zadejte platný telefon' }),
    text('email', 'E-mail', { required: true, width: 'half', inputType: 'email', placeholder: 'jmeno@email.cz', errorMessage: 'Zadejte platný e-mail' }),
    text('web', 'Web nebo sociální sítě', { width: 'half', placeholder: 'www.vasestanek.cz' }),
    {
      __component: 'form.select', name: 'sortiment', label: 'Sortiment', required: true, multiple: true, width: 'full',
      errorMessage: 'Vyberte alespoň jednu možnost',
      items: items('Burgery', 'Jiný slaný sortiment', 'Sladký sortiment', 'Nápoje', 'Jiný sortiment'),
    },
    { __component: 'form.radio', name: 'standSize', label: 'Velikost stánku', required: true, errorMessage: 'Vyberte velikost stánku', items: items('300 × 300 cm', '200 × 200 cm', 'Jiná') },
    { __component: 'form.radio', name: 'standType', label: 'Prodejní pozice', required: true, errorMessage: 'Vyberte typ prodejní pozice', items: items('Stan', 'Food truck', 'Jiná') },
    text('power', 'Příkon (kW)', { required: true, width: 'half', helperText: 'Celkový příkon elektřiny v kilowattech', errorMessage: 'Vyplňte příkon' }),
    text('connection', 'Připojení', { width: 'half', helperText: 'Požadované napětí a jištění, např. 400 V / 32 A' }),
    { __component: 'form.radio', name: 'fridge', label: 'Chladicí vůz', required: false, items: items('Ano', 'Ne') },
    {
      __component: 'form.upload', name: 'photos', label: 'Fotografie stánku nebo menu', required: false, multiple: true,
      helperText: 'JPG, PNG nebo PDF, max. 10 MB, nejvýše 3 soubory', allowedTypes: 'image/*,application/pdf',
    },
    text('message', 'Vaše zpráva', { inputType: 'textarea' }),
  ],
  consent: {
    name: 'consent',
    label: 'Souhlasím se zpracováním osobních údajů za účelem vyřízení přihlášky. Více v [zásadách ochrany osobních údajů](/ochrana-osobnich-udaju).',
    required: true,
    errorMessage: 'Bez souhlasu nemůžeme přihlášku zpracovat',
  },
});

/* --------------------------------------------------------------- pages */

console.log('Stránky…');
await upsert('pages', 'slug', 'info', {
  title: 'Jak to funguje',
  slug: 'info',
  perex: 'Od výběru akce po první prodanou porci. Takhle probíhá spolupráce s prodejci i pořadateli.',
  blocks: [
    {
      __component: 'blocks.cards',
      title: 'Tři kroky k místu v gastrozóně',
      background: 'grey',
      items: [
        { number: '01', title: 'Vyberte akci', text: 'V přehledu akcí najdete termíny, místo i to, zda je přihláška otevřená.' },
        { number: '02', title: 'Pošlete přihlášku', text: 'Vyplňte údaje o stánku a přiložte fotku. Zabere to pět minut.' },
        { number: '03', title: 'Domluvíme podmínky', text: 'Ozveme se s podmínkami, rozvržením zóny a technickými požadavky.' },
      ],
    },
    {
      __component: 'blocks.accordion',
      title: 'Časté dotazy',
      items: [
        { question: 'Kolik stojí místo v gastrozóně?', answer: 'Podmínky se liší podle akce — nájem, provize nebo kombinace. Pošleme je po přihlášce.' },
        { question: 'Je přihláška závazná?', answer: 'Ne. Závazná je až smlouva, kterou podepíšeme po domluvě podmínek.' },
        { question: 'Zajistíte elektřinu a vodu?', answer: 'Ano, na většině akcí. Příkon a požadované jištění uveďte v přihlášce.' },
      ],
    },
    { __component: 'blocks.cta', title: 'Máte vybráno?', text: 'Přihlaste se na akci a my se ozveme.', cta: cta('Přihlásit se na akci', '/prihlaska'), background: 'yellow' },
  ],
  seo: seo('Jak to funguje', 'Jak probíhá spolupráce s Gastrozónami — pro prodejce i pořadatele akcí.'),
});

await upsert('pages', 'slug', 'pro-prodejce', {
  title: 'Pro prodejce',
  slug: 'pro-prodejce',
  perex: 'Hledáme prodejce jídla a nápojů na sezónu 2026. Vyber si akci, přihlas se a my se ozveme s podmínkami i rozvržením zóny.',
  blocks: [
    {
      __component: 'blocks.text',
      title: 'Proč prodávat s námi',
      background: 'white',
      body: `- **Velké akce** — festivaly pro tisíce návštěvníků
- **Připravená zóna** — přípojky, odpad, hygiena, značení
- **Jeden kontakt** — domluva, smlouva i koordinace na místě`,
    },
    { __component: 'blocks.events', title: 'Akce s otevřenou přihláškou', limit: 6, filter: 'upcoming', cta: cta('Všechny akce', '/akce') },
    { __component: 'blocks.cta', title: 'Přidejte se', text: 'Přihláška zabere pět minut.', cta: cta('Přihlásit se na akci', '/prihlaska'), background: 'yellow' },
  ],
  seo: seo('Pro prodejce', 'Prodávejte na festivalech a akcích s Gastrozónami — přihláška pro food trucky a stánky.'),
});

await upsert('pages', 'slug', 'pro-poradatele', {
  title: 'Pro pořadatele',
  slug: 'pro-poradatele',
  perex: 'Postavíme vám gastrozónu, na kterou se lidé budou chtít vracet — od dvou stánků po celé food městečko.',
  blocks: [
    {
      __component: 'blocks.cards',
      title: 'Co pro vás zajistíme',
      background: 'grey',
      items: [
        { number: '01', title: 'Výběr prodejců', text: 'Skladbu nabídky sestavíme podle publika a charakteru akce.' },
        { number: '02', title: 'Technika a logistika', text: 'Přípojky, odpad, hygiena, platby i značení zóny.' },
        { number: '03', title: 'Koordinace na místě', text: 'Náš člověk je na akci od stavby po úklid.' },
      ],
    },
    { __component: 'blocks.tags', title: 'Stavíme pro:', items: ['Festivaly', 'Dětské dny', 'Teambuildingy', 'Konference', 'Svatby'].map((label) => ({ label })) },
    {
      __component: 'blocks.logos',
      title: 'Jsme tu pro **náročné klienty**',
      text: 'Nejlépe nás doporučí klienti, kteří se k nám pravidelně vracejí.',
      moreLabel: 'a další...',
      logos,
    },
    { __component: 'blocks.cta', title: 'Plánujete akci?', text: 'Napište nám termín a odhad návštěvnosti, zbytek domluvíme.', cta: cta('Kontaktujte nás', '/kontakt'), background: 'yellow' },
  ],
  seo: seo('Pro pořadatele', 'Gastrozóna na klíč pro festivaly, firemní akce i svatby.'),
});

await upsert('pages', 'slug', 'ochrana-osobnich-udaju', {
  title: 'Ochrana osobních údajů',
  slug: 'ochrana-osobnich-udaju',
  perex: 'Jak zpracováváme osobní údaje z přihlášek, newsletteru a webu. (návrh — ke kontrole)',
  blocks: [
    {
      __component: 'blocks.text',
      background: 'white',
      body: `## Správce údajů

Správcem osobních údajů je provozovatel webu gastrozony.cz. Kontakt: [info@gastrozony.cz](mailto:info@gastrozony.cz).

## Jaké údaje zpracováváme

- **Přihláška prodejce** — název firmy, IČO/DIČ, jméno, telefon, e-mail, údaje o stánku a přiložené soubory. Účel: vyřízení přihlášky a uzavření smlouvy. Doba uložení: 3 roky.
- **Newsletter** — e-mail. Účel: zasílání novinek na základě souhlasu. Doba uložení: do odhlášení.
- **Analytické cookies** — pouze s vaším souhlasem, viz [Cookies](/cookies).

## Vaše práva

Máte právo na přístup k údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost a vznesení námitky. Souhlas můžete kdykoli odvolat. Stížnost můžete podat u Úřadu pro ochranu osobních údajů (www.uoou.cz).`,
    },
  ],
  seo: { ...seo('Ochrana osobních údajů', 'Zásady zpracování osobních údajů na webu gastrozony.cz.') },
});

await upsert('pages', 'slug', 'cookies', {
  title: 'Cookies',
  slug: 'cookies',
  perex: 'Jaké cookies používáme a jak můžete svůj souhlas změnit. (návrh — ke kontrole)',
  blocks: [
    {
      __component: 'blocks.text',
      background: 'white',
      body: `## Nutné cookies

Zajišťují základní funkce webu a uložení vaší volby cookies (\`gz_consent\`, 12 měsíců). Nelze je vypnout.

## Analytické cookies

Google Analytics 4 (\`_ga\`, \`_ga_*\`) — měření návštěvnosti. Používáme je **jen s vaším souhlasem**; bez něj se skript nenačte.

## Změna souhlasu

Svou volbu můžete kdykoli změnit v nastavení cookies v patičce webu.`,
    },
  ],
  seo: seo('Cookies', 'Informace o cookies na webu gastrozony.cz.'),
});

/* -------------------------------------------------- demo přihlášky */

console.log('Demo přihlášky…');
const demoApplication = (email, name, event, result) =>
  upsert('applications', 'contactEmail', email, {
    formKey: 'prodejce',
    contactEmail: email,
    contactName: name,
    event,
    status: 'nova',
    source: 'seed',
    mailSent: false,
    result,
  });

await demoApplication('demo.burger@example.com', 'Jan Novák', events.mint, [
  { key: 'company', label: 'Název společnosti', value: 'Burger Bros s.r.o.' },
  { key: 'stand', label: 'Název stánku', value: 'Burger Bros' },
  { key: 'ico', label: 'IČO', value: '12345678' },
  { key: 'name', label: 'Jméno a příjmení', value: 'Jan Novák' },
  { key: 'phone', label: 'Telefon', value: '+420 123 456 789' },
  { key: 'email', label: 'E-mail', value: 'demo.burger@example.com' },
  { key: 'sortiment', label: 'Sortiment', value: 'Burgery, Nápoje' },
  { key: 'standType', label: 'Prodejní pozice', value: 'Food truck' },
]);
await demoApplication('demo.kava@example.com', 'Eva Dvořáková', events.hhzBa, [
  { key: 'company', label: 'Název společnosti', value: 'Eva Dvořáková' },
  { key: 'stand', label: 'Název stánku', value: 'Kafe na kolech' },
  { key: 'ico', label: 'IČO', value: '87654321' },
  { key: 'name', label: 'Jméno a příjmení', value: 'Eva Dvořáková' },
  { key: 'phone', label: 'Telefon', value: '+420 987 654 321' },
  { key: 'email', label: 'E-mail', value: 'demo.kava@example.com' },
  { key: 'sortiment', label: 'Sortiment', value: 'Nápoje, Sladký sortiment' },
  { key: 'standType', label: 'Prodejní pozice', value: 'Stan' },
]);

console.log('\nHotovo ✔');
