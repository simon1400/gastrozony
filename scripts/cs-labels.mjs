/**
 * Чешские подписи полей (labels) для админки Strapi — единый источник правды.
 *
 * Ключи полей (name/slug/perex…) НЕ меняются: это API-имена, на них держится фронтенд.
 * Меняется только то, что заказчик видит в Content Manager.
 *
 * Куда попадает:
 *  1. `scripts/gen-strapi-model.mjs` → `config.metadatas` в schema.json компонентов и типов
 *     (чтобы подписи были и на чистой базе);
 *  2. `scripts/apply-cs-labels.mjs` → конфигурация Content Manager в уже существующей базе
 *     (dev и прод) — Strapi при старте не перезаписывает то, что уже лежит в БД.
 *
 * Строки — только чешские (см. CLAUDE.md: контент и UI заказчика — čeština).
 */

/** Системные поля — одинаковы во всех типах. */
export const COMMON_LABELS = {
  createdAt: 'Vytvořeno',
  updatedAt: 'Naposledy upraveno',
  publishedAt: 'Publikováno',
  createdBy: 'Vytvořil',
  updatedBy: 'Upravil',
};

/** Content types: uid → { поле: чешская подпись }. */
export const CONTENT_TYPE_LABELS = {
  /* ------------------------------------------------------ single types */
  'api::global.global': {
    siteName: 'Název webu',
    phone: 'Telefon',
    email: 'E-mail',
    address: 'Adresa',
    ico: 'IČO',
    dic: 'DIČ',
    socials: 'Sociální sítě',
    applicationRecipients: 'Příjemci přihlášek (e-maily)',
    defaultSeo: 'Výchozí SEO',
    notFoundTitle: 'Stránka 404 — titulek',
    notFoundText: 'Stránka 404 — text',
    notFoundHomeLabel: 'Stránka 404 — tlačítko na úvod',
    notFoundEventsLabel: 'Stránka 404 — tlačítko na akce',
  },
  'api::navigation.navigation': {
    header: 'Hlavní menu',
    headerCta: 'Tlačítko v hlavičce',
    footerColumns: 'Sloupce v patičce',
    footerNote: 'Text v patičce',
    footerLegal: 'Právní odkazy v patičce',
  },
  'api::homepage.homepage': {
    hero: 'Hero (úvodní sekce)',
    stats: 'Statistiky',
    intro: 'Intro (dva sloupce)',
    cards: 'Číslované karty',
    tagsTitle: 'Titulek sekce se štítky',
    tags: 'Štítky',
    clients: 'Blok klientů',
    events: 'Blok akcí',
    seo: 'SEO',
  },
  'api::newsletter.newsletter': {
    title: 'Titulek',
    text: 'Text',
    emailLabel: 'Popisek pole e-mail',
    placeholder: 'Placeholder pole e-mail',
    buttonLabel: 'Text tlačítka',
    consentText: 'Text souhlasu',
    successText: 'Text po úspěšném přihlášení',
    errorText: 'Text při chybě',
    ecomailListId: 'Ecomail — ID seznamu',
    ecomailTags: 'Ecomail — štítky',
    doubleOptIn: 'Dvojí potvrzení (double opt-in)',
    enabled: 'Zapnuto',
  },
  'api::application-page.application-page': {
    title: 'Titulek stránky',
    perex: 'Perex',
    contentBefore: 'Text nad formulářem',
    contentAfter: 'Text pod formulářem',
    eventSelectLabel: 'Popisek výběru akce',
    eventPlaceholder: 'Placeholder výběru akce',
    noEventsText: 'Text, když nejsou žádné akce',
    uploadLabel: 'Popisek nahrávání souborů',
    submitLabel: 'Text tlačítka pro odeslání',
    successTitle: 'Titulek po odeslání',
    successText: 'Text po odeslání',
    errorText: 'Text při chybě',
    rateLimitText: 'Text při příliš častém odesílání',
    mailSubject: 'Potvrzovací e-mail — předmět',
    mailIntro: 'Potvrzovací e-mail — úvod',
    mailNote: 'Potvrzovací e-mail — poznámka',
    seo: 'SEO',
  },
  'api::events-page.events-page': {
    title: 'Titulek',
    perex: 'Perex',
    emptyText: 'Text, když nejsou žádné akce',
    tabCurrentLabel: 'Záložka — aktuální',
    tabUpcomingLabel: 'Záložka — připravujeme',
    tabPastLabel: 'Záložka — ukončené',
    applyLabel: 'Text tlačítka pro přihlášení',
    applicationClosedText: 'Text, když jsou přihlášky uzavřené',
    dateLabel: 'Popisek data',
    placeLabel: 'Popisek místa',
    capacityLabel: 'Popisek kapacity',
    mapLabel: 'Popisek odkazu na mapu',
    galleryTitle: 'Titulek galerie',
    backLabel: 'Popisek odkazu zpět',
    seo: 'SEO',
  },
  'api::blog-page.blog-page': {
    title: 'Titulek',
    perex: 'Perex',
    emptyText: 'Text, když nejsou žádné články',
    backLabel: 'Popisek odkazu zpět',
    moreTitle: 'Titulek sekce dalších článků',
    prevLabel: 'Popisek — předchozí',
    nextLabel: 'Popisek — další',
    seo: 'SEO',
  },
  'api::contact-page.contact-page': {
    title: 'Titulek',
    perex: 'Perex',
    body: 'Obsah',
    phone: 'Telefon',
    email: 'E-mail',
    address: 'Adresa',
    googleMapsUrl: 'Odkaz na Google Maps',
    emailLabel: 'Popisek e-mailu',
    phoneLabel: 'Popisek telefonu',
    addressLabel: 'Popisek adresy',
    mapLabel: 'Popisek odkazu na mapu',
    teamTitle: 'Titulek sekce týmu',
    team: 'Členové týmu',
    blocks: 'Bloky obsahu',
    seo: 'SEO',
  },
  'api::cookie-consent.cookie-consent': {
    title: 'Titulek',
    text: 'Text',
    acceptAllLabel: 'Tlačítko — přijmout vše',
    necessaryOnlyLabel: 'Tlačítko — pouze nutné',
    settingsLabel: 'Tlačítko — nastavení',
    saveLabel: 'Tlačítko — uložit volbu',
    necessaryTitle: 'Nutné cookies — titulek',
    necessaryText: 'Nutné cookies — text',
    alwaysActiveLabel: 'Popisek „vždy aktivní“',
    analyticsTitle: 'Analytické cookies — titulek',
    analyticsText: 'Analytické cookies — text',
    footerLinkLabel: 'Popisek odkazu v patičce',
  },

  /* -------------------------------------------------- collection types */
  'api::event.event': {
    title: 'Název akce',
    slug: 'URL adresa (slug)',
    perex: 'Perex',
    content: 'Obsah',
    place: 'Místo',
    dateFrom: 'Datum od',
    dateTo: 'Datum do',
    cover: 'Hlavní obrázek',
    gallery: 'Galerie',
    statusOverride: 'Stav akce (ruční nastavení)',
    applicationOpen: 'Přihlášky otevřené',
    capacityState: 'Stav kapacity',
    googleMapsUrl: 'Odkaz na Google Maps',
    featured: 'Zvýraznit na úvodní stránce',
    order: 'Pořadí',
    seo: 'SEO',
  },
  'api::page.page': {
    title: 'Titulek',
    slug: 'URL adresa (slug)',
    perex: 'Perex',
    cover: 'Hlavní obrázek',
    cta: 'Tlačítko (CTA)',
    blocks: 'Bloky obsahu',
    seo: 'SEO',
  },
  'api::article.article': {
    title: 'Titulek',
    slug: 'URL adresa (slug)',
    date: 'Datum',
    perex: 'Perex',
    cover: 'Hlavní obrázek',
    content: 'Obsah',
    seo: 'SEO',
  },
  'api::form.form': {
    name: 'Název formuláře',
    key: 'Klíč formuláře',
    fields: 'Pole formuláře',
    consent: 'Souhlas (GDPR)',
    requiresEvent: 'Vyžaduje výběr akce',
  },
  'api::application.application': {
    formKey: 'Typ formuláře',
    result: 'Odpovědi z formuláře',
    event: 'Akce',
    contactEmail: 'Kontaktní e-mail',
    contactName: 'Kontaktní jméno',
    status: 'Stav',
    note: 'Interní poznámka',
    attachments: 'Přílohy',
    mailSent: 'Potvrzovací e-mail odeslán',
    source: 'Zdroj',
  },
  'api::team-member.team-member': {
    name: 'Jméno a příjmení',
    position: 'Pozice',
    photo: 'Fotografie',
    phone: 'Telefon',
    email: 'E-mail',
    order: 'Pořadí',
  },
  'api::client-logo.client-logo': {
    name: 'Název klienta',
    logo: 'Logo',
    url: 'Odkaz na web',
    order: 'Pořadí',
  },
  'api::newsletter-subscriber.newsletter-subscriber': {
    email: 'E-mail',
    consent: 'Souhlas',
    syncedToEcomail: 'Přeneseno do Ecomailu',
    source: 'Zdroj',
  },

  /* ---------------------------------------- системный тип Strapi (не наш) */
  'plugin::users-permissions.user': {
    username: 'Uživatelské jméno',
    email: 'E-mail',
    provider: 'Poskytovatel přihlášení',
    password: 'Heslo',
    resetPasswordToken: 'Token pro obnovu hesla',
    confirmationToken: 'Potvrzovací token',
    confirmed: 'Potvrzeno',
    blocked: 'Blokováno',
    role: 'Role',
  },
};

/** Компоненты: uid → { поле: чешская подпись }. */
export const COMPONENT_LABELS = {
  /* ---------------------------------------------------------- shared */
  'shared.seo': {
    metaTitle: 'Meta titulek',
    metaDescription: 'Meta popis',
    metaImage: 'Obrázek pro sdílení',
    keywords: 'Klíčová slova',
    noIndex: 'Nezařazovat do vyhledávačů (noindex)',
  },
  'shared.social-link': {
    platform: 'Sociální síť',
    url: 'Odkaz (URL)',
  },
  'shared.cta': {
    label: 'Text tlačítka',
    url: 'Odkaz (URL)',
    variant: 'Varianta vzhledu',
    newTab: 'Otevřít v novém okně',
  },
  'shared.stat': {
    value: 'Hodnota',
    label: 'Popisek',
  },
  'shared.numbered-card': {
    number: 'Číslo',
    title: 'Titulek',
    text: 'Text',
    image: 'Obrázek',
  },
  'shared.tag': {
    label: 'Text štítku',
  },

  /* ------------------------------------------------------ navigation */
  'nav.nav-link': {
    label: 'Popisek',
    url: 'Odkaz (URL)',
    newTab: 'Otevřít v novém okně',
  },
  'nav.nav-item': {
    label: 'Popisek',
    url: 'Odkaz (URL)',
    children: 'Podpoložky',
  },
  'nav.footer-column': {
    title: 'Titulek sloupce',
    links: 'Odkazy',
  },

  /* -------------------------------------------------------- homepage */
  'home.hero': {
    title: 'Titulek',
    perex: 'Perex',
    ctas: 'Tlačítka',
    images: 'Obrázky',
  },
  'home.intro': {
    title: 'Titulek',
    text: 'Text (odstavce oddělte prázdným řádkem)',
  },
  'home.clients-block': {
    title: 'Titulek',
    text: 'Text',
    cta: 'Tlačítko',
    moreLabel: 'Popisek „další“',
    logos: 'Loga klientů',
  },
  'home.events-block': {
    title: 'Titulek',
    text: 'Text',
    limit: 'Počet akcí',
    cta: 'Tlačítko',
  },

  /* ---------------------------------------------------------- blocks */
  'blocks.text': {
    title: 'Titulek',
    body: 'Text',
    background: 'Pozadí',
  },
  'blocks.gallery': {
    title: 'Titulek',
    images: 'Obrázky',
    columns: 'Počet sloupců',
  },
  'blocks.cta': {
    title: 'Titulek',
    text: 'Text',
    cta: 'Tlačítko',
    background: 'Pozadí',
  },
  'blocks.cards': {
    title: 'Titulek',
    text: 'Text',
    items: 'Karty',
    background: 'Pozadí',
  },
  'blocks.tags': {
    title: 'Titulek',
    items: 'Štítky',
  },
  'blocks.logos': {
    title: 'Titulek',
    text: 'Text',
    cta: 'Tlačítko',
    moreLabel: 'Popisek „další“',
    logos: 'Loga klientů',
  },
  'blocks.stats': {
    items: 'Statistiky',
  },
  'blocks.image-text': {
    title: 'Titulek',
    body: 'Text',
    image: 'Obrázek',
    imagePosition: 'Pozice obrázku',
    cta: 'Tlačítko',
    background: 'Pozadí',
  },
  'blocks.events': {
    title: 'Titulek',
    text: 'Text',
    limit: 'Počet akcí',
    filter: 'Filtr akcí',
    cta: 'Tlačítko',
  },
  'blocks.accordion': {
    title: 'Titulek',
    items: 'Otázky a odpovědi',
  },
  'blocks.accordion-item': {
    question: 'Otázka',
    answer: 'Odpověď',
  },

  /* ------------------------------------------------------------ form */
  'form.text-field': {
    name: 'Klíč pole (name)',
    label: 'Popisek',
    placeholder: 'Placeholder',
    helperText: 'Nápověda pod polem',
    errorMessage: 'Chybová zpráva',
    required: 'Povinné',
    inputType: 'Typ pole',
    width: 'Šířka pole',
  },
  'form.select': {
    name: 'Klíč pole (name)',
    label: 'Popisek',
    placeholder: 'Placeholder',
    helperText: 'Nápověda pod polem',
    errorMessage: 'Chybová zpráva',
    required: 'Povinné',
    multiple: 'Více možností',
    width: 'Šířka pole',
    items: 'Možnosti',
  },
  'form.radio': {
    name: 'Klíč pole (name)',
    label: 'Popisek',
    helperText: 'Nápověda pod polem',
    errorMessage: 'Chybová zpráva',
    required: 'Povinné',
    items: 'Možnosti',
  },
  'form.checkbox': {
    name: 'Klíč pole (name)',
    label: 'Popisek',
    errorMessage: 'Chybová zpráva',
    required: 'Povinné',
  },
  'form.upload': {
    name: 'Klíč pole (name)',
    label: 'Popisek',
    helperText: 'Nápověda pod polem',
    errorMessage: 'Chybová zpráva',
    required: 'Povinné',
    multiple: 'Více souborů',
    allowedTypes: 'Povolené typy souborů',
  },
  'form.select-item': {
    label: 'Popisek',
    value: 'Hodnota',
    disabled: 'Nedostupné',
  },
  'form.result-item': {
    key: 'Klíč pole',
    label: 'Popisek',
    value: 'Hodnota',
  },
};

/** Все подписи одного типа/компонента, включая системные поля. */
export const labelsFor = (uid) => {
  const own = CONTENT_TYPE_LABELS[uid] ?? COMPONENT_LABELS[uid];
  if (!own) return null;
  // системные поля есть только у content types, у компонентов их метаданные всё равно игнорируются
  return CONTENT_TYPE_LABELS[uid] ? { ...COMMON_LABELS, ...own } : { ...own };
};
