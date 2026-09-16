# Gastrozony — память проекта

**Все файлы, заметки и память этого проекта хранятся ТОЛЬКО в `D:\gastrozony`.**
Ничего не писать в `d:\creditas\ibk` — это другой проект (Creditas IBK).

## Что это
Сайт **Gastrozony** — гастрозоны (food trucky, stánky, кейтеринг) для фестивалей
и мероприятий в Чехии. Заказчик: Daniel Kokeš. Дизайн: Adobe XD (только HP + LOGO), утверждён.
Язык контента: чешский.

## Структура
```
D:\gastrozony
├── client/            — Next 15.5 App Router + Tailwind 4 (скаффолд 2026-09-04)
├── strapi/            — Strapi 5.52 + PostgreSQL (скаффолд 2026-09-04)
├── design/
│   ├── screens/       — hp-1..4-*.png (секции HP) + hp-full-0.5x.png (весь артборд)
│   ├── specs/         — hp.agc.json (сырой XD), hp-layers.txt (все слои с координатами),
│   │                    hp-spec.md (СПЕЦИФИКАЦИЯ HP ПО СЕКЦИЯМ — читать перед вёрсткой), logo.*
│   ├── assets/        — SVG/PNG: логотип, еда, волны, кляксы, логотипы клиентов
│   └── tokens.md      — цвета, типографика, размеры компонентов, сетка
├── scripts/
│   ├── gen-strapi-model.mjs — source of truth контент-модели
│   ├── create-api-token.mjs — full-access токен Strapi → client/.env
│   ├── seed.mjs             — идемпотентный seed всего контента
│   └── parse-xd-agc.mjs     — парсер XD AGC JSON → слои с координатами
├── docs/
│   ├── brainstorm.md       — архитектура, контент-модель, решения, вопросы
│   ├── dev.md              — как поднять локально (+ ImageKit, Resend/Ecomail, GTM)
│   ├── deploy.md           — сервер, автодеплой, бэкапы, чек-лист безопасности
│   ├── local-testing.md    — инструкция пользователю: запустить локально и что проверить
│   ├── admin-guide.md      — návod для заказчика (čeština)
│   ├── assets-checklist.md
│   └── next-session-prompt.md — ПОШАГОВЫЙ ПЛАН РЕАЛИЗАЦИИ (промпт следующей сессии)
└── .claude/memory/  — MEMORY.md, brief.md (ТЗ), reference-burger.md (что берём из BSF)
```

## Git (2026-09-12)
- **Монорепо в корне `D:\gastrozony`** (`main`, первый коммит `03072bb`, 238 файлов),
  remote `git@github.com:simon1400/gastrozony.git`, запушено.
- Репозиторий-скаффолд `client/.git` (один коммит create-next-app, без remote) убран, чтобы не было вложенного репо;
  бэкап — в scratchpad сессии (после закрытия сессии исчезнет, ценности не имеет).
- `design/` (66 МБ исходников XD) **вне репозитория** по решению пользователя — только на локальном диске,
  при переносе на другую машину копировать вручную. Также вне: `node_modules`, `.next`, `dist`, `.env*` (кроме
  `.env.example`), `*.log`, `strapi/public/uploads` (медиа в ImageKit).
- В `client/.gitignore` добавлено `!.env.example` — иначе правило `.env*` из скаффолда глушило и образец.

## Сервер и деплой (изучено 2026-09-12)
- **Env-файлы: только `.env`, никаких `.env.local`** (16.09.2026). Сервером управляет внешняя панель,
  которая читает `/opt/<проект>/{client,strapi}/.env`; `.env.local` она не показывает — из-за этого
  прод-переменные клиента выглядели «отсутствующими». Next.js даёт `.env.local` приоритет над `.env`,
  поэтому два файла рядом держать нельзя. Локальный `client/.env.local` переименован в `client/.env`,
  `scripts/create-api-token.mjs` и `scripts/seed.mjs` пишут/читают `client/.env`. В `.gitignore` правило `.env*` — не коммитится.
  **На сервере выполнено 16.09.2026:** `/opt/gastrozony/client/.env.local` → `.env` (600, LF), `pm2 restart gastrozony-client --update-env`;
  проверено: `/sprava/prihlasky` 401 без пароля и 200 с паролем, export CSV 200, главная 200. Бэкап `.env.local.bak-20260916` рядом — удалить, когда всё устаканится.
  Прод-`ADMIN_PASS` лежит только в этом файле на сервере (в репозиторий и память не пишем — репо публичный).
- Сервер BSF = хост **`het`** в `~/.ssh/config` → `157.90.169.205`, `dimi-strapi-server`, root. (Второй хост `wedos`
  не нужен и сейчас ругается на смену host key.) Полное описание — `docs/deploy.md`.
- Конвенции: `/opt/<проект>/{client,strapi}` (свой git-клон), pm2 `<проект>-client/-strapi` + `ecosystem.config.js`
  в репо, логи `/var/log/pm2/`, nginx `<домен>` → порт клиента, **Strapi на поддомене `strapi.<домен>`**,
  certbot, PostgreSQL `<проект>_db`/`<проект>_user`, Node для сборок `/opt/node-v22/bin`.
- Деплой у соседей: GitHub Actions + `appleboy/ssh-action@v1.2.0`, секреты SSH_HOST/SSH_USER/SSH_PRIVATE_KEY.
  Ключ `github-actions-deploy` уже в `authorized_keys` сервера и локально в `~/.ssh/github_deploy_key` — новый не нужен.
- Наши порты: **client 3012, Strapi 1343** (3011 из старого плана занят tulsio; заняты 1333–1342, 1346, 1350).
- **Репозиторий:** `git@github.com:simon1400/gastrozony.git`, ветка `main`, **публичный**. Монорепо целиком.
- **Домены:** пока тестовые `gastrozony.hardart.cz` и `strapi-gastrozony.hardart.cz` (решение 12.09.2026).
  `hardart.cz` — служебный домен на Wedos, wildcard нет, каждому поддомену нужна своя A-запись на 157.90.169.205.
  У тестового клиента в nginx `X-Robots-Tag: noindex` — при переезде на `gastrozony.cz` убрать, заменить
  `NEXT_PUBLIC_SITE_URL`/`STRAPI_ADMIN_URL` и **пересобрать клиент** (NEXT_PUBLIC_* вшивается при сборке).
- `gh` CLI локально авторизован как `simon1400`. `gh secret set` с приватным ключом и правку crontab
  классификатор auto-mode блокирует — эти два шага делает пользователь (команды в `docs/deploy.md`).
- **Прод поднят 2026-09-12:** `/opt/gastrozony`, БД `gastrozony_db`, контент перенесён дампом dev-базы,
  pm2 `gastrozony-strapi` (1343) + `gastrozony-client` (3012) online, nginx + HTTPS.
  **Живо: https://gastrozony.hardart.cz и https://strapi-gastrozony.hardart.cz** (Let's Encrypt, http→https 301).
  Тестовые заявки и подписчики удалены. Секреты GitHub пользователь поставил — автодеплой проверен, прогон зелёный.
  Бэкапы настроены и проверены. GTM прописан. **Ждёт только ключей Resend/Ecomail.**
- certbot после создания A-записей упал с NXDOMAIN — публичные резолверы держали отрицательный кеш от запросов,
  сделанных до создания записей. Лечится ожиданием; у Let's Encrypt лимит 5 неудачных проверок на домен в час.
- Грабли переноса: дамп pg_dump 17 не заходит в PostgreSQL 16 сервера (`SET transaction_timeout = 0;` — удалить);
  `.env`, скопированные с Windows, приходят с CRLF — `\r` попадает в переменные шелла (лечится `sed -i 's/\r$//'`).
  Секреты Strapi (`API_TOKEN_SALT`, `ENCRYPTION_KEY`…) на проде **те же, что в dev**, иначе перенесённые
  API-токены и зашифрованный конфиг ImageKit стали бы невалидны.

## Решения пользователя 2026-09-12
- **Бэкапы:** вся база — раз в месяц (1-го, 03:40), заявки — 2× в неделю (пн/чт, 03:45). Настроено на сервере,
  скрипты в `/root/backups/scripts/gastrozony_*`, детали и восстановление — `docs/deploy.md` «Бэкапы».
- **Private key ImageKit не перевыпускаем** — проект маленький, риск принят осознанно. Из чек-листа убрано.
- **Контраст жёлтых цифр статистики не меняем** — цвета согласованы с дизайнером, вопрос закрыт (не поднимать).
- **Тексты seed** остаются черновиками — заказчику нужна конструкция, тексты он правит сам в админке.
- **Аналитика — Google Tag Manager**, контейнер `GTM-K6H6424Z` (`NEXT_PUBLIC_GTM_ID`), GA4 настраивается внутри GTM.
  `NEXT_PUBLIC_GA_ID` остался как запасной вариант (грузит gtag.js напрямую, если GTM не задан).

## Чешская админка (12.09.2026, локаль + подписи полей)
- Задача заказчика: в админке всё по-чешски, **ключи полей не менять** (на них держится фронт).
- Подписи полей живут не в схеме, а в конфигурации Content Manager
  (`strapi_core_store_settings`, ключи `plugin_content_manager_configuration_*`). Strapi на старте
  синхронизирует её так, что **значения из БД имеют приоритет** над `config.metadatas` из `schema.json`,
  поэтому на существующей базе одних схем недостаточно — нужен прогон по БД.
- Механика (подробно в `docs/dev.md` → «Чешские подписи полей в админке»):
  словарь `scripts/cs-labels.mjs` → `gen-strapi-model.mjs` (в схемы, для чистой БД)
  + `apply-cs-labels.mjs` (в БД, на каждом окружении). Оба идемпотентны, есть `--dry`.
  Прогнано на локале и проде 12.09.2026: 49 типов/компонентов, ~200 полей.
- Локаль: `set-default-locale-cs.mjs` переименовал единственную локаль `en` → `cs` (Čeština)
  и `plugin_i18n_default_locale` → `"cs"`. Контент-типы не локализованы, у записей `locale = null`,
  поэтому контент не задет (проверено до прогона: ни одной строки с `locale <> null`, ни одного
  permission с `"en"`). Удалять локаль не пришлось — переименование безопаснее (delete локали
  в Strapi 5 сносит контент локализованных типов).
- Язык интерфейса админки: `strapi/src/admin/app.tsx` (`locales: ['cs']` + bootstrap кладёт
  `localStorage['strapi-admin-language'] = 'cs'`, иначе Strapi откатывается на `en`).
  Требует пересборки админки — деплой её делает сам. Чешский перевод Strapi **неполный**:
  `Content Manager`, `Collection/Single Types`, вкладки `Draft`/`Published` и Media Library остаются
  английскими — это учтено в `docs/admin-guide.md`.
- Переименованы два английских раздела: `Global` → «Globální nastavení», `Homepage` → «Domovská stránka»
  (это `info.displayName`, API-имена не меняются).
- `docs/admin-guide.md` переписан под новые подписи: раньше он ссылался на английские ключи
  (`applicationRecipients`, `Global → defaultSeo`…), которых заказчик в админке больше не увидит.

## Ключевые ссылки
- XD макет: https://xd.adobe.com/view/3c6d2321-bb64-4f48-bbdd-dedf589c9998-693e/ (specs: `/specs`)
- Референс формы: https://burgerstreetfestival.cz/registrace · код: `D:\burger`
- Ecomail рабочий пример: `D:\bombastica-ecomail\src\index.ts`
- **Артефакт-инструкция для заказчика** (HTML-версия `docs/admin-guide.md`):
  https://claude.ai/code/artifact/0f780597-4f4e-4cf2-9551-ae8f4cd8cd81 — обновлён 12.09.2026 (v2: тексты письма,
  Ecomail, GTM, тестовые адреса). Исходник — `admin-guide.html` в scratchpad сессии; **источник правды — `docs/admin-guide.md`**.
  ⚠ Артефакт расшарен по ссылке, зрители видят версию, закреплённую share-пином: после публикации новой версии
  пользователь должен передвинуть пин в меню «Поделиться», иначе заказчик продолжит видеть старую.
  **При изменении админки/полей — обновлять и md, и артефакт.**

## Правила работы с git в этом репозитории
- **Никогда `git add -A` / `git add .`** — 12.09.2026 так в мой коммит (`69c0b6b`) уехали 53 чужих файла
  (чешские подписи админки: `scripts/cs-labels.mjs`, `apply-cs-labels.mjs`, `set-default-locale-cs.mjs`,
  `strapi/src/admin/app.tsx`, правки всех `schema.json`) — пользователь вёл эту работу параллельно.
  Коммитить только явно перечисленные пути своих изменений и сверяться с `git status` перед коммитом.
- Пуш в `main` запускает деплой по фильтру путей: `client/**` → Deploy client, `strapi/**` → Deploy Strapi.
  То есть случайно захваченный чужой файл в `strapi/` немедленно уедет на тестовый сервер.

## Стек (утверждён 2026-09-04)
- **client:** Next.js 15 App Router + React 19 + TS + Tailwind 4, react-hook-form + zod
- **strapi:** Strapi 5, REST, контент-типы без i18n; **БД:** PostgreSQL;
  **язык:** единственная локаль `cs`, интерфейс админки чешский (с 12.09.2026)
- **домен:** https://gastrozony.cz/ · **деплой:** pm2 + nginx, сервер BSF (порты: BSF=3006, craftwork=3010)
- **Resend + Ecomail:** в самом конце; стабы `lib/mailer.ts`, `/api/newsletter` уже есть.
- **Медиа:** ImageKit (с 2026-09-11) — файлы Strapi хранятся там; на фронте картинки из CMS только через `CmsImage`.
- Плагины BSF (Strapi 4) несовместимы с v5 — sitemap → `app/sitemap.ts`.

## Решения заказчика 2026-09-11 (Q3–Q16, подробно в brainstorm §9)
- Форма **одна** — `/prihlaska` для prodejců, как в BSF. `Pro pořadatele` = обычная page.
- Поля формы **в админке** (dynamic zone). **Одна акция** на заявку (`application.event` manyToOne).
- **Upload файлов — да** (через Next route → Strapi upload с серверным токеном).
- **Blog/novinky — да**, дизайн делаем сами в стиле карточек акций.
- **Cookie consent + GA4 (Consent Mode) + GDPR-страницы — да**, делаем сами.
- **Таблица заявок — да, как в BSF**: `/sprava/prihlasky` под Basic Auth + CSV-экспорт.

## Факты о макете (снято 2026-09-11 через Playwright + AGC JSON)
- В XD **2 артборда**: HP (1920×6792) и LOGO. Футера, других страниц, мобильной версии НЕТ.
- Сетка: контейнер 240…1680 (**1440**), 3 колонки **427** gap **80**, header **102**.
- Fleky = SVG-кляксы **+ blur 21px** (не «без blur», как думали раньше).
- Полная спецификация по секциям: `design/specs/hp-spec.md`.

## Статус
- [x] Референс BSF, брейнсторм, стек, БД, домен
- [x] Скаффолд Strapi + модель, client + токены + layout, дизайн-система, Newsletter e2e (2026-09-04)
- [x] Скриншоты HP + точные спеки из XD (2026-09-11)
- [x] Ответы заказчика Q3, Q6, Q7, Q8, Q11, Q15, Q16 (2026-09-11) — все вопросы закрыты
- [x] **Шаг 1** (2026-09-11): `application.event` manyToOne, `form.multipleEvents` убран, `article` + `blog-page`,
  public find/findOne в bootstrap. Попутно: `home.intro` → одно поле `text` (абзацы через пустую строку),
  `newsletter.emailLabel`.
- [x] **Шаг 2** (2026-09-11): `scripts/seed.mjs` — идемпотентен (проверено повторным запуском).
- [x] **Шаг 3** (2026-09-11): Homepage по макету. 1920 сверена с XD (вертикаль ±1px, x ±3px; пункты меню
  до ±8 — в XD неравные промежутки, у нас единый gap для пунктов из CMS), 1024 и 400 без горизонтального
  скролла, Lighthouse a11y 96 (mobile + desktop), BP/SEO 100. Единственный провал a11y — контраст жёлтых
  чисел статистики на белом (#FFD100, 1.46:1) — цвет из макета, не менять без решения заказчика.
- [x] **Шаг 4** (2026-09-11): `/akce` (табы Aktuální/Připravujeme/Proběhlé, hash `#probehle`) и `/akce/[slug]`
  (мета termín/místo/kapacita, markdown-контент, галерея + lightbox на `<dialog>`, CTA → `/prihlaska?akce=slug`
  только если `applicationOpen` и не ukončeno). ISR 60, generateStaticParams, 404 для чужого slug. 1920/1024/400 без
  горизонтального скролла; tsc + eslint чистые.
- [x] **Шаг 5** (2026-09-11): движок форм + `/prihlaska`. e2e: невалидный e-mail → 422, заявка с файлом → Postgres
  (event + attachments в ImageKit + result + mailSent), 10 подряд → 5×422 + 5×429; UI: предвыбор `?akce=`, клиентские
  ошибки + фокус, success без reload; 1024/400 без горизонтального скролла; tsc + eslint чистые.
- [x] **Шаг 6** (2026-09-11): `/[slug]` (10 блоков dynamic zone) + `/kontakt` (контакты, команда, карта, блоки).
  Все seed-страницы 200 с title из seo, неизвестный slug → 404; 1920/400 без горизонтального скролла; tsc + eslint чистые.
- [x] **Шаг 7** (2026-09-11): blog `/novinky` (по 9, `?strana=N`) + `/novinky/[slug]` («Další články»). 3 seed-статьи,
  даты по убыванию; пагинация проверена временным PAGE_SIZE=1 (1–3 → 200, 4 → 404); 1920/400 без скролла; tsc + eslint чистые.
- [x] **Шаг 8** (2026-09-11): cookie-лишта + GA4 Consent Mode v2 + «Nastavení cookies» в футере. e2e 16/16:
  без согласия 0 запросов к Google, после согласия gtag.js, выбор переживает reload, отзыв удаляет `_ga*`; tsc + eslint чистые.
- [x] **Шаг 9** (2026-09-11): `/sprava/prihlasky` под Basic Auth + CSV-экспорт. e2e 21/21: 401 без логина / с неверным
  паролем, 200 с логином, фильтр akce+stav, CSV (BOM, `;`, čeština, защита от формул, кол-во = таблица), 429 после
  10 ошибок даже с верным паролем; tsc + eslint чистые.
- [x] **Шаг 10** (2026-09-11): sitemap.xml (17 URL, валидный), robots.txt, metadataBase/canonical/OG/Twitter,
  иконки из логотипа, JSON-LD Organization+WebSite (HP) и Event (/akce/[slug]), 404 в стиле сайта; tsc + eslint чистые.
  Lighthouse HP: SEO 100 / BP 100 / a11y 97 (mobile и desktop; единственный провал — жёлтые числа статистики, см. шаг 3).
- [x] **Шаг 11** (2026-09-11): `docs/admin-guide.md` — návod pro správu (čeština, 14 kapitol: akce, články, formulář,
  přihlášky + CSV, HP, bloky, kontakt, navigace, newsletter/cookies/Global, obrázky, SEO, Markdown, FAQ).
  HTML-verze опубликована как приватный артефакт (исходник в scratchpad сессии; источник правды — md в репо).
  **При изменении админки/полей — обновлять admin-guide.md.**
- [x] **Шаг 12** (2026-09-12): Resend + Ecomail — код готов, **ключей заказчика ещё нет**.
  `lib/mailer.ts` (Resend REST `POST /emails`, без SDK), `lib/mail-template.ts` (HTML+text, чёрно-жёлтый шаблон),
  `lib/ecomail.ts` (`POST /lists/{id}/subscribe`). Без ключей: заявка/подписка сохраняются, `mailSent` и
  `syncedToEcomail` остаются `false`, в логе честная строка. С неверными ключами проверены реальные 401 от обоих API.
  Модель: `application-page.mailSubject/mailIntro/mailNote`, `newsletter.ecomailListId/ecomailTags/doubleOptIn`.
  tsc + eslint чистые. Осталось от заказчика: `RESEND_API_KEY` + DKIM/SPF на gastrozony.cz, `ECOMAIL_API_KEY` + listId.
- [x] **Шаг 13** (2026-09-12): деплой на тестовые домены — **сделано**. Монорепо на GitHub, автодеплой через
  GitHub Actions (прогон зелёный), сервер поднят, контент перенесён дампом, HTTPS, бэкапы, GTM.
  Подробности — «Git», «Сервер и деплой», «Решения пользователя» выше и `docs/deploy.md`.
  **Осталось до боевого запуска:** ключи Resend/Ecomail; убрать публичный `create` в bootstrap Strapi;
  прод-токен Strapi с ограниченными правами вместо перенесённого full-access; переезд на `gastrozony.cz`
  (DNS → certbot → сменить NEXT_PUBLIC_SITE_URL/STRAPI_ADMIN_URL + пересборка → убрать `X-Robots-Tag`).
- [x] **Анимации декора + правки UI** (2026-09-12): пятна, еда, логотипы, статистика, шапка, аккордеон,
  стрелка селекта, стык жёлтой секции с патичкой. Подробности — «Факты сессии … (анимации декора + правки UI)».
- [ ] Правки по итогам тестирования пользователем (список приносит в новую сессию, формат — `docs/local-testing.md` §7)

## Факты сессии 2026-09-12 (анимации декора + правки UI)

### Общий приём всех анимаций
- **Амплитуды — в CSS-переменных, keyframes их только умножают** (`calc(var(--blob-x) * -0.45)`).
  Один набор кадров даёт разную траекторию каждому элементу; параметры лежат в данных компонента, не в CSS.
- Классы в `globals.css`: `.gz-blob` (+ маршруты `--a`/`--b`), `.gz-float` (парение), `.gz-food` (появление),
  `.gz-parallax`, `.gz-stat`, `.gz-acc`, `.gz-select`, `.fleck::before`.
- `prefers-reduced-motion: reduce` гасит всё в одном общем блоке в конце файла — при добавлении новой анимации
  дописывать селектор туда же.

### Жёлтые пятна и флеки
- **Каждая клякса hero — свой слой со своим bbox** (`HeroFood.BLOBS[].box`, посчитан по контуру + матрице XD
  скриптом в scratchpad). В одном большом `<svg>` браузер пересчитывал бы gaussian blur на всю область каждый кадр.
- Флек за словом (`.fleck::before`) **не растёт по вертикали**: масштаб Y только ≤ 1, сдвиг всегда вверх.
  Иначе на многострочном заголовке жёлтое наползает на следующую строку (так и было в первой версии).
- Период и фаза флека — из **детерминированного хеша самого слова** (`flecks.tsx`), не `Math.random()`:
  иначе hydration mismatch. Анимация висит на классе, поэтому работает на всех заголовках с `**…**` автоматически.

### Еда hero, логотипы партнёров
- **Поворот из макета остаётся в `transform`**, а появление и парение идут через отдельные свойства
  `scale` / `translate` / `rotate` — они складываются с `transform`, а не затирают его.
- **Грабли**: `.gz-food` и `.gz-float` — селекторы равного веса, общий `animation` второго затёр появление еды.
  Лечится комбинированным правилом `.gz-food.gz-float` (оба значения в одном объявлении).
- **Грабли**: анимированная обёртка создаёт контекст наложения и ломает `mix-blend-multiply` (у логотипов
  партнёров вылезли белые прямоугольники поверх кляксы). Блендинг должен висеть на **самом анимируемом элементе**,
  глубже ставить нельзя.
- Параллакс еды — scroll-driven CSS (`animation-timeline: scroll(root block)`, `animation-range: 0 70vh`),
  без слушателей скролла. `--depth` положительный = кусок отстаёт от прокрутки и тянется вниз (это и просил
  пользователь); на экранах < lg амплитуда вдвое меньше (`--depth-scale`) — иначе на компактной сцене еда кучкуется.

### Статистика (`components/Stat.tsx`, новый клиентский компонент)
- Вынесен из `Card.tsx`, который остался серверным и делает реэкспорт (`export { Stat } from './Stat'`).
- **Скрытое состояние задано в CSS, а не из JS**: иначе на медленной гидратации готовые цифры успевают
  мелькнуть и только потом исчезают (пользователь это поймал). Для no-JS — `@media (scripting: none)`.
- Ширину числа держит **невидимая распорка** с финальным значением в той же grid-ячейке: без неё счёт
  от нуля дёргал бы весь ряд.
- Порядок: пауза между блоками 0,55 с, выезд 0,9 с, счёт 1,9 с (easeOutQuad). Старт — `IntersectionObserver`,
  блок статистики бывает и внизу страницы.

### Шапка
- Размеры (высота/лого/кегль/CTA) — в переменных `--hdr-*` на `.gz-header`, `data-compact` подменяет набор.
- **Гистерезис обязателен** (сжатие выше 80px, разжатие ниже 24px). С одним порогом шапка прыгает:
  она в потоке, сжатие укорачивает документ на 34px, **scroll anchoring** компенсирует это и возвращает
  scrollY за порог — петля. Воспроизводилось как 15 переключений подряд, scrollY сам скакал 17↔30.
- Высота мобильного меню считается от `var(--hdr-h)`, а не от захардкоженных 72px.

### Аккордеон FAQ
- Плавное раскрытие — **без JS**: `::details-content` + `interpolate-size: allow-keywords` на `html`
  + `content-visibility` в переходе с `allow-discrete`. Нативный `<details>` сохранён (клавиатура, скринридер,
  поиск по странице). Где браузер не поддерживает — открывается мгновенно, как раньше.
- «+» в кружке — **вектор, а не текстовый глиф**: глиф не совпадает с оптическим центром кегля, поэтому
  выглядел смещённым и криво поворачивался. После замены смещение центра 0,00 px по обеим осям.

### Логотип (`components/Logo.tsx`, новый)
- Логотип **инлайном, а не через `<Image src="/logo.svg">`**: знак (круг с вилками) должен вращаться
  отдельно от надписи, а у внешней картинки внутренности не достать. Компонент сгенерирован скриптом
  из `public/logo.svg` — геометрия ровно та же (внешние группы в файле взаимно гасятся, clipPath
  повторяет viewBox, оба выброшены; первый путь жёлтый = знак, остальные 10 белые = надпись).
- При наведении знак делает полный оборот вправо, при уходе мыши тем же переходом откручивается назад
  (`rotate: 360deg` на `:hover` + `transition: rotate .75s` — обратный ход получается сам).
- Центр вращения — `transform-origin: 65.613px 65.613px`: у SVG-элементов `transform-box` по умолчанию
  `view-box`, поэтому px здесь = единицы viewBox, а не пиксели экрана.
- Работает в шапке и патичке. В `/sprava` логотип остался картинкой — админка, не трогал.
- В шапке свг в `aria-hidden` (имя даёт ссылка), в патичке — `role="img" aria-label`.

### Стрелка селекта
- **Грабли**: стрелка была задана Tailwind-классом `bg-[url("data:image/svg+xml,…")]`, но в data-URI есть
  пробелы — Tailwind обрывает произвольное значение на первом пробеле и правило не генерируется вовсе.
  При этом `appearance-none` уже убрал нативную стрелку → поле выглядело как обычный инпут.
  **Data-URI держать в CSS** (`.gz-select`, `.gz-checkbox`), не в произвольных значениях Tailwind.

### Стык жёлтой секции newsletteru с патичкой
- Белой полосы между ними больше нет: переход делает **одна волна** — нижняя кромка newsletteru,
  залитая цветом патички. У футера убраны свой `SectionEdge darkTop` и белый `mt-24 xl:mt-[180px]`.
- У `SectionEdge` появился проп `side` — перекрыть, какую сторону кривой заливать. Заливка ложится
  **поверх декора**, поэтому пиццу теперь обрезает сама кривая, а не прямой край блока (раньше её
  перекрывал сплошной белый прямоугольник с прямой верхней гранью — отсюда ровная линия поперёк пиццы).
- Бургер по решению пользователя **висит между секциями** и заходит на патичку. Футеру добавлен
  `xl:pt-[260px]` (только xl, где бургер и рисуется) — иначе он накрывал колонку «Kontakt» с адресом почты.
- **Следствие**: волна теперь принадлежит секции newsletteru. Если в Strapi выключить `newsletter.enabled`,
  футер начнётся прямой чёрной кромкой без волны.

### Разное
- **Не запускать prettier по файлам этого репозитория** — конфига нет, дефолты (двойные кавычки, printWidth 80)
  ломают сложившийся стиль: 12.09.2026 так разъехались `HeroFood.tsx` и `Card.tsx`, пришлось откатывать руками.
- Dev-предупреждение Next «Image … detected as the Largest Contentful Paint, add priority» на еде hero —
  **ложное**: `priority` стоит, preload-линки в `<head>` есть, `loading="lazy"` не проставлен.
  Проверено: появляется и с полностью выключенной анимацией появления.

## Факты сессии 2026-09-12 (шаг 13 — деплой, GTM)
- **Аналитика переведена на GTM** (`lib/analytics.ts`): `NEXT_PUBLIC_GTM_ID` → `gtm.js`, `NEXT_PUBLIC_GA_ID` остался
  запасным путём на gtag.js. Consent Mode сохранён (без согласия 0 запросов к Google). `<noscript><iframe>` из
  снippета Google **намеренно не ставим** — без JS согласие не спросить и не учесть. Проверено в браузере на локали
  и на тестовом домене: после «Přijmout vše» грузится `gtm.js?id=GTM-K6H6424Z`.
- **Битый `.next` после жёсткого убийства dev-сервера**: HTML ссылается на `/_next/static/css/app/layout.css`,
  файл отдаёт 404 → сайт без стилей. Лечение: остановить dev, удалить `client/.next`, запустить заново.
  Останавливать dev только `Ctrl+C`. Записано в `docs/local-testing.md` «Частые заминки».
- Деплой-workflow разделены по путям: `client/**` → Deploy client, `strapi/**` → Deploy Strapi,
  правки только в `docs/` и `.claude/` деплой не запускают (проверено).
- Тестовая и локальная базы **независимы**: правки в локальной админке на тестовый сайт не попадают и наоборот.

## Факты сессии 2026-09-12 (шаг 12 — Resend + Ecomail)
- **`MailResult` теперь `{ok:true, sent:boolean}`**: `sent:false` = отправлять было нечего или нет ключа.
  `mailSent:true` в Strapi ставится только при `ok && sent` — БД не врёт, что письмо ушло (раньше стаб возвращал `ok:true`).
- Письма два: подтверждение подателю (`reply_to` = `MAIL_REPLY_TO` || `global.email`) и копия команде
  (`reply_to` = адрес подателя, чтобы отвечать прямо из почты). Если упало только одно — заявка считается отправленной,
  ошибка в лог.
- **Обращение без имени** — «Dobrý den,». По-чешски после приветствия нужен 5-й падеж («Jane»), автоматически не склонить.
- `newsletter.ecomailListId/ecomailTags` сделаны **не** `private`: приватные поля Strapi не отдаёт даже по серверному
  токену (и админ их не отредактирует). ID списка без API-ключа бесполезен; ключ только в env.
- Ecomail: `subscriber_data` + `update_existing:true` + `skip_confirmation: !doubleOptIn`. `doubleOptIn` по умолчанию
  **включён** (default в модели) — заказчик может выключить в админке; отдельного решения по double opt-in ждать не нужно.
- Повторная подписка (409/400 от уникального индекса Strapi) всё равно уходит в Ecomail (`update_existing`) — раньше был ранний return.
- Превью письма: временный роут `api/dev-mail-preview` (создан и удалён в этой сессии). **Папки на `_` в App Router
  не маршрутизируются** — `api/_mail-preview` отдаёт 404.
- В Git Bash `curl -F` портит UTF-8 (значение `300 × 300 cm` → 422 validation) — multipart-тесты слать node-скриптом с `FormData`.
- Тестовые записи в БД (удалить перед продом вместе с `demo.*` и `test.e2e/test.ui`): заявки `test.mail@example.com`,
  `test.mailkey@example.com`, `test.final@example.com`; подписчики `test.ecomail@example.com`, `test.ecomail2@example.com`.
- **TODO(deploy):** `RESEND_API_KEY`, `MAIL_FROM` (домен с DKIM/SPF в Resend), `ECOMAIL_API_KEY` в прод-env клиента;
  listId и штрихи Ecomail — в админке (Newsletter).

## Факты сессии 2026-09-11 (шаг 10 — SEO)
- `seoMetadata()` теперь **async**: seo → titulek/perex/obálka → `global.defaultSeo` → `/og-default.png`; всегда полный
  openGraph (siteName, cs_CZ) — в Next openGraph потомка заменяет родительский целиком. `path` → canonical + og:url.
  Файловый `opengraph-image` не используем: он перебил бы обложки акций/статей.
- **`htmlLimitedBots: /.*/`** в next.config: иначе Next 15.2+ стримит metadata в `<body>` (даже Googlebot),
  а Google `rel=canonical` вне `<head>` игнорирует.
- `SITE_URL` = `NEXT_PUBLIC_SITE_URL` || https://gastrozony.cz (metadataBase, sitemap, JSON-LD).
- Иконки — `node scripts/gen-icons.mjs` (знак из `public/logo.svg`): app/icon.svg, favicon.ico (16/32/48, PNG в ICO),
  apple-icon.png, public/icon-512.png (logo для JSON-LD), public/og-default.png. Дефолтный favicon Next заменён.
- robots: Disallow только `/api/`; `/sprava` не называем (не светить путь; её закрывают пароль и X-Robots-Tag).
- 404: `(site)/not-found.tsx` (notFound() и неизвестный /slug) + корневой `app/not-found.tsx` с Header/Footer
  для многосегментных адресов. Тексты — 4 поля в `global` (notFound*).

## Факты сессии 2026-09-11 (шаг 9 — správa přihlášek)
- **Route groups:** публичные страницы теперь в `src/app/(site)/` (свой layout: Header, Newsletter, Footer, CookieConsent);
  root `app/layout.tsx` — только html/body/шрифт; `app/sprava/` — своя тёмная админ-раскладка без newsletter/GA. URL те же.
  После переноса удалить устаревшие `.next/types/app/{akce,…}`, иначе `tsc` падает на старых путях.
- `src/middleware.ts`: Basic Auth на `/sprava/*` (ADMIN_USER / ADMIN_PASS, сравнение за постоянное время); без env → 503.
  Блокировка перебора: 10 ошибок / 15 мин на IP → 429 **до** проверки пароля (`createRateLimiter(..., { peek: true })`),
  иначе заблокированный атакующий узнал бы верный пароль по 200. Всегда `X-Robots-Tag: noindex` + `no-store`.
- Dev-доступ: `ADMIN_USER=gastrozony`, `ADMIN_PASS` — случайный, в `client/.env` (в чат не выводился).
  **TODO(deploy):** свой ADMIN_PASS в прод-env; `STRAPI_ADMIN_URL` = публичный адрес Strapi (ссылки «Otevřít ve Strapi»).
- Колонки таблицы/CSV = поля формы `prodejce` (без upload — они в «Přílohy»; без контактных полей — свои колонки
  Jméno/E-mail; `contactFieldNames()` в form-schema.ts), удалённые из формы ключи — в конце.
- CSV: `lib/csv.ts` — BOM, `;`, CRLF, ячейки на `= + - @` получают `'` (телефон виден как `'+420…` — это нормально).
- Тексты админки — в коде (внутренняя страница для команды, не для посетителей).

## Факты сессии 2026-09-11 (шаг 8 — cookies / GA4)
- Single type **`cookie-consent`** (все тексты лишты/настроек + подпись кнопки в футере), публичный find в bootstrap.
- Cookie `gz_consent=v1.analytics-0|1`, 365 дней, SameSite=Lax (+Secure на https). Смена категорий → поднять
  `VERSION` в `lib/consent.ts`, лишта спросит заново.
- GA4 — **базовый Consent Mode**: `gtag.js` вообще не грузится без согласия; после — `consent default` (всё denied)
  → `update analytics_storage: granted` → gtag.js. Реклама всегда denied. Нет `NEXT_PUBLIC_GA_ID` → ничего не грузится.
- Выбор читается на клиенте (чтение cookie в root layout сделало бы все страницы динамическими → без ISR).
- **Фикс горизонтального скролла HP на 400 (2 px, был со шага 3):** `overflow-x: clip` только на body переносится
  на viewport (→ hidden, скроллится скриптом/на iOS). Теперь clip и на `html`; sticky шапка работает.
- Тест GA вёлся с фейковым `G-TEST000000` в `.env` — убран. **TODO(deploy):** настоящий `NEXT_PUBLIC_GA_ID`
  в прод-env клиента (ID даст заказчик).
- `.env` в PowerShell 5.1 не писать через `Set-Content -Encoding utf8` (BOM) — только .NET без BOM.

## Факты сессии 2026-09-11 (шаг 7 — blog)
- **Lifecycle `strapi/src/api/article/content-types/article/lifecycles.ts`**: пустой `date` → сегодня (Praha).
  Причина: сортировка `date:desc`, а в PostgreSQL NULL при DESC идут первыми. Генератор файл не трогает.
- Карточка статьи = карточка акции, вместо бейджа статуса — жёлтый `Badge` с `<time>`; `ArticleGrid` — та же сетка.
- `/novinky?strana=N`: 1-я страница без параметра, страницы 2+ — `noindex, follow` + canonical `/novinky`;
  мусорный / выходящий за диапазон `strana` → 404. `Pagination` — общий компонент (понадобится в шаге 9).
- `blog-page` +5 текстов (emptyText, backLabel, moreTitle, prevLabel, nextLabel). `BackLink` — общий (akce + novinky).
- curl: URL с `[0]` без `-g` — glob-ошибка, а не ответ Strapi.

## Факты сессии 2026-09-11 (шаг 6 — obecná šablona)
- `components/blocks/Blocks.tsx`: подряд идущие блоки с одинаковым фоном = одна секция; grey/black — волны HP
  (greyTop/darkTop сверху, greyBottom снизу), последняя цветная секция уходит под волну newsletter.
  Без поля `background`: logos/accordion — белые, events — тёмные, tags/stats/gallery/cta — наследуют фон предыдущего.
- **CTA-блок — карточка внутри секции**, не жёлтая полоса (иначе сливается с жёлтым newsletter); на жёлтой карте
  primary-кнопка автоматически становится `dark`.
- Populate dynamic zone в Strapi 5 — только фрагменты `on` (`populate[blocks]=*` → 400).
- `/kontakt`: пустые телефон/e-mail/адрес берутся из `global`; iframe карты — если `googleMapsUrl` это ссылка
  «Vložit mapu» (`…/maps/embed…`), иначе по адресу; прочие ссылки — кнопка. В seed адреса нет → карты пока нет.
  Команда — лидирующая секция перед блоками (`SectionEntry`).
- Переиспользование: `NumberedCardList` (Card.tsx, и HP тоже), `LogoCluster` (экспорт из ClientsSection),
  `EventGallery columns`, `PageIntro children`.
- **`next dev` умер посреди сессии** («Jest worker encountered 2 child process exceptions») → все динамические
  маршруты 500 / зависание. Лечится только перезапуском `next dev`. Сервер перезапущен из сессии Claude (фоновая задача).
- В логе dev: `quality 80 not configured in images.qualities` (еда HP) — к Next 16 добавить `images.qualities`.

## Факты сессии 2026-09-11 (шаг 5 — форма)
- **Отступление от плана:** отдельного `POST /api/upload` нет — файлы идут multipart вместе с заявкой в
  `/api/application` (нет осиротевших файлов в ImageKit от ботов, один rate-limit). При ошибке записи заявки
  загруженные файлы удаляются.
- `lib/form-schema.ts` — изоморфный: типы полей + zod-схема из `form.fields`, одна и та же в браузере и на сервере
  (`File` есть в Node ≥ 20). Системные ключи `gz_event` / `gz_consent` / `gz_website` (honeypot); поля из админки
  с именем `gz_*`, дублем или с точкой пропускаются (`lib/forms.ts`).
- Сервер проверяет **magic bytes** файлов (`lib/files.ts`) — только изображения и PDF; ≤ 10 MB, ≤ 3 файла.
- Rate-limit 5 / 10 мин на IP, in-memory (`lib/rate-limit.ts`). IP = `X-Real-IP`, иначе **последний** элемент XFF.
  **TODO(deploy):** nginx `proxy_set_header X-Real-IP $remote_addr;` и `client_max_body_size 32m;`.
- `application-page` +5 текстов: eventPlaceholder, noEventsText, uploadLabel, errorText, rateLimitText; заголовок
  `Přihláška pro **prodejce**`. Мелкие строки валидации — `FORM_MESSAGES` (фолбэк, если у поля нет `errorMessage`).
- Strapi падает с 500 на загрузке PNG 1×1 (обработка изображения) — в тестах использовать реальную картинку.
- Тестовые заявки `test.e2e@example.com`, `test.ui@example.com` (source=web, с вложениями) — оставлены для шага 9,
  **удалить перед продом** вместе с `demo.*`.
- Global `applicationRecipients` публично читаем через Strapi API (private-поля не отдаются даже по токену) — учесть.
- [x] **ImageKit — включён** (2026-09-11, вариант 1, аккаунт `https://ik.imagekit.io/ev2rmbc0ca`): файлы Strapi
  хранятся в ImageKit (`strapi-plugin-imagekit` 1.0.2 + patch-package для Windows), фронт — `CmsImage` (loader `tr=w-…`).
  Seed-медиа перезалиты. Детали и ловушки — `docs/dev.md` «Картинки и ImageKit».
  **TODO(deploy):** private key ImageKit прошёл через чат → перед продом сгенерировать новый (Developer options →
  API keys), в прод-`.env` Strapi; в dev-БД поменять в Settings → ImageKit (конфиг из `.env` берётся только при 1-м запуске).

## Факты сессии 2026-09-11 (шаг 4 — акции)
- Новый single type **`events-page`** (title, perex, emptyText, подписи табов/мета/CTA, seo) — тексты /akce и детали.
  Подписи enum `capacityState` — `CAPACITY_LABELS` в `lib/events.ts` (как `STATUS_LABELS` у бейджа).
- Seed: + прошедшая демо-акция `hip-hop-zije-2026-letni-open-air` (Nitra, 18.–19. 7.) — чтобы таб «Proběhlé» не был
  пустым; галереи у MINT и HHŽ Bratislava (медиа `gz-akce-dav-noc.jpg`). Всё — черновики.
- Rich text Strapi = markdown → `components/RichText.tsx` (react-markdown 10, сырой HTML не рендерится).
- Даты — вручную (`formatEventDate`): ICU `cs` через Intl даёт «10.09.2026 – 13.09.2026» вместо «10.–13. 9. 2026».
- Табы: панели рендерит сервер (ReactNode в client-компонент), клиент переключает `hidden` — чтобы
  `lib/strapi.ts` не попадал в клиентский бандл.
- Последняя серая секция над newsletter — `GreyClosingSection` (фон протянут под волну newsletter, как на HP).
- **Оба браузера MCP (chrome-devtools и Playwright) были заняты другим процессом** — проверка скриптом:
  playwright-core из npx-кэша (`%LOCALAPPDATA%\npm-cache\_npx\9833c18b2d85bc59`) + `channel: 'chrome'`.

## Факты сессии 2026-09-11 (шаг 3 — HP)
- Эталон сверки — окно 1920 (контент 1905 из-за скроллбара). Baseline Plus Jakarta Sans в браузере:
  77/88→75, 61/70→59, 41/47→40, 49/56→48, 29/33→28, 23/33→26, 20/33→25, 18/33→24, 20/26→21.
- В `hp-layers.txt` у повёрнутых слоёв (еда, пятна) координаты = translate матрицы, НЕ bbox.
  Полные матрицы — в `hp.agc.json`; еда в `HeroFood.tsx` ставится `transform: matrix(...)` от origin 0 0.
- Волны: `SectionEdge.tsx` — абсолютные кривые в координатах артборда (grey 1104→1201 / 2045→2200,
  dark 2858→3013 / 4111→4208, yellow низ 4666→4763), высота в vw.
- В XD текст «point» — y = baseline; текст «area» (с шириной) — y = верх бокса.
- Флек в макете только под «Gastrozóny» (не под «příležitost») — seed исправлен.
- PNG еды обрезаны от прозрачных полей (sharp trim, ~27% с каждой стороны) — иначе еда мельче макета.
  Оригиналы — в `design/assets`. После замены PNG удалять `client/.next/cache/images`,
  но **не во время загрузки страницы**: dev-оптимизатор next/image навсегда вешает ключи, которые
  обрабатывались в момент удаления (лечится только перезапуском `next dev`).
- У PNG логотипа Pilsner Fest белый непрозрачный фон → логотипы с `mix-blend-multiply`.
- Кнопки/теги: паддинг 27.5 вместо 29 из XD — браузер рисует шрифт на ~3px шире, так ширины = макет.
- Декор newsletter (пицца, бургер 582) — только ≥ xl, ниже бургер наезжает на патичку.
- Playwright MCP был занят другим процессом — сверка через chrome-devtools MCP. Мобильная эмуляция
  в изолированном контексте (`new_page isolatedContext`) висла на load — использовать вкладку 2 + `emulate`.

## Факты сессии 2026-09-11 (шаги 1–2)
- Админ Strapi создан пользователем (локальный). API-токен `gastrozony-server` (full-access) создаёт
  `node scripts/create-api-token.mjs` → пишет `STRAPI_API_TOKEN` в `client/.env` (в strapi/.env не кладём).
- **Решение: логотип и favicon НЕ редактируются через Strapi** — только статика `client/public/logo.svg`
  (поля `global.logo/logoLight/favicon` удалены из модели). К тому же Strapi 5.52 блокирует SVG-upload.
- Seed-данные — черновики (не подтверждены заказчиком): даты/места HHŽ (Bratislava 17.10., Košice 24.10.),
  MINT 10.–13.9. Brno, e-mail `info@gastrozony.cz`, команда (Daniel Kokeš + «Tým prodejců»), GDPR/cookies тексты.
  2 демо-заявки `demo.*@example.com` (source=seed) — для шага 9; удалить перед продом.
- Еда для hero скопирована в `client/public/food/` (burger-big/small, pizza-big/small, hranolky) — декор, не CMS.

## Правила общения
Пользователь пишет по-русски. Контент сайта, UI-строки, названия сущностей — чешский.

## Сессия 2026-09-04 — ключевые факты
- Локально: `docs/dev.md`. Strapi `cd strapi && npm run develop` (1337), client `cd client && npm run dev` (3000).
- БД dev: postgres 17, `gastrozony/gastrozony@127.0.0.1:5432/gastrozony`.
- Модель генерируется `scripts/gen-strapi-model.mjs` — правки в него, не только в админку.
- Next снижен с 16 до 15.5 вручную.
- Публичные права Strapi выдаёт bootstrap (`strapi/src/index.ts`): read контента, create на
  application + newsletter-subscriber. **TODO(deploy):** заменить публичный create на STRAPI_API_TOKEN.
- Header/Footer/Newsletter тянут Strapi с чешскими фолбэками — фронт живёт без CMS.
- `page.tsx` — placeholder-витрина дизайн-системы; настоящая HP — шаг 3 плана.
