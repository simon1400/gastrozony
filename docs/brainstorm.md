# Gastrozony — брейнсторм архитектуры

Дата: 2026-09-04

## 0. Принятые решения (2026-09-04)

| Вопрос | Решение |
|---|---|
| **Стек клиента** | **Next 15 App Router + React 19 + Tailwind 4** (не house-style MUI/Apollo) |
| **CMS** | **Strapi 5** (Document API, без `attributes`-обёртки) |
| **Языки** | **только `cs`** — i18n-плагин не включаем |
| **Формы** | 2 потока на одном движке: `/prihlaska` (prodejce, с выбором акции) + `/pro-poradatele` (pořadatel, лид на гастрозону). Подтвердить у Dana. |
| **Домен** | `https://gastrozony.cz/` |
| **Хостинг** | тот же сервер, что BSF; pm2 + nginx |
| **БД** | **PostgreSQL** на своём сервере (не sqlite) |
| **Resend** | откладываем на конец, будет отдельный аккаунт на домен gastrozony.cz |
| **Ecomail** | откладываем на конец |
| **XD** | доступ есть, ассеты выгружает заказчик — чек-лист в `docs/assets-checklist.md` |

Следствия:
- API к Strapi — **REST через типизированный `lib/strapi.ts`**, не Apollo/GraphQL
  (в Strapi 5 REST + `populate` проще и не тянет Apollo в бандл; RSC делает fetch на сервере)
- Плагины Strapi 4 из BSF (`@_sh/strapi-plugin-ckeditor`, `strapi-plugin-sitemap`,
  `strapi-plugin-local-image-sharp`) **несовместимы** — нужны v5-аналоги или замена:
  ckeditor → встроенный Blocks-редактор Strapi 5 либо v5-версия плагина;
  sitemap → генерировать в Next (`app/sitemap.ts`);
  image-sharp → встроенный upload-провайдер + `next/image`
- Схемы content-types из BSF копируем как **образец модели**, но переписываем под v5
- Формы: `form` становится **collection type** с полем `key` (`prodejce` / `poradatel`),
  `application` получает `formKey` + опциональную relation `event`

---

## 1. Карта сайта

| URL | Тип | Источник данных |
|---|---|---|
| `/` | Homepage | single type `homepage` |
| `/akce` | Přehled akcí | collection `event` |
| `/akce/[slug]` | Detail akce | collection `event` |
| `/prihlaska` | Přihláška (форма) | single `application-page` + single `form` + `event` |
| `/kontakt` | Kontakt | single `contact-page` ИЛИ обычная `page` |
| `/[slug]` | Obecná šablona | collection `page` (dynamic zone) |
| `/dekujeme` | После отправки | статика |
| `/api/registration` | Resend: клиенту + копия команде | server-only |
| `/api/newsletter` | Ecomail subscribe | server-only |

**Внимание — расхождение:** в письме сказано «Přihláška **pro pořadatele**», но в макете
в шапке одновременно «Pro prodejce», «Pro pořadatele» и жёлтая кнопка «Přihláška»,
а текст на HP гласит «Hledáme **prodejce** jídla a nápojů… Vyber si akci, přihlas se».
→ Похоже, что заявку подают **продавцы** (food trucky), а «Pro pořadatele» — это
информационная страница для организаторов мероприятий (лиды на кейтеринг).
Нужно подтвердить: **одна форма или две** (см. вопрос Q3).

---

## 2. Контент-модель Strapi (черновик)

### Single types

| Тип | Поля |
|---|---|
| `global` | phone, email (logo/favicon — статикой в `client/public`, не в CMS), соцсети (repeatable `social`), IČO/адрес, default SEO, список получателей заявок |
| `navigation` | `header[]` (nav-item + children), `footer[]` (колонки: title + links[]), CTA-кнопка шапки |
| `homepage` | hero (title, perex, cta1, cta2, images[]), stats[] (value, label), intro-блок (title, text1, text2), cards[] (num, title, text), tags[] («Stavíme pro»), clients-блок (title, text, cta, logos[]), events-блок (title, text, limit), seo |
| `newsletter` | title, text, placeholder, buttonLabel, consentText, ecomailListId, tags[] |
| `application-page` | title, perex, contentBefore, contentAfter, successText, seo |
| `form` | dynamic zone `fields[]` — **как в BSF**, поля настраиваются в админке |
| `contact-page` | title, perex, phone, email, text, team[] → relation `team-member`, map |

### Collection types

| Тип | Поля |
|---|---|
| `event` | title, slug, perex, content (rich), place, dateFrom, dateTo, cover, gallery[], status (enum: `pripravujeme` / `aktualni` / `ukonceno` — либо авто по датам), applicationOpen (bool), capacityState (volno / zbývá 1 místo / obsazeno / náhradník), googleMapsUrl, seo |
| `page` | title, slug, perex, cta, **dynamic zone** blocks[], seo |
| `application` | `result[]` (key/value как в BSF) + relation `event` + createdAt + status (nová / kontaktována / schválena / zamítnuta) |
| `team-member` | name, position, photo, phone, email, order |
| `client-logo` | name, logo, url, order |

### Dynamic zone для `page` (obecná šablona)

`blocks.text` (rich) · `blocks.gallery` · `blocks.cta` · `blocks.cards` (01/02/03) ·
`blocks.tags` · `blocks.logos` · `blocks.stats` · `blocks.image-text` (2 колонки) ·
`blocks.events` (выборка акций) · `blocks.accordion` (FAQ / «Jak to funguje»)

### Žluté fleky (жёлтые пятна за текстом)

Заказчик просит: в админке пишем `**текст**` → на фронте это оборачивается в
`<span class="fleck">текст</span>` с жёлтым размытым фоном.
→ Утилита `renderFlecks(str)` на фронте, применяется ко всем заголовкам.
Реализация: split по `**`, чётные индексы — обычный текст, нечётные — `<span>`.
CSS: жёлтый радиальный градиент с `filter: blur()` под текстом (z-index -1),
как на макете — пятно шире и «рванее» текста.

---

## 3. Логика статусов акций

Макет показывает бейдж «Aktuální» / «Připravujeme»; письмо просит «již ukončeno
třeba černobíle pod nadpisem».

Предлагаю: **статус вычисляется автоматически из дат**, поле в админке только как override.

```
dateTo   <  today             → ukonceno     (карточка ч/б, grayscale, внизу списка)
dateFrom <= today <= dateTo   → aktualni     (жёлтый бейдж)
dateFrom >  today             → pripravujeme (белый бейдж)
```

На `/akce`: сначала актуальные + готовящиеся (сортировка по dateFrom ASC),
затем секция «Ukončené akce» — grayscale, свёрнутая или с меньшими карточками.

---

## 4. Форма přihlášky — что делаем лучше, чем в BSF

Переиспользуем **модель** (динамические поля из админки + `result[]` key/value),
но переписываем реализацию:

- **react-hook-form + zod/yup** вместо ручного стейта и `.length`-валидации
- реальная валидация email / телефона / обязательности
- **ключи только на сервере** — Resend и Ecomail вызываются из API routes,
  никакого `RESEND_API_KEY` в `next.config.js → env` (в BSF он утекает в клиентский бандл)
- **honeypot + rate-limit** против спама
- запись в Strapi и отправка письма — с обработкой ошибок, а не fire-and-forget
- выбор акции: селект/чипы из `event` где `applicationOpen = true`
  (в BSF — мультивыбор фестивалей; для Gastrozony уточнить: одна акция или несколько)
- загрузка файлов (фото stánku / menu) — опционально, через Strapi `/api/upload`

Письма (Resend):

1. **клиенту** — подтверждение с копией того, что он отправил
2. **команде** — копия заявки (список получателей — из `global` в админке, не в коде)

---

## 5. Newsletter (Ecomail)

Компонент всегда над футером (`<Newsletter />` в layout).
`POST /api/newsletter` → `https://api2.ecomailapp.cz/lists/{LIST_ID}/subscribe`
(рабочий пример: `D:\bombastica-ecomail\src\index.ts`).
Нужно решить: `skip_confirmation: true` (сразу в списке) или double opt-in.
Чекбокс GDPR — обязательный, текст из админки.

---

## 6. Дизайн-система (из макета)

- **Цвета:** жёлтый `#FFD400`-ish (акцент / CTA / пятна), чёрный `#111` (шапка, тёмные секции),
  белый, светло-серый `#EDEDED` (секции). Точные значения — снять из XD.
- **Шрифт:** геометрический гротеск (похоже на Poppins / Sofia Pro / Greycliff).
  → нужен точный шрифт и лицензия из XD.
- **Волнистые границы секций** — SVG-разделители сверху/снизу каждой цветной секции,
  4 варианта (белый→серый, серый→белый, белый→чёрный, чёрный→жёлтый).
  Делаем как переиспользуемый компонент `<WaveDivider from to />`.
- **Карточки:** белые, прямые углы, тонкая тень.
- **Кнопки:** прямоугольные, жёлтая заливка / белая с чёрной обводкой.
- **Бейджи статуса:** пилюли — жёлтая (Aktuální) / белая (Připravujeme) / серая (Ukončeno).
- **Декор:** вырезанные PNG бургеров / пицц / фри на размытых жёлтых пятнах.
  Nice-to-have — параллакс / float-анимация при скролле.

---

## 7. Инфраструктура

- Папка проекта: `D:\gastrozony` → `client/` + `strapi/` (как в BSF / craftwork)
- Деплой: pm2 + nginx на том же сервере, что BSF (`ecosystem.config.js`), порты — уточнить
- БД Strapi: sqlite (как BSF) или postgres — уточнить
- Медиа: локальный upload + `strapi-plugin-local-image-sharp`
- SEO: `strapi-plugin-sitemap`, `seo.meta` component, OG-изображения
- Аналитика + cookie consent — уточнить (GA4? Seznam? Cookiebot?)

---

## 8. Порядок работ (предложение)

1. Скаффолд Strapi + контент-модель + сиды демо-контента
2. Скаффолд client + layout (Header / Footer / Newsletter / WaveDivider / Button / Card)
3. Homepage по макету (desktop → responsive → hover-состояния)
4. `/akce` + `/akce/[slug]`
5. Форма přihlášky + Resend + запись в Strapi
6. Ecomail newsletter
7. Obecná šablona `/[slug]` + dynamic zone
8. Kontakt + tým
9. SEO / sitemap / OG / 404
10. Nice-to-have: анимации бургеров / пицц
11. Деплой + PM2 + nginx

---

## 9. Открытые вопросы

**Закрыты 2026-09-04:** ~~Q1~~ Next 15 App Router + Tailwind · ~~Q2~~ Strapi 5 ·
~~Q4~~ только cs · ~~Q5~~ REST · ~~Q9~~ Resend в конце, отдельный аккаунт на gastrozony.cz ·
~~Q10~~ Ecomail в конце · ~~Q12~~ домен `gastrozony.cz`, сервер BSF · ~~Q13~~ PostgreSQL ·
~~Q14~~ доступ к XD есть.

**Закрыты 2026-09-11 (ответы заказчика через Дениса):**

- ~~Q3~~ **Как в BSF** — одна форма přihlášky для *prodejců* (`/prihlaska`) с выбором акции.
  `Pro pořadatele` в меню — обычная страница (`page`, obecná šablona) с CTA «Kontaktujte nás».
  Отдельной лид-формы для организаторов нет. В модели `form.key` остаётся (enum), используется только `prodejce`.
- ~~Q6~~ **Поля формы конфигурируются в админке** (dynamic zone `form.fields`), как в BSF. Код фронта поля не знает.
- ~~Q7~~ **Одна акция** на заявку → relation `application.event` manyToOne (не oneToMany). Select показывает только акции с `applicationOpen=true` и датой в будущем; предвыбор через `/prihlaska?akce=slug`.
- ~~Q8~~ **Загрузка файлов — да** (в BSF есть): компонент `form.upload`, файлы идут через Next API route → Strapi `/api/upload` с серверным токеном (публичного upload-права нет), лимиты: image/*, pdf, ≤10 MB, до 3 файлов. Ссылки кладутся в `application.attachments`.
- ~~Q15~~ **Blog / novinky — да.** Дизайна нет → делаем в стиле карточек акций. Модель: `article` (title, slug, perex, cover, content, seo) + single `blog-page`. Роуты `/novinky`, `/novinky/[slug]`.
- ~~Q16~~ **Cookie consent + GA4 + GDPR — да, делаем сами.** Cookie-бар (nutné / analytické), GA4 через Consent Mode v2 только после согласия, страницы `/ochrana-osobnich-udaju` и `/cookies` как `page`.

- ~~Q11~~ **Отдельная страница заявок — да, как в BSF** (ответ 2026-09-11). В BSF это `/table-aplications`
  без пароля. У нас: `/sprava/prihlasky` в Next (server component) **под Basic Auth** (middleware,
  `ADMIN_USER`/`ADMIN_PASS` в env), таблица всех заявок, фильтр по акции и статусу, кнопка экспорта CSV
  (UTF-8 BOM для Excel). Данные тянутся из Strapi серверным токеном. Админка Strapi остаётся для редактирования статусов.

## 10. Заметки по отложенным интеграциям

Resend и Ecomail подключаем в конце, но **абстракции закладываем сразу**:
- `lib/mailer.ts` — интерфейс `sendApplicationMail()`; пока пишет в консоль/лог,
  в конце подменяется на Resend
- `app/api/newsletter/route.ts` — принимает email + согласие, валидирует, пока
  складывает в Strapi collection `newsletter-subscriber`; в конце добавляется
  вызов Ecomail (готовый пример: `D:\bombastica-ecomail\src\index.ts`)

Так фронт и формы можно доделать и протестировать целиком, не дожидаясь ключей.
