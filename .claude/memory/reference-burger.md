# Референс: BSF (`D:\burger`) — что переиспользуем

## Стек BSF (house-style студии)

| Слой | BSF (`D:\burger`) | Craftwork (`D:\craftwork`) |
|---|---|---|
| Frontend | Next.js 13.4 **pages router** | Next.js 13.5 pages router |
| Данные | Apollo Client + **GraphQL** к Strapi | то же |
| UI | MUI 5 + Emotion + SCSS-модули | то же |
| State | Redux Toolkit + next-redux-wrapper | то же |
| i18n | next-intl + `next.config.js` i18n domains (en/pl) | — |
| Прочее | swiper, react-dropzone, yet-another-react-lightbox, react-csv | swiper |
| Mail | **Resend** (`pages/api/mailRegistration.ts`) | — |
| CMS | Strapi **4.25.10**, better-sqlite3 | Strapi 4.25.12 |
| Strapi плагины | graphql, i18n, users-permissions, ckeditor (`@_sh/strapi-plugin-ckeditor`), local-image-sharp, sitemap | то же |
| Деплой | pm2 (`ecosystem.config.js`), `pm2 deploy production`, nginx | то же |

## Как устроена форма přihlášky в BSF (ключевое для переиспользования)

**Strapi:**
- `form` — **single type** с dynamic zone `fields[]`, компоненты:
  `form.tetx-field` (label, helperText, errorMessage, placeholder, required),
  `form.select` (label, required, errorMessage, item[] → `form.select-item` {label, disabled}),
  `form.radio` (то же + item[]),
  `form.uploud` (label)
  → **поля формы полностью настраиваются в админке**, код фронта их не знает.
- `application` — collection type, единственное поле `result[]` (repeatable component
  `form.result-item` = {key, value}). То есть заявка хранится как список пар ключ-значение.

**Фронт (`pages/registrace.tsx`):**
1. SSR тянет `formPage`, `festivals`, `form` через GraphQL.
2. Стейт `dataSend` строится динамически из `form.fields` (select → `[]`, остальное → `''`).
3. Компонент `Lineup` со списком будущих фестивалей → мультивыбор акций (`dataSend.festivals`).
4. Валидация: примитивная — для полей с `required` проверяется `.length`.
5. Файлы: если значение `instanceof File` → `POST {APP_API}/api/upload`, в результат
   кладётся абсолютный URL.
6. `POST {APP_API}/api/applications` с `{ data: { result: sendObj, locale } }`.
7. Затем `POST /api/mailRegistration` → Resend: письмо клиенту (`to`) + копия команде (`bcc`),
   HTML из `mail-templates/form.ts`.

**Слабые места BSF, которые НЕ надо копировать:**
- нет нормальной валидации (нет проверки формата email, нет react-hook-form)
- `@ts-ignore` / `any` по всему файлу
- нет rate-limiting / honeypot / captcha — форма открыта для спама
- `RESEND_API_KEY` пробрасывается в `next.config.js` → `env` (попадает в клиентский бандл!)
  — **это дыра, повторять нельзя**
- BCC-список получателей захардкожен в коде вместо админки
- нет подтверждения отправки в БД при падении письма (fire-and-forget)

## Ecomail — готовый рабочий код есть

`D:\bombastica-ecomail\src\index.ts` — рабочий пример подписки:

```
POST https://api2.ecomailapp.cz/lists/{LIST_ID}/subscribe
headers: { key: ECOMAIL_API_KEY, 'Content-Type': 'application/json' }
body: { subscriber_data: { name, email, phone, tags: [...] },
        update_existing: true, skip_confirmation: true }
```

Для Gastrozony: тот же вызов, но из Next API route (`/api/newsletter`),
ключ **только на сервере**, `skip_confirmation` → решить (double opt-in vs нет).

## Другие полезные куски BSF
- `pages/table-aplications.tsx` — страница-таблица заявок с экспортом в CSV (react-csv)
- `mail-templates/form.ts` — HTML-шаблон письма
- `components/Galery`, `components/Form`, `components/DropZone`, `components/Nav`
- `strapi/src/api/nav` — single type навигации (dynamic `content.nav-item` + `nav-item-child`)
- `strapi/src/api/global` — телефон, email, соцсети, логотипы партнёров
- `seo.meta` component — title/description на каждой сущности
