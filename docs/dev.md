# Разработка — как поднять локально

## Требования
- Node 22 (проверено на 22.23.2)
- PostgreSQL 17 локально (служба `postgresql-x64-17`)

## База данных (локально)
```
host=127.0.0.1 port=5432 db=gastrozony user=gastrozony password=gastrozony
```
Создана 2026-09-04 (`CREATE ROLE gastrozony LOGIN...; CREATE DATABASE gastrozony OWNER gastrozony;`).
Реквизиты только для dev; на сервере будут другие (вопрос Q21).

## Strapi (`strapi/`)
```bash
cd strapi
npm run develop     # http://localhost:1337, админка /admin
```
- Strapi **5.52.3**, TypeScript, PostgreSQL (`strapi/.env`).
- При первом заходе в `/admin` создать администратора (логин локальный, в БД).
- Публичные read-права на контент выдаёт `src/index.ts` (bootstrap) — идемпотентно.
- `application` и `newsletter-subscriber` публично НЕ читаются; писать в них фронт
  будет через свои API routes с токеном (`STRAPI_API_TOKEN` — создать в админке позже).

### Контент-модель
Схемы генерируются скриптом:
```bash
node scripts/gen-strapi-model.mjs   # из корня проекта
```
Скрипт перезаписывает `schema.json` (source of truth — сам скрипт!),
controllers/routes/services не трогает, если уже существуют.
**Если меняешь модель через админку — перенеси изменение и в скрипт**, иначе
следующий запуск скрипта её затрёт.

Content-types: single — global, navigation, homepage, newsletter, application-page,
contact-page, blog-page; collection — event, page, article, form (key: prodejce/poradatel), application,
team-member, client-logo, newsletter-subscriber.

### API-токен и seed-контент
```bash
node scripts/create-api-token.mjs   # full-access токен → client/.env.local (STRAPI_API_TOKEN); идемпотентно
node scripts/seed.mjs               # весь демо-контент (Strapi должен работать); повторный запуск не дублирует
```
- Seed: upsert по slug / key / name, single types — PUT, медиа переиспользуются по имени (`gz-*`).
- Логотип и favicon — статикой в `client/public` (в CMS не редактируются; к тому же Strapi 5.52 запрещает SVG-upload).
- Тексты HP — дословно из макета; остальное (даты, контакты, GDPR) — черновики для заказчика. Компоненты: shared/*, nav/*, home/*,
form/* (динамические поля форм как в BSF), blocks/* (dynamic zone страниц).

## Client (`client/`)
```bash
cd client
npm run dev         # http://localhost:3000
```
- Next **15.5** App Router + React 19 + TS + Tailwind **4** (create-next-app поставил
  Next 16 — принудительно снижен до 15 по утверждённому стеку).
- `.env.local`: `STRAPI_URL=http://127.0.0.1:1337`.
- `ADMIN_USER` / `ADMIN_PASS` — přihlášení do `/sprava/prihlasky` (Basic Auth). Bez nich je správa zavřená (503).
  `STRAPI_ADMIN_URL` (volitelné) — veřejná adresa Strapi pro odkazy „Otevřít ve Strapi“ (jinak `STRAPI_URL`).
- `NEXT_PUBLIC_SITE_URL` (volitelné) — veřejná adresa webu pro canonical, sitemap a JSON-LD; výchozí `https://gastrozony.cz`.
- `NEXT_PUBLIC_GA_ID` (volitelné) — GA4 Measurement ID `G-…`. Prázdné / chybí → analytika se nenačte ani po souhlasu.
  Pro test lišty stačí libovolné `G-TEST…` (next dev změnu `.env.local` načte sám); nezapomeňte ho pak odebrat.
- Шрифт: Plus Jakarta Sans 400/800 через `next/font` (latin + latin-ext).
- Дизайн-токены: `src/app/globals.css` (`@theme`) — значения из `design/tokens.md`.
- Всё, что тянет Strapi (Header/Footer/Newsletter), имеет чешские фолбэки из макета —
  сайт работает и без поднятой CMS.

### Ключевые файлы
| Файл | Что |
|---|---|
| `src/lib/strapi.ts` | REST-клиент Strapi 5 (server-only, ISR revalidate) |
| `src/lib/flecks.tsx` | `renderFlecks()` — `**text**` → жёлтая SVG-клякса из XD + blur (`.fleck` в globals.css) |
| `src/lib/homepage.ts` | `getHomepage()` + чешский фолбэк, `paragraphs()` (абзацы через пустую строку) |
| `src/lib/events.ts` | `getEvents()`, `getUpcomingEvents()`, `getEventBySlug()`, `groupByStatus()`, `resolveEventStatus()` (даты по Europe/Prague), `formatEventDate()`, `getEventsPage()` |
| `src/lib/seo.ts` | `seoMetadata(seo, fallback)` — Metadata из `shared.seo` |
| `src/components/RichText.tsx` | markdown из Strapi (react-markdown, без сырого HTML) в стиле сайта |
| `src/components/PageIntro.tsx` | H1 с флеками + перекс для подстраниц |
| `src/components/GreyClosingSection.tsx` | последняя серая секция с волной, фон протянут под волну newsletter |
| `src/components/EventGrid.tsx` / `EventTabs.tsx` / `EventGallery.tsx` | сетка карточек · табы /akce (hash) · галерея + lightbox |
| `src/app/akce/page.tsx`, `src/app/akce/[slug]/page.tsx` | výpis a detail akce (ISR 60) |
| `src/lib/form-schema.ts` | типы полей формы + zod-схема из `form.fields` (одна для браузера и сервера), `toFormData` / `valuesFromFormData` |
| `src/lib/forms.ts` | `getForm()`, `getApplicationPage()`, `getTeamRecipients()` (server) |
| `src/lib/files.ts` · `src/lib/rate-limit.ts` | тип файла по magic bytes · in-memory rate-limit + `clientIp()` |
| `src/app/api/application/route.ts` | přihláška (multipart): rate-limit → honeypot → zod → файлы → Strapi → mail → `mailSent` |
| `src/components/form/DynamicForm.tsx` + `FormFields.tsx` | динамическая форма (RHF + zod), поля, чипы, upload |
| `src/app/prihlaska/page.tsx` | `/prihlaska`, `?akce=slug` предвыбирает акцию |
| `src/lib/pages.ts` | `getPage()`, `getPageSlugs()`, `getContactPage()` + типы блоков, populate зоны через `on` |
| `src/components/blocks/Blocks.tsx` | dynamic zone → секции (группировка по фону, волны, заход под newsletter) |
| `src/components/blocks/BlockComponents.tsx` | text, gallery, cta, cards, tags, logos, stats, image-text, events, accordion |
| `src/app/[slug]/page.tsx`, `src/app/kontakt/page.tsx` | obecná šablona (ISR 60) · kontakt (tým `TeamList`, mapa, bloky) |
| `src/lib/articles.ts` | `getArticles(page)` (по 9), `getArticleBySlug()`, `getOtherArticles()`, `getBlogPage()`, `articleDate()` |
| `src/components/ArticleCard.tsx` · `Pagination.tsx` · `BackLink.tsx` | карточка/сетка статей · стránkování · ссылка «← zpět» |
| `src/app/novinky/page.tsx`, `src/app/novinky/[slug]/page.tsx` | výpis (`?strana=N`) · detail článku (ISR 60) |
| `strapi/src/api/article/content-types/article/lifecycles.ts` | пустой `date` статьи → сегодня (иначе ломается сортировка) |
| `src/components/CookieConsent.tsx` · `CookieSettingsButton.tsx` | cookie-лишта + настройки · кнопка «Nastavení cookies» в футере |
| `src/lib/consent.ts` · `src/lib/analytics.ts` · `src/lib/cookie-texts.ts` | cookie `gz_consent` · GA4 Consent Mode v2 (gtag.js только после согласия) · тексты из `cookie-consent` |
| `src/app/(site)/layout.tsx` | раскладка публичного сайта (все публичные страницы лежат в `(site)/`) |
| `src/middleware.ts` | Basic Auth на `/sprava/*` + блокировка перебора (10 ошибок / 15 мин → 429) |
| `src/app/sprava/prihlasky/page.tsx` · `…/export/route.ts` | таблица přihlášek (filtr, po 50) · CSV pro Excel |
| `src/lib/applications.ts` · `src/lib/csv.ts` | přihlášky ze Strapi (bez cache), sloupce z formuláře · CSV (BOM, `;`, ochrana vzorců) |
| `src/app/sitemap.ts` · `src/app/robots.ts` | sitemap.xml (sekce + akce/články/stránky ze Strapi) · robots.txt |
| `src/lib/seo.ts` · `src/lib/global.ts` · `src/components/JsonLd.tsx` | metadata (async, fallback na `global.defaultSeo`) · JSON-LD Organization/Event, texty 404 · `<script type=ld+json>` |
| `src/app/(site)/not-found.tsx`, `src/app/not-found.tsx` | 404 ve stylu webu (`NotFoundContent`) |
| `scripts/gen-icons.mjs` | favicon / apple-icon / icon-512 / og-default ze statického loga |
| `src/lib/mailer.ts` | стаб Resend (`sendApplicationMail`) |
| `src/app/api/newsletter/route.ts` | подписка: zod + honeypot → Strapi; Ecomail-стаб |
| `src/components/SectionEdge.tsx` | волнистые кромки секций — точные кривые XD в координатах артборда 1920 |
| `src/components/Button.tsx` | primary / outline / dark (чёрная с жёлтым текстом), 66px, прямые углы |
| `src/components/Badge.tsx` | бейдж статуса акции (37px, r 19) |
| `src/components/Card.tsx` | NumberDot (01/02/03), Stat, Tag |
| `src/components/EventCard.tsx` | карточка акции 427 (HP, /akce) |
| `src/components/home/*` | секции HP: Hero + HeroFood (еда/пятна по матрицам XD), Intro, Clients, Events |
| `src/components/Header.tsx` + `HeaderNav.tsx` | шапка (server fetch + client burger) |
| `src/components/Footer.tsx` | патичка (колонки из navigation, контакты из global) |
| `src/components/Newsletter.tsx` + `NewsletterForm.tsx` | блок над футером |

### Картинки и ImageKit
- Медиа Strapi рендерятся через `src/components/CmsImage.tsx` (обёртка `next/image`): URL ImageKit →
  loader `?tr=w-…,q-…` (ресайз и AVIF/WebP в CDN ImageKit), иначе — встроенный оптимизатор Next.
  Статика (`public/logo.svg`, `public/food/*`) — обычный `next/image`.
- Strapi: официальный `strapi-plugin-imagekit` 1.0.2 (`config/plugins.ts`), CSP в `config/middlewares.ts`.
  **Плагин включается только если задан `IMAGEKIT_PRIVATE_KEY`** — при первом запуске он копирует config в БД
  (`strapi_core_store_settings`, `plugin_imagekit_config`) и дальше берёт значения из админки
  (Settings → ImageKit Plugin). Запуск без ключей «запёк» бы пустые значения.
- `useTransformUrls: false` — `url` файла остаётся «чистым», размер добавляет CmsImage.
- **Патч плагина** (`strapi/patches/strapi-plugin-imagekit+1.0.2.patch`, применяется `postinstall: patch-package`):
  плагин собирает папку через `path.join` → на Windows `\gastrozony\` → ImageKit отвечает
  «invalid value for folder parameter». Патч меняет на `path.posix.join`; на Linux ничего не меняет.
  Версия плагина закреплена ровно `1.0.2` — при обновлении проверить, нужен ли патч.
- Файлы ложатся в `/gastrozony/1/…` (`1` — системная папка Strapi «API Uploads»).
- Поле `provider` у файла остаётся `local` даже в ImageKit (Strapi его перезаписывает) — признак ImageKit это `url`.
- Включено 2026-09-11 (аккаунт `ev2rmbc0ca`), seed-медиа перезалиты.
- **Включение (когда будут ключи):**
  1. `strapi/.env`: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` (+ `IMAGEKIT_UPLOAD_FOLDER`).
  2. `client/.env.local`: `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` (тот же endpoint), перезапустить `next dev`.
  3. Перезапустить Strapi (`npm run develop` — пересоберёт админку с плагином).
  4. `node scripts/seed.mjs --reupload-local` — удалит локальные seed-медиа (provider=local) и зальёт их в ImageKit.
     Иначе плагин перепишет старые `/uploads/...` на `ik.imagekit.io/<id>/uploads/...`, а до localhost ImageKit не достучится.

### E-maily (Resend) и newsletter (Ecomail) — шаг 12

**Код:** `client/src/lib/mailer.ts` (Resend REST, без SDK), `client/src/lib/mail-template.ts` (HTML+text шаблон),
`client/src/lib/ecomail.ts` (Ecomail API v2). Вызовы — только из `app/api/application/route.ts`
и `app/api/newsletter/route.ts`, ключи читаются на сервере и в бандл не попадают.

**Переменные (`client/.env.local`, образец — `client/.env.example`):**

| Переменная | Зачем |
|---|---|
| `RESEND_API_KEY` | ключ Resend; без него письма не отправляются |
| `MAIL_FROM` | отправитель, домен должен быть верифицирован в Resend (по умолчанию `Gastrozóny <info@gastrozony.cz>`) |
| `MAIL_REPLY_TO` | необязательно; пусто → e-mail из `global` |
| `ECOMAIL_API_KEY` | ключ Ecomail; без него подписчик остаётся только в Strapi |
| `ECOMAIL_LIST_ID`, `ECOMAIL_TAGS` | фолбэк, если поля в админке (Newsletter) пустые |

**Без ключей всё работает и ничего не врёт:** заявка сохраняется, `mailSent` остаётся `false`,
подписчик сохраняется с `syncedToEcomail=false`, в лог идёт строка `[mailer] RESEND_API_KEY není nastavený…` /
`[ecomail] … není nastavené…`. Поэтому e2e шага 5 и newsletter проходят и на машине без ключей.

**Что настраивается в админке, а не в коде:** тексты письма — `application-page.mailSubject / mailIntro / mailNote`;
получатели копий — `global.applicationRecipients`; Ecomail — `newsletter.ecomailListId / ecomailTags / doubleOptIn`.
`ecomailListId`/`ecomailTags` намеренно **не** `private`: приватные поля Strapi не отдаёт даже по серверному токену,
и админ не смог бы их менять. ID списка без ключа бесполезен, API-ключ остаётся только в env.

**Проверка шаблона письма:** временный роут `api/dev-mail-preview` (создавался на время шага 12 и удалён) —
отрисовывал оба письма в браузере. При правках `mail-template.ts` поднять такой роут заново
(`renderMail(...)` → `new Response(html, {headers:{'Content-Type':'text/html; charset=utf-8'}})`)
и не забыть удалить: папки на `_` в App Router не маршрутизируются (`api/_mail-preview` даёт 404).

**Что уже проверено (12.09.2026):** без ключей — заявка + подписка сохраняются, флаги `false`, лог честный;
с заведомо неверными ключами — реальные запросы уходят, Resend отвечает 401 `API key is invalid`,
Ecomail 401 `Wrong api key`, пользователь всё равно получает `{ok:true}`, ошибка только в логе.
**Реальная отправка не проверена — нужны ключи заказчика.**

**Двойное подтверждение (double opt-in):** `newsletter.doubleOptIn` (по умолчанию включено) → в Ecomail
уходит `skip_confirmation: false`, письмо-подтверждение шлёт сам Ecomail. Выключение = моментальная подписка.

### Вёрстка HP (шаг 3)
- Эталон — окно **1920** (контент 1905 из-за полосы прокрутки): вертикаль совпадает с XD ±1px.
  Замеры: `design/specs/hp-spec.md` + baseline-смещения шрифта (77/88 → 75, 61/70 → 59, 41/47 → 40, 29/33 → 28, 23/33 → 26, 18/33 → 24).
- Высота волн — в `vw` (как артборд), поэтому в окне шире/уже 1920 всё, что ниже волны, сдвигается пропорционально.
- Еда hero — статикой `public/food/*.png`, **прозрачные поля обрезаны** (sharp `trim`), иначе при `object-contain`
  еда мельче макета. Если заменяете PNG — обрежьте так же и удалите `client/.next/cache/images`.
