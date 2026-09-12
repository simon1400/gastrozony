/**
 * Генератор контент-модели Strapi 5 для Gastrozony.
 * Запуск: node scripts-gen-model.mjs
 * Идемпотентен — перезаписывает schema.json, controllers/routes/services создаёт если нет.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { labelsFor } from './cs-labels.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'strapi');
const COMPONENTS = join(ROOT, 'src', 'components');
const API = join(ROOT, 'src', 'api');

const write = (p, data) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n', 'utf8');
};
const writeIfAbsent = (p, data) => { if (!existsSync(p)) write(p, data); };

/** Поля, которые Strapi добавляет сам — в attributes их нет, а в админке они видны. */
const COMMON_ATTRIBUTES = {
  createdAt: true, updatedAt: true, publishedAt: true, createdBy: true, updatedBy: true,
};

/**
 * Чешские подписи полей для Content Manager (scripts/cs-labels.mjs).
 * Strapi читает их из `config.metadatas` схемы, когда генерирует конфигурацию админки
 * для ещё неизвестной модели — то есть на чистой базе. На уже существующей базе
 * приоритет у значений из БД, туда подписи пишет `scripts/apply-cs-labels.mjs`.
 */
const labelConfig = (uid, attributes) => {
  const labels = labelsFor(uid);
  if (!labels) return undefined;
  const metadatas = {};
  for (const [field, label] of Object.entries(labels)) {
    // системные поля (createdAt…) в attributes нет — Strapi добавляет их сам
    if (field in attributes || field in COMMON_ATTRIBUTES) {
      metadatas[field] = { edit: { label }, list: { label } };
    }
  }
  return { metadatas };
};

/* ------------------------------------------------------------------ helpers */

const str = (o = {}) => ({ type: 'string', ...o });
const txt = (o = {}) => ({ type: 'text', ...o });
const rich = (o = {}) => ({ type: 'richtext', ...o });
const bool = (o = {}) => ({ type: 'boolean', ...o });
const int = (o = {}) => ({ type: 'integer', ...o });
const date = (o = {}) => ({ type: 'date', ...o });
const enu = (values, o = {}) => ({ type: 'enumeration', enum: values, ...o });
const media = (multiple = false, allowed = ['images'], o = {}) => ({
  type: 'media', multiple, required: false, allowedTypes: allowed, ...o,
});
const comp = (component, repeatable = false, o = {}) => ({ type: 'component', repeatable, component, ...o });
const zone = (components, o = {}) => ({ type: 'dynamiczone', components, ...o });
const rel = (target, relation = 'oneToOne', o = {}) => ({ type: 'relation', relation, target, ...o });
const uid = (targetField, o = {}) => ({ type: 'uid', targetField, ...o });

/* --------------------------------------------------------------- components */

const components = {
  /* --- общие --- */
  'shared/seo': {
    displayName: 'SEO', icon: 'search',
    attributes: {
      metaTitle: str({ maxLength: 70 }),
      metaDescription: txt({ maxLength: 180 }),
      metaImage: media(),
      keywords: str(),
      noIndex: bool({ default: false }),
    },
  },
  'shared/social-link': {
    displayName: 'Sociální síť', icon: 'link',
    attributes: {
      platform: enu(['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'x'], { required: true }),
      url: str({ required: true }),
    },
  },
  'shared/cta': {
    displayName: 'CTA tlačítko', icon: 'cursor',
    attributes: {
      label: str({ required: true }),
      url: str({ required: true }),
      variant: enu(['primary', 'outline', 'dark'], { default: 'primary' }),
      newTab: bool({ default: false }),
    },
  },
  'shared/stat': {
    displayName: 'Statistika', icon: 'chartBubble',
    attributes: { value: str({ required: true }), label: str({ required: true }) },
  },
  'shared/numbered-card': {
    displayName: 'Číslovaná karta', icon: 'grid',
    attributes: {
      number: str({ required: true }),
      title: str({ required: true }),
      text: txt(),
      image: media(),
    },
  },
  'shared/tag': {
    displayName: 'Štítek', icon: 'priceTag',
    attributes: { label: str({ required: true }) },
  },

  /* --- навигация --- */
  'nav/nav-link': {
    displayName: 'Odkaz', icon: 'link',
    attributes: { label: str({ required: true }), url: str({ required: true }), newTab: bool({ default: false }) },
  },
  'nav/nav-item': {
    displayName: 'Položka navigace', icon: 'bulletList',
    attributes: {
      label: str({ required: true }),
      url: str(),
      children: comp('nav.nav-link', true),
    },
  },
  'nav/footer-column': {
    displayName: 'Sloupec patičky', icon: 'layout',
    attributes: { title: str({ required: true }), links: comp('nav.nav-link', true) },
  },

  /* --- homepage --- */
  'home/hero': {
    displayName: 'Hero', icon: 'picture',
    attributes: {
      title: str({ required: true }),
      perex: txt(),
      ctas: comp('shared.cta', true),
      images: media(true),
    },
  },
  'home/intro': {
    displayName: 'Intro (2 sloupce)', icon: 'layer',
    // text: odstavce oddělené prázdným řádkem (v макете 2 абзаца в правой колонке)
    attributes: { title: str({ required: true }), text: txt() },
  },
  'home/clients-block': {
    displayName: 'Blok klientů', icon: 'briefcase',
    attributes: {
      title: str(),
      text: txt(),
      cta: comp('shared.cta'),
      moreLabel: str({ default: 'a další…' }),
      logos: rel('api::client-logo.client-logo', 'oneToMany'),
    },
  },
  'home/events-block': {
    displayName: 'Blok akcí', icon: 'calendar',
    attributes: {
      title: str(),
      text: txt(),
      limit: int({ default: 3, min: 1, max: 12 }),
      cta: comp('shared.cta'),
    },
  },

  /* --- формы --- */
  'form/select-item': {
    displayName: 'Položka výběru', icon: 'bulletList',
    attributes: { label: str({ required: true }), value: str(), disabled: bool({ default: false }) },
  },
  'form/text-field': {
    displayName: 'Textové pole', icon: 'write',
    attributes: {
      name: str({ required: true }),
      label: str({ required: true }),
      placeholder: str(),
      helperText: str(),
      errorMessage: str(),
      required: bool({ default: false }),
      inputType: enu(['text', 'email', 'tel', 'number', 'url', 'textarea'], { default: 'text' }),
      width: enu(['full', 'half'], { default: 'full' }),
    },
  },
  'form/select': {
    displayName: 'Výběr (select)', icon: 'filter',
    attributes: {
      name: str({ required: true }),
      label: str({ required: true }),
      placeholder: str(),
      helperText: str(),
      errorMessage: str(),
      required: bool({ default: false }),
      multiple: bool({ default: false }),
      width: enu(['full', 'half'], { default: 'full' }),
      items: comp('form.select-item', true),
    },
  },
  'form/radio': {
    displayName: 'Přepínače (radio)', icon: 'dot-circle',
    attributes: {
      name: str({ required: true }),
      label: str({ required: true }),
      helperText: str(),
      errorMessage: str(),
      required: bool({ default: false }),
      items: comp('form.select-item', true),
    },
  },
  'form/checkbox': {
    displayName: 'Zaškrtávátko', icon: 'check',
    attributes: {
      name: str({ required: true }),
      label: txt({ required: true }),
      errorMessage: str(),
      required: bool({ default: false }),
    },
  },
  'form/upload': {
    displayName: 'Nahrání souboru', icon: 'upload',
    attributes: {
      name: str({ required: true }),
      label: str({ required: true }),
      helperText: str(),
      errorMessage: str(),
      required: bool({ default: false }),
      multiple: bool({ default: false }),
      allowedTypes: str({ default: 'image/*,application/pdf' }),
    },
  },
  'form/result-item': {
    displayName: 'Položka výsledku', icon: 'bulletList',
    attributes: { key: str({ required: true }), label: str(), value: txt() },
  },

  /* --- блоки динамической зоны (obecná šablona) --- */
  'blocks/text': {
    displayName: 'Text', icon: 'alignLeft',
    attributes: { title: str(), body: rich({ required: true }), background: enu(['white', 'grey', 'black'], { default: 'white' }) },
  },
  'blocks/gallery': {
    displayName: 'Galerie', icon: 'picture',
    attributes: { title: str(), images: media(true, ['images'], { required: true }), columns: int({ default: 3, min: 1, max: 6 }) },
  },
  'blocks/cta': {
    displayName: 'CTA blok', icon: 'cursor',
    attributes: { title: str(), text: txt(), cta: comp('shared.cta'), background: enu(['white', 'grey', 'black', 'yellow'], { default: 'yellow' }) },
  },
  'blocks/cards': {
    displayName: 'Karty 01/02/03', icon: 'grid',
    attributes: { title: str(), text: txt(), items: comp('shared.numbered-card', true), background: enu(['white', 'grey', 'black'], { default: 'grey' }) },
  },
  'blocks/tags': {
    displayName: 'Štítky', icon: 'priceTag',
    attributes: { title: str({ default: 'Stavíme pro:' }), items: comp('shared.tag', true) },
  },
  'blocks/logos': {
    displayName: 'Logotypy klientů', icon: 'briefcase',
    attributes: { title: str(), text: txt(), cta: comp('shared.cta'), moreLabel: str(), logos: rel('api::client-logo.client-logo', 'oneToMany') },
  },
  'blocks/stats': {
    displayName: 'Statistiky', icon: 'chartBubble',
    attributes: { items: comp('shared.stat', true) },
  },
  'blocks/image-text': {
    displayName: 'Obrázek + text', icon: 'layout',
    attributes: {
      title: str(), body: rich(), image: media(true),
      imagePosition: enu(['left', 'right'], { default: 'right' }),
      cta: comp('shared.cta'),
      background: enu(['white', 'grey', 'black'], { default: 'white' }),
    },
  },
  'blocks/events': {
    displayName: 'Výpis akcí', icon: 'calendar',
    attributes: {
      title: str(), text: txt(),
      limit: int({ default: 3, min: 1, max: 12 }),
      filter: enu(['all', 'upcoming', 'past'], { default: 'upcoming' }),
      cta: comp('shared.cta'),
    },
  },
  'blocks/accordion-item': {
    displayName: 'Položka akordeonu', icon: 'chevronDown',
    attributes: { question: str({ required: true }), answer: rich({ required: true }) },
  },
  'blocks/accordion': {
    displayName: 'Akordeon / FAQ', icon: 'chevronDown',
    attributes: { title: str(), items: comp('blocks.accordion-item', true) },
  },
};

const PAGE_BLOCKS = [
  'blocks.text', 'blocks.gallery', 'blocks.cta', 'blocks.cards', 'blocks.tags',
  'blocks.logos', 'blocks.stats', 'blocks.image-text', 'blocks.events', 'blocks.accordion',
];
const FORM_FIELDS = ['form.text-field', 'form.select', 'form.radio', 'form.checkbox', 'form.upload'];

/* ------------------------------------------------------------ content types */

const contentTypes = {
  /* ---------------------------- single types ---------------------------- */
  global: {
    kind: 'singleType', displayName: 'Globální nastavení', description: 'Kontakty, logo, sociální sítě, výchozí SEO',
    draftAndPublish: false,
    attributes: {
      siteName: str({ default: 'Gastrozóny' }),
      // logo / favicon — статикой в client/public (решение 2026-09-11), в CMS не редактируются
      phone: str(),
      email: str(),
      address: txt(),
      ico: str(),
      dic: str(),
      socials: comp('shared.social-link', true),
      applicationRecipients: txt(),
      defaultSeo: comp('shared.seo'),
      // stránka 404
      notFoundTitle: str({ default: 'Tahle stránka **neexistuje**' }),
      notFoundText: txt(),
      notFoundHomeLabel: str({ default: 'Zpět na úvod' }),
      notFoundEventsLabel: str({ default: 'Aktuální akce' }),
    },
  },
  navigation: {
    kind: 'singleType', displayName: 'Navigace', description: 'Menu v hlavičce a patičce',
    draftAndPublish: false,
    attributes: {
      header: comp('nav.nav-item', true),
      headerCta: comp('shared.cta'),
      footerColumns: comp('nav.footer-column', true),
      footerNote: txt(),
      footerLegal: comp('nav.nav-link', true),
    },
  },
  homepage: {
    kind: 'singleType', displayName: 'Domovská stránka',
    attributes: {
      hero: comp('home.hero'),
      stats: comp('shared.stat', true),
      intro: comp('home.intro'),
      cards: comp('shared.numbered-card', true),
      tagsTitle: str({ default: 'Stavíme pro:' }),
      tags: comp('shared.tag', true),
      clients: comp('home.clients-block'),
      events: comp('home.events-block'),
      seo: comp('shared.seo'),
    },
  },
  newsletter: {
    kind: 'singleType', displayName: 'Newsletter', description: 'Blok nad patičkou (Ecomail)',
    draftAndPublish: false,
    attributes: {
      title: str({ default: 'Nezmeškejte žádnou akci' }),
      text: txt(),
      emailLabel: str({ default: 'Váš e-mail' }),
      placeholder: str({ default: 'jmeno@email.cz' }),
      buttonLabel: str({ default: 'Odebírat' }),
      consentText: txt(),
      successText: txt(),
      errorText: txt(),
      // Nastavení Ecomailu: prázdné = bere se z ENV (ECOMAIL_LIST_ID / ECOMAIL_TAGS).
      // Bez `private`: private pole Strapi nevrací ani na serverový token. API klíč zůstává jen v ENV.
      ecomailListId: str(),
      ecomailTags: str(),
      doubleOptIn: bool({ default: true }),
      enabled: bool({ default: true }),
    },
  },
  'application-page': {
    kind: 'singleType', displayName: 'Stránka přihlášky',
    attributes: {
      title: str({ default: 'Přihláška' }),
      perex: txt(),
      contentBefore: rich(),
      contentAfter: rich(),
      eventSelectLabel: str({ default: 'Vyberte akci' }),
      eventPlaceholder: str({ default: '— vyberte akci —' }),
      // místo formuláře, když není otevřená žádná akce (form.requiresEvent)
      noEventsText: txt(),
      uploadLabel: str({ default: 'Vybrat soubory' }),
      submitLabel: str({ default: 'Odeslat přihlášku' }),
      successTitle: str({ default: 'Děkujeme!' }),
      successText: txt(),
      errorText: txt(),
      rateLimitText: txt(),
      // potvrzovací e-mail odesílateli přihlášky (Resend)
      mailSubject: str({ default: 'Přijali jsme vaši přihlášku' }),
      mailIntro: txt(),
      mailNote: txt(),
      seo: comp('shared.seo'),
    },
  },
  'events-page': {
    kind: 'singleType', displayName: 'Výpis akcí', description: 'Úvod stránky /akce a texty detailu akce',
    attributes: {
      title: str({ default: 'Akce' }),
      perex: txt(),
      emptyText: str({ default: 'Momentálně tu nic není.' }),
      tabCurrentLabel: str({ default: 'Aktuální' }),
      tabUpcomingLabel: str({ default: 'Připravujeme' }),
      tabPastLabel: str({ default: 'Proběhlé' }),
      applyLabel: str({ default: 'Přihlásit se na tuto akci' }),
      applicationClosedText: str({ default: 'Přihlášky na tuto akci jsou uzavřené.' }),
      dateLabel: str({ default: 'Termín' }),
      placeLabel: str({ default: 'Místo' }),
      capacityLabel: str({ default: 'Kapacita' }),
      mapLabel: str({ default: 'Zobrazit na mapě' }),
      galleryTitle: str({ default: 'Galerie' }),
      backLabel: str({ default: 'Všechny akce' }),
      seo: comp('shared.seo'),
    },
  },
  'blog-page': {
    kind: 'singleType', displayName: 'Blog', description: 'Úvod výpisu novinek (/novinky)',
    attributes: {
      title: str({ default: 'Novinky' }),
      perex: txt(),
      emptyText: str({ default: 'Zatím tu nejsou žádné články.' }),
      backLabel: str({ default: 'Všechny novinky' }),
      moreTitle: str({ default: 'Další články' }),
      prevLabel: str({ default: 'Předchozí' }),
      nextLabel: str({ default: 'Další' }),
      seo: comp('shared.seo'),
    },
  },
  'cookie-consent': {
    kind: 'singleType', displayName: 'Cookies lišta', description: 'Texty cookie lišty a nastavení souhlasu (GA4 Consent Mode)',
    draftAndPublish: false,
    attributes: {
      title: str({ default: 'Používáme cookies' }),
      // markdown — odkazy na /cookies a /ochrana-osobnich-udaju
      text: txt(),
      acceptAllLabel: str({ default: 'Přijmout vše' }),
      necessaryOnlyLabel: str({ default: 'Pouze nutné' }),
      settingsLabel: str({ default: 'Nastavení' }),
      saveLabel: str({ default: 'Uložit volbu' }),
      necessaryTitle: str({ default: 'Nutné' }),
      necessaryText: txt(),
      alwaysActiveLabel: str({ default: 'Vždy aktivní' }),
      analyticsTitle: str({ default: 'Analytické' }),
      analyticsText: txt(),
      footerLinkLabel: str({ default: 'Nastavení cookies' }),
    },
  },
  'contact-page': {
    kind: 'singleType', displayName: 'Kontakt',
    attributes: {
      title: str({ default: 'Kontakt' }),
      perex: txt(),
      body: rich(),
      phone: str(),
      email: str(),
      address: txt(),
      // odkaz „Sdílet → Vložit mapu“ (…/maps/embed…) se vloží jako iframe; jiný odkaz = jen tlačítko na mapu
      googleMapsUrl: str(),
      emailLabel: str({ default: 'E-mail' }),
      phoneLabel: str({ default: 'Telefon' }),
      addressLabel: str({ default: 'Adresa' }),
      mapLabel: str({ default: 'Zobrazit na mapě' }),
      teamTitle: str({ default: 'Náš tým' }),
      team: rel('api::team-member.team-member', 'oneToMany'),
      blocks: zone(PAGE_BLOCKS),
      seo: comp('shared.seo'),
    },
  },

  /* -------------------------- collection types -------------------------- */
  form: {
    kind: 'collectionType', displayName: 'Formulář', pluralName: 'forms',
    description: 'Dynamický formulář — pole se konfigurují zde, ne v kódu',
    attributes: {
      name: str({ required: true }),
      key: enu(['prodejce', 'poradatel'], { required: true }),
      fields: zone(FORM_FIELDS),
      consent: comp('form.checkbox'),
      // одна акция на заявку (Q7) — мультивыбора нет
      requiresEvent: bool({ default: false }),
    },
  },
  event: {
    kind: 'collectionType', displayName: 'Akce', pluralName: 'events',
    attributes: {
      title: str({ required: true }),
      slug: uid('title', { required: true }),
      perex: txt(),
      content: rich(),
      place: str(),
      dateFrom: date(),
      dateTo: date(),
      cover: media(),
      gallery: media(true),
      statusOverride: enu(['pripravujeme', 'aktualni', 'ukonceno']),
      applicationOpen: bool({ default: true }),
      capacityState: enu(['volno', 'posledni-mista', 'obsazeno', 'nahradnik']),
      googleMapsUrl: str(),
      featured: bool({ default: false }),
      order: int({ default: 0 }),
      seo: comp('shared.seo'),
    },
  },
  page: {
    kind: 'collectionType', displayName: 'Stránka', pluralName: 'pages',
    description: 'Obecná šablona — složí se z dynamických bloků',
    attributes: {
      title: str({ required: true }),
      slug: uid('title', { required: true }),
      perex: txt(),
      cover: media(),
      cta: comp('shared.cta'),
      blocks: zone(PAGE_BLOCKS),
      seo: comp('shared.seo'),
    },
  },
  application: {
    kind: 'collectionType', displayName: 'Přihláška', pluralName: 'applications',
    draftAndPublish: false,
    attributes: {
      formKey: enu(['prodejce', 'poradatel'], { required: true }),
      result: comp('form.result-item', true),
      event: rel('api::event.event', 'manyToOne'),
      contactEmail: str(),
      contactName: str(),
      status: enu(['nova', 'kontaktovana', 'schvalena', 'zamitnuta'], { default: 'nova' }),
      note: txt(),
      attachments: media(true, ['images', 'files']),
      mailSent: bool({ default: false }),
      source: str({ private: true }),
    },
  },
  article: {
    kind: 'collectionType', displayName: 'Články', pluralName: 'articles',
    description: 'Blog / novinky (/novinky)',
    attributes: {
      title: str({ required: true }),
      slug: uid('title', { required: true }),
      // datum zobrazené na kartě a řazení; prázdné doplní lifecycle (dnešek) — src/api/article/content-types/article/lifecycles.ts
      date: date(),
      perex: txt(),
      cover: media(),
      content: rich(),
      seo: comp('shared.seo'),
    },
  },
  'team-member': {
    kind: 'collectionType', displayName: 'Člen týmu', pluralName: 'team-members',
    attributes: {
      name: str({ required: true }),
      position: str(),
      photo: media(),
      phone: str(),
      email: str(),
      order: int({ default: 0 }),
    },
  },
  'client-logo': {
    kind: 'collectionType', displayName: 'Logo klienta', pluralName: 'client-logos',
    attributes: {
      name: str({ required: true }),
      logo: media(false, ['images'], { required: true }),
      url: str(),
      order: int({ default: 0 }),
    },
  },
  'newsletter-subscriber': {
    kind: 'collectionType', displayName: 'Odběratel newsletteru', pluralName: 'newsletter-subscribers',
    draftAndPublish: false,
    attributes: {
      email: str({ required: true, unique: true }),
      consent: bool({ default: false, required: true }),
      syncedToEcomail: bool({ default: false }),
      source: str(),
    },
  },
};

/* -------------------------------------------------------------- генерация */

let nComp = 0, nType = 0;

for (const [path, def] of Object.entries(components)) {
  const [category, name] = path.split('/');
  write(join(COMPONENTS, category, `${name}.json`), {
    collectionName: `components_${category}_${name.replace(/-/g, '_')}s`,
    info: { displayName: def.displayName, icon: def.icon, description: def.description ?? '' },
    options: {},
    attributes: def.attributes,
    config: labelConfig(`${category}.${name}`, def.attributes),
  });
  nComp++;
}

for (const [name, def] of Object.entries(contentTypes)) {
  const pluralName = def.pluralName ?? `${name}s`;
  const collectionName = pluralName.replace(/-/g, '_');

  write(join(API, name, 'content-types', name, 'schema.json'), {
    kind: def.kind,
    collectionName,
    info: {
      singularName: name,
      pluralName,
      displayName: def.displayName,
      description: def.description ?? '',
    },
    options: { draftAndPublish: def.draftAndPublish ?? true },
    pluginOptions: {},
    attributes: def.attributes,
    config: labelConfig(`api::${name}.${name}`, def.attributes),
  });

  const ref = `api::${name}.${name}`;
  writeIfAbsent(join(API, name, 'controllers', `${name}.ts`),
    `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('${ref}');\n`);
  writeIfAbsent(join(API, name, 'services', `${name}.ts`),
    `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('${ref}');\n`);
  writeIfAbsent(join(API, name, 'routes', `${name}.ts`),
    `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('${ref}');\n`);
  nType++;
}

console.log(`komponenty: ${nComp}`);
console.log(`content-types: ${nType}`);
