# Промпт для следующей сессии — Gastrozony, реализация пошагово

> Скопировать текст ниже в начало новой сессии Claude Code в `D:\gastrozony`.
> Сессия ведёт работу шаг за шагом; после каждого шага — отметка в `.claude/memory/MEMORY.md`.

---

Продолжаем реализацию сайта **Gastrozony** (Next 15 App Router + Tailwind 4 / Strapi 5 + PostgreSQL, только чешский).
**Статус: шаги 1–13 выполнены (2026-09-12). Сайт живёт на тестовых доменах https://gastrozony.hardart.cz и https://strapi-gastrozony.hardart.cz, автодеплой через GitHub Actions работает. Следующая сессия — правки по итогам тестирования пользователем (он приносит список) и оставшиеся пункты перед боевым запуском, см. «Осталось» ниже. Публичные страницы — в `src/app/(site)/`. `RichText` / `RichInline`, `PageIntro`, `GreyClosingSection`, `Blocks` / `SectionGroups`, `EventGrid` / `ArticleGrid`, `Pagination`, `lib/seo.ts`, `DynamicForm` уже есть — переиспользовать.**
**ImageKit включён** (2026-09-11): медиа Strapi хранятся в ImageKit, на фронте картинки из CMS — только через `CmsImage`
(см. `docs/dev.md` «Картинки и ImageKit»). Новые медиа в seed/компонентах — тоже через `CmsImage`.
Работаем **строго внутри `D:\gastrozony`**. Общение по-русски, весь контент/UI-строки/названия сущностей — по-чешски.

## 0. Перед началом — прочитать (обязательно, в этом порядке)
1. `.claude/memory/MEMORY.md` — статус, решения заказчика, факты о макете
2. `design/specs/hp-spec.md` — **точная спецификация HP по секциям** (координаты, размеры, шрифты из XD)
3. `design/tokens.md` — цвета, типографика, компоненты, сетка
4. `docs/brainstorm.md` §0, §2, §3, §4, §9 — архитектура, модель, статусы акций, форма, решения
5. `docs/dev.md` — как поднять Strapi и client локально
6. `.claude/memory/reference-burger.md` — что берём из BSF (`D:\burger`) и что там НЕ повторять
7. Посмотреть скриншоты `design/screens/hp-1..4-*.png` и `hp-full-0.5x.png`

Затем поднять оба сервера (`strapi: npm run develop`, `client: npm run dev`) и убедиться, что всё стартует
(если порты 1337/3000 заняты — серверы уже запущены, не дублировать).
Админ Strapi уже создан пользователем; `STRAPI_API_TOKEN` уже в `client/.env.local`; seed-контент в БД
(при необходимости: `node scripts/seed.mjs` — идемпотентен).

## Принятые решения (не обсуждать заново)
- **Одна форма** `/prihlaska` для prodejců (как BSF), поля настраиваются в админке (dynamic zone `form.fields`),
  **одна акция на заявку**, **загрузка файлов есть**. `Pro pořadatele` / `Pro prodejce` / `Info` — обычные страницы (`page`).
- **Blog (`/novinky`)** — делаем, дизайн сами в стиле карточек акций.
- **Cookie consent + GA4 Consent Mode v2 + страницы GDPR/cookies** — делаем сами.
- **Футер** в макете отсутствует — проектируем сами (тёмный, лого, колонки из `navigation.footer`, контакты из `global`).
- **Мобильной версии в макете нет** — адаптив делаем сами, брейкпоинты 1440 / 1024 / 768 / 400.
- Resend + Ecomail — **в самом конце** (шаг 12), до этого стабы.
- **Логотип и favicon — только статика** в `client/public` (`logo.svg`), через Strapi не редактируются.
- **Отдельная страница заявок — да, как в BSF**: `/sprava/prihlasky` под Basic Auth + CSV (шаг 9).

## Правила кода
- Именованные экспорты; TypeScript strict; без `any` и `@ts-ignore`.
- Все пользовательские строки — из Strapi (с чешским фолбэком в коде), не хардкод в JSX.
- Секреты (`STRAPI_API_TOKEN`, `RESEND_API_KEY`, `ECOMAIL_API_KEY`) — только в API routes / server components, никогда в `NEXT_PUBLIC_*`.
- Контент-модель править **в `scripts/gen-strapi-model.mjs`**, потом `node scripts/gen-strapi-model.mjs` и перезапуск Strapi.
- Вёрстка HP — **по `design/specs/hp-spec.md`**, а не «на глаз»: сетка 1440 / 3×427 gap 80 / header 102 / кнопки 66 / бейджи 37.
- Проверять вёрстку через Playwright MCP: скриншот `http://localhost:3000` при ширине 1920 и сравнение с `design/screens/hp-full-0.5x.png`; плюс 1024 и 400.
- После каждого шага: обновить `MEMORY.md` (статус + новые факты), при необходимости `docs/dev.md`.
- Ничего не коммитить/не деплоить без явной просьбы.

## План — выполнять по порядку, каждый шаг до критерия «готово»

### ✅ Шаг 1. Правки контент-модели — ГОТОВО (2026-09-11)
- `application.event` manyToOne; `form.multipleEvents` убран; `article` (title, slug, date, perex, cover, content richtext, seo)
  + single `blog-page` (title, perex, seo); public find/findOne в bootstrap.
- Попутно: `home.intro` = `title` + `text` (абзацы через пустую строку), `newsletter.emailLabel`,
  из `global` убраны `logo/logoLight/favicon`.

### ✅ Шаг 2. Seed-контент — ГОТОВО (2026-09-11)
- `scripts/create-api-token.mjs` (full-access токен `gastrozony-server` → `client/.env.local`),
  `scripts/seed.mjs` — идемпотентен (проверено). В БД: все single types, 3 акции (slug: `mint-market-food-festival`,
  `hip-hop-zije-2026-bratislava`, `hip-hop-zije-2026-kosice`), 4 client-logo, 2 team-member, 3 article,
  form `prodejce` (16 полей + consent), 5 page, 2 демо-заявки (`demo.*@example.com`, source=seed).
- Заголовки с флеками уже в формате `**…**`: hero `**Gastrozóny** pro každou **příležitost**`,
  intro `Dodáme **jídlo i nápoje** pro vaše akce`, clients `Jsme tu pro **náročné klienty**`, events `Aktuální **akce**`.
- Даты/места/контакты/GDPR в seed — черновики, заказчик поправит.

### ✅ Шаг 3. Homepage — пиксельно по макету — ГОТОВО (2026-09-11)
> Итог: 1920 = XD (вертикаль ±1px, x ±3px), 1024/400 без горизонтального скролла, Lighthouse a11y 96.
> Детали и подводные камни — `MEMORY.md` «Факты сессии (шаг 3)» и `docs/dev.md` «Вёрстка HP».
> Открыто для заказчика: контраст жёлтых чисел статистики на белом (цвет макета).
Секции по `hp-spec.md`: Header (102) → Hero (H1 77/88, perex 544, 2 кнопки, статы с чертой 4×80, еда PNG + жёлтые blur-пятна)
→ серая секция с волнами (H2 61/70 + 2 абзаца справа, карты 01/02/03 427×246 с кругом-номером 53 наполовину над картой, «Stavíme pro:» + теги 66h)
→ белая секция клиентов (H2, текст 680, кнопка, 4 логотипа + «a další…» с круглым флеком)
→ тёмная секция «Aktuální akce» (H2 белый, карточки 427×600: обложка 427×321, бейдж 37 r=19 наполовину над обложкой, заголовок 23/33, перекс w=340; кнопка «Všechny akce»)
→ newsletter (жёлтый, белая карта 680×243: label, input 460×66 r=4, кнопка чёрная с жёлтым текстом 142×66, чекбокс 26 + consent 14px; бургер 582 выходит за край)
→ Footer (свой дизайн).
- Еда hero — статикой в `client/public/food/` (`burger-big` = burger-2025 380, `burger-small` 233, `pizza-big` 401,
  `pizza-small` 200, `hranolky` 272×363) — оптимизировать через `next/image` (исходники тяжёлые, до 4 MB).
  Пятна за едой — `design/assets/Path 12/13/14/16/24/25.svg` + blur.
- `homepage.intro.text` → разбить по `\n\n` на абзацы; newsletter label — из `newsletter.emailLabel`.
- Fleky: SVG-клякса + `filter: blur(21px)` под выделенными словами (`renderFlecks`, синтаксис `**слово**` уже есть).
- Волны: `WaveDivider` (уже есть) — цвета #EBEBEB / #0E0E0E / #FFD100.
- Все данные из `homepage`, `event` (3 ближайшие: aktuální → připravujeme, сортировка по дате), `client-logo`, `newsletter`.
- Адаптив: 1024 — 2 колонки, еда уменьшается; 768/400 — 1 колонка, H1 ~40px, header с бургер-меню (`HeaderNav` уже есть — доработать).
- **Готово:** Playwright-скриншот 1920 совпадает с `hp-full-0.5x.png` по расположению/размерам (допуск ±4px), 400 без горизонтального скролла, Lighthouse a11y ≥ 90.

### ✅ Шаг 4. Акции: `/akce` и `/akce/[slug]` — ГОТОВО (2026-09-11)
> Итог: single `events-page` (тексты страницы), табы с hash, деталь с мета/markdown/галереей (lightbox на `<dialog>`),
> CTA только при `applicationOpen` и не ukončeno; 404 для чужого slug; 1920/1024/400 без горизонтального скролла.
> `/prihlaska?akce=slug` пока 404 — появится в шаге 5 (предвыбор акции из `?akce=`).
- `/akce`: заголовок + перекс, табы «Aktuální / Připravujeme / Proběhlé», сетка карточек как на HP; статус вычисляется по датам (`docs/brainstorm.md §3`), `statusOverride` имеет приоритет.
- `/akce/[slug]`: hero с обложкой + бейдж, дата/место/Google Maps, `content`, галерея (лёгкий lightbox, без MUI), `capacityState`, CTA «Přihlásit se na tuto akci» → `/prihlaska?akce=slug` (только если `applicationOpen`).
- `generateMetadata` из `seo`, `generateStaticParams` + ISR (revalidate 60).
- **Готово:** обе страницы рендерятся с seed-данными, 404 для несуществующего slug.

### ✅ Шаг 5. Движок форм + `/prihlaska` — ГОТОВО (2026-09-11)
> Итог: e2e пройден (422 / файл в Postgres + ImageKit / 429), success без reload. Отступление: файлы идут вместе
> с заявкой в `/api/application`, отдельного `/api/upload` нет. Детали — `MEMORY.md` «Факты сессии (шаг 5)».
- `components/form/DynamicForm.tsx`: рендер по `form.fields` (text-field / select / radio / checkbox / upload, `width` half/full), zod-схема генерируется из полей (required, email/tel/url по `inputType`, файлы: тип/размер), react-hook-form, тексты ошибок из `errorMessage`.
- Блок выбора акции: select только `applicationOpen && dateTo >= today`, предвыбор из `?akce=`.
- Upload: `POST /api/upload` (Next route) → проверка типа (image/*, pdf) и размера (≤10 MB, ≤3 файла) → Strapi `/api/upload` с `STRAPI_API_TOKEN` → вернуть id + url.
- Отправка: `POST /api/application` (Next route): zod, honeypot, rate-limit по IP (in-memory LRU), сохранение в Strapi `application` (`result[]`, `event`, `attachments`, `contactEmail/Name`) **через серверный токен** → затем `sendApplicationMail` (стаб) → `mailSent`.
- UI в стиле макета: инпуты 66h r=4, кнопки 66h; страница `application-page` (title, perex, contentBefore/After, successText). Success-состояние без перезагрузки.
- **Готово:** e2e: заполнить форму с файлом → запись в Postgres с attachments; невалидный email → ошибка; 10 отправок подряд → 429.

### ✅ Шаг 6. Obecná šablona `/[slug]` + `/kontakt` — ГОТОВО (2026-09-11)
> Итог: 10 блоков, группировка секций по фону, CTA как карточка; /kontakt с командой и картой (по embed-URL или адресу).
> Детали — `MEMORY.md` «Факты сессии (шаг 6)».
- `/[slug]`: рендер dynamic zone `blocks.*` (text, gallery, cta, cards, tags, client-logos, stats, image-text, events-list, accordion) — каждый блок отдельный компонент в стиле HP. Страницы: info, pro-prodejce, pro-poradatele, ochrana-osobnich-udaju, cookies.
- `/kontakt`: из `contact-page` — контакты, команда (`team-member`), карта (iframe Google Maps по URL), CTA.
- **Готово:** все seed-страницы открываются; неизвестный slug → 404; `generateMetadata` из seo.

### ✅ Шаг 7. Blog `/novinky`, `/novinky/[slug]` — ГОТОВО (2026-09-11)
> Итог: výpis po 9 (`?strana=N`, 2+ noindex), detail s «Další články», lifecycle doplňuje prázdné datum.
> Детали — `MEMORY.md` «Факты сессии (шаг 7)».
- Список карточек (стиль карточек акций: обложка 427×321, дата вместо бейджа, заголовок 23/33, перекс), пагинация по 9.
- Детальная: hero, дата, content, «Další články». Блок «Novinky» на HP по умолчанию не добавлять (макет его не содержит) — только если заказчик попросит.
- **Готово:** рендер с seed-статьями.

### ✅ Шаг 8. Cookie consent + GA4 + GDPR — ГОТОВО (2026-09-11)
> Итог: single `cookie-consent`, лишта + nastavení, GA4 базовый Consent Mode (gtag.js только после согласия),
> «Nastavení cookies» в футере. Детали — `MEMORY.md` «Факты сессии (шаг 8)».
- `CookieBar` (внизу, стиль макета: чёрный/жёлтый): «Nutné» всегда, «Analytické» — выбор; кнопки «Přijmout vše / Pouze nutné / Nastavení»; хранение в cookie `gz_consent` (12 мес).
- GA4 с **Consent Mode v2** (`analytics_storage` denied по умолчанию, update после согласия). ID из `NEXT_PUBLIC_GA_ID` (пусто → скрипт не грузить).
- Ссылки на `/ochrana-osobnich-udaju` и `/cookies` в футере и в cookie-баре; тексты страниц — черновики по-чешски в seed (заказчик поправит).
- Чекбокс согласия во всех формах (newsletter уже есть; в přihlášce — из `form.consent`).
- **Готово:** без согласия в Network нет запросов к google; после «Přijmout vše» — есть; выбор сохраняется между перезагрузками.

### ✅ Шаг 9. Страница заявок для заказчика (как в BSF, но под паролем) — ГОТОВО (2026-09-11)
> Итог: route groups `(site)` / `sprava`, Basic Auth + блокировка перебора в middleware, таблица с фильтром, CSV.
> Детали — `MEMORY.md` «Факты сессии (шаг 9)».
- `/sprava/prihlasky` — Next server component; доступ через Basic Auth в `middleware.ts` (`ADMIN_USER` / `ADMIN_PASS` в env, на префикс `/sprava`), `robots: noindex`.
- Данные: все `application` из Strapi серверным токеном (`populate=event,attachments`), сортировка по createdAt desc.
- Таблица: datum, jméno, e-mail, akce, status, + колонки из `result[]` (ключи берутся динамически из полей формы), ссылки на вложения; фильтр по акции и статусу (query-параметры), пагинация по 50.
- Кнопка «Exportovat CSV» → `GET /sprava/prihlasky/export?akce=&status=` (та же Basic Auth), UTF-8 BOM, `;` как разделитель (чешский Excel), имя файла `prihlasky_YYYY-MM-DD.csv`.
- Смена статуса — в админке Strapi (на странице только ссылка «Otevřít ve Strapi»).
- Стиль — чёрно-жёлтый в духе сайта, но без лишнего: таблица, фильтры, кнопка.
- **Готово:** без логина → 401; с логином видна таблица с seed-заявками; CSV открывается в Excel с чешскими символами и правильными колонками.

### ✅ Шаг 10. SEO и мелочи — ГОТОВО (2026-09-11)
> Итог: sitemap/robots, canonical + OG (fallback global.defaultSeo → og-default.png), `htmlLimitedBots` (metadata v head),
> ikony `scripts/gen-icons.mjs`, JSON-LD Organization/Event, 404. Детали — `MEMORY.md` «Факты сессии (шаг 10)».
- `app/sitemap.ts` (страницы, акции, статьи), `robots.ts`, `metadataBase`, OG-картинка по умолчанию (`global.defaultSeo`), favicon / apple-icon из логотипа (`design/assets`, статикой — `app/icon.*`, не через CMS), `lang="cs"`, JSON-LD Organization + Event на `/akce/[slug]`.
- 404-страница в стиле сайта.
- **Готово:** `/sitemap.xml` валиден, Lighthouse SEO ≥ 95.

### ✅ Шаг 11. Docs для заказчика — ГОТОВО (2026-09-11)
> Итог: `docs/admin-guide.md` (čeština, 14 kapitol) + приватная HTML-страница-артефакт для пересылки заказчику.
- `docs/admin-guide.md` по-чешски: jak přidat akci, článek, změnit pole formuláře, exportovat přihlášky, upravit texty HP.

### 🟡 Шаг 12. Resend + Ecomail — КОД ГОТОВ (2026-09-12), ждём ключи заказчика
> `lib/mailer.ts` (Resend REST), `lib/mail-template.ts` (HTML+text в стиле сайта), `lib/ecomail.ts`.
> Тексты письма — `application-page.mailSubject/mailIntro/mailNote`, Ecomail — `newsletter.ecomailListId/ecomailTags/doubleOptIn`.
> Проверено: без ключей заявка/подписка сохраняются с `mailSent=false` / `syncedToEcomail=false`;
> с неверными ключами оба API реально отвечают 401 и ошибка гасится в лог. `docs/admin-guide.md` обновлён.
> **Осталось (не проверить без заказчика):** реальная доставка писем.
- **Нужно от заказчика:** `RESEND_API_KEY` + домен gastrozony.cz с DKIM/SPF в Resend; `ECOMAIL_API_KEY` + `listId`.
  Double opt-in решать отдельно не нужно — переключатель `doubleOptIn` в админке, по умолчанию включён.
- После получения ключей: положить их в `client/.env.local` (dev) / прод-env, отправить тестовую заявку и подписку,
  убедиться, что письма дошли и `mailSent` / `syncedToEcomail` стали `true`.

### Шаг 13. Деплой
- Сервер BSF: pm2 (client порт **3011**, если свободен — проверить; strapi 1338), nginx для `gastrozony.cz` (+ `/admin` proxy на Strapi), Let's Encrypt, PostgreSQL прод-база, прод `.env`.
- **Убрать публичный `create` на application / newsletter-subscriber** из bootstrap — только серверный токен.
- Прод-токен Strapi — **custom** (только нужные права), а не full-access dev-токен; демо-заявки `demo.*@example.com` удалить.
- **ImageKit:** сгенерировать новый private key (текущий прошёл через чат), ключи в прод-`strapi/.env`
  (при первом запуске прод-БД плагин скопирует их в БД); `IMAGEKIT_UPLOAD_FOLDER` для прода; `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
  в прод-env клиента; `npm ci` в strapi применит патч плагина (`postinstall`). Бэкап uploads не нужен — файлы в ImageKit.
- Бэкап БД + uploads (cron).
- **Готово:** сайт на https://gastrozony.cz, форма и newsletter работают в проде, чек-лист в `docs/deploy.md`.

---

Начни с шага 0 (чтение + запуск серверов), затем коротко скажи, что видишь, и берись за список правок от пользователя.

## Осталось перед боевым запуском (после шага 13)
1. **Ключи заказчика:** `RESEND_API_KEY` (+ DKIM/SPF на gastrozony.cz в Resend) и `ECOMAIL_API_KEY` + номер списка →
   в `client/.env.local` на сервере, пересобрать клиент, проверить реальную отправку письма и подписки.
2. **Убрать публичный `create`** на `application` и `newsletter-subscriber` в `strapi/src/index.ts` (bootstrap) —
   писать должен только серверный токен.
3. **Прод-токен Strapi custom** (только нужные права) вместо перенесённого из dev full-access.
4. **Переезд на gastrozony.cz:** A-записи → 157.90.169.205, `certbot --nginx`, поменять `NEXT_PUBLIC_SITE_URL`
   и `STRAPI_ADMIN_URL`, **пересобрать клиент**, убрать `X-Robots-Tag: noindex` из nginx-конфига клиента.
   Подробности — `docs/deploy.md` «Домены». Не пропускай критерии «готово».
