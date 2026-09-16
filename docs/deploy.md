# Деплой Gastrozony

Сервер — тот же, где живёт BSF: **`het`** в `~/.ssh/config` → `157.90.169.205`, hostname `dimi-strapi-server`, пользователь `root`.
Там уже ~12 связок client+strapi, поэтому всё делаем **по местным конвенциям**, а не по-своему.

## Как устроены соседние приложения (снято 12.09.2026)

| Что | Как на сервере |
|---|---|
| Код | `/opt/<проект>/{client,strapi}`, каждый — свой git-клон из `github.com/simon1400/*` |
| Процессы | pm2, имена `<проект>-client` / `<проект>-strapi`, `ecosystem.config.js` в репозитории |
| Логи | `/var/log/pm2/<имя>-{out,error}.log` |
| Node | системный v20.19.5, для сборок в CI — `/opt/node-v22/bin` (его и прописываем в PATH) |
| Сайт | nginx: `<домен>` → `proxy_pass 127.0.0.1:<порт клиента>` |
| Админка CMS | **отдельный поддомен** `strapi.<домен>` → порт Strapi (не `/admin` на основном домене) |
| HTTPS | certbot + Let's Encrypt (на сервере уже 32 сертификата), `include /etc/letsencrypt/options-ssl-nginx.conf` |
| БД | PostgreSQL 5432, схема именования `<проект>_db` + владелец `<проект>_user` |
| Деплой | GitHub Actions + `appleboy/ssh-action@v1.2.0` → `git reset --hard` + `npm ci` + build + `pm2 restart` |

Ключ для Actions уже существует: `github-actions-deploy` (ed25519) — он в `~/.ssh/authorized_keys` сервера
и локально в `~/.ssh/github_deploy_key`. Новый ключ заводить не нужно.

## Наши порты и имена

| | Значение | Проверено |
|---|---|---|
| client | **3012** | 3005/3009/3012/3013 свободны; **3011 занят** (tulsio) — старая пометка в плане устарела |
| Strapi | **1343** | заняты 1333–1342, 1346, 1350 |
| pm2 | `gastrozony-client`, `gastrozony-strapi` | `deploy/ecosystem.config.js` |
| БД | `gastrozony_db` / `gastrozony_user` | |
| Домены (тест) | `gastrozony.hardart.cz`, `strapi-gastrozony.hardart.cz` | |
| Домены (прод) | `gastrozony.cz`, `www.gastrozony.cz`, `strapi.gastrozony.cz` | позже |

## Домены

**Сейчас тестовые** (решение 12.09.2026): `gastrozony.hardart.cz` и `strapi-gastrozony.hardart.cz`.
`hardart.cz` — служебный домен на Wedos, там уже живут `burger-strapi.hardart.cz`, `monitor.hardart.cz` и др.
**Wildcard нет** — на каждый поддомен нужна своя A-запись на `157.90.169.205`.
Конфиги nginx уже содержат оба тестовых имени; у клиента добавлен `X-Robots-Tag: noindex, nofollow`,
чтобы тестовый сайт не попал в выдачу — **при переезде на прод-домен строку убрать**.

Прод-домен `gastrozony.cz` в конфиг клиента уже вписан (плюс `www`), но DNS смотрит на 46.28.106.212 —
переключение позже. Что сделать при переезде:
1. A-записи `gastrozony.cz`, `www.gastrozony.cz`, `strapi.gastrozony.cz` → `157.90.169.205`;
2. `certbot --nginx -d gastrozony.cz -d www.gastrozony.cz` и `certbot --nginx -d strapi.gastrozony.cz`;
3. в `client/.env` заменить `NEXT_PUBLIC_SITE_URL` и `STRAPI_ADMIN_URL` на прод-домены
   и **пересобрать клиент** — `NEXT_PUBLIC_*` вшивается на этапе сборки (иначе canonical/sitemap/OG
   останутся на тестовом домене);
4. убрать `X-Robots-Tag` из `gastrozony-client`.

---

## Что уже сделано на сервере (12.09.2026)

- [x] БД `gastrozony_db` + пользователь `gastrozony_user` (пароль сгенерирован, лежит в `strapi/.env` на сервере).
- [x] Репозиторий клонирован в `/opt/gastrozony`.
- [x] `strapi/.env` — **скопирован с dev**, изменены только `HOST/PORT` и `DATABASE_*`.
      Секреты (`API_TOKEN_SALT`, `ENCRYPTION_KEY`, …) намеренно те же: иначе API-токены и зашифрованный
      конфиг ImageKit из перенесённого дампа стали бы невалидны.
- [x] Контент перенесён дампом dev-базы (`pg_dump --no-owner --no-privileges`).
      Подводный камень: дамп из PostgreSQL 17 не заходит в 16 — надо удалить строку `SET transaction_timeout = 0;`.
- [x] `client/.env` — с dev, но `STRAPI_URL=http://127.0.0.1:1343`, новый `ADMIN_PASS`,
      добавлены `NEXT_PUBLIC_SITE_URL` и `STRAPI_ADMIN_URL`.
      **Оба .env приведены к LF** — в скопированных с Windows файлах был CRLF, из-за `\r` ломались шелл-скрипты.
      16.09.2026 файл переименован `.env.local` → `.env` (панель управления сервером читает только `.env`),
      права 600 сохранены, `pm2 restart gastrozony-client --update-env`. Бэкап `.env.local.bak-20260916` — удалить позже.
- [x] Сборка обеих частей, `pm2 start` + `pm2 save`: `gastrozony-strapi` (1343), `gastrozony-client` (3012).
- [x] nginx: `gastrozony-client` (тестовый + прод-домены) и `gastrozony-strapi` в sites-enabled.
- [x] **HTTPS работает:** сертификаты Let's Encrypt на оба тестовых домена, http → https 301 (certbot --redirect).
      Грабли: certbot сначала упал с NXDOMAIN — публичные резолверы держали отрицательный кеш от запросов,
      сделанных до создания A-записей. Лечится ожиданием (лимит LE: 5 неудачных проверок на домен в час).
      Проверено `Host`-заголовком: `/`, `/akce`, `/prihlaska`, `/novinky`, `/kontakt`, `/sitemap.xml` → 200,
      админка Strapi → 200, `/sprava/prihlasky` → 401 без логина и 200 с логином, `X-Robots-Tag: noindex` отдаётся.
- [x] Клиент пересобран под тестовый домен: sitemap и canonical → `https://gastrozony.hardart.cz`.
- [x] Бэкапы: вся база 1-го числа, заявки пн/чт — см. «Бэкапы» ниже (проверено пробным запуском).
- [x] Тестовые записи удалены: 7 заявок (`demo.*`, `test.*`) и 2 подписчика — в прод-базе 0 и 0.

### Осталось

- [ ] **Секреты GitHub** (без них workflow падает с `missing server host` — уже проверено):
      команды в шаге 1 ниже.
- [ ] Ключи Resend / Ecomail в `client/.env` на сервере (GTM уже прописан: `NEXT_PUBLIC_GTM_ID=GTM-K6H6424Z`).
- [ ] Чек-лист безопасности внизу (публичный `create`, custom-токен).

---

## Порядок развёртывания

### 1. GitHub: секреты репозитория
```bash
gh secret set SSH_HOST --repo simon1400/gastrozony --body "157.90.169.205"
gh secret set SSH_USER --repo simon1400/gastrozony --body "root"
gh secret set SSH_PRIVATE_KEY --repo simon1400/gastrozony < ~/.ssh/github_deploy_key
```

### 2. База данных
```bash
ssh het
sudo -u postgres psql -c "CREATE USER gastrozony_user WITH PASSWORD '<сгенерировать>';"
sudo -u postgres psql -c "CREATE DATABASE gastrozony_db OWNER gastrozony_user;"
```

### 3. Первый клон
```bash
cd /opt && git clone git@github.com:simon1400/gastrozony.git gastrozony
```

### 4. `strapi/.env` (на сервере, в репозиторий не попадает)
```ini
HOST=127.0.0.1
PORT=1343
APP_KEYS=<4 случайных значения через запятую>
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
JWT_SECRET=<random>
ENCRYPTION_KEY=<random>

DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=gastrozony_db
DATABASE_USERNAME=gastrozony_user
DATABASE_PASSWORD=<из шага 2>
DATABASE_SSL=false

IMAGEKIT_PUBLIC_KEY=<из аккаунта>
IMAGEKIT_PRIVATE_KEY=<НОВЫЙ ключ, см. «Безопасность»>
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ev2rmbc0ca
IMAGEKIT_UPLOAD_FOLDER=/gastrozony-prod/
```
Секреты генерировать: `node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"`.

### 5. `client/.env` (на сервере)

**Именно `.env`, не `.env.local`** (решение 16.09.2026): сервером управляет внешняя панель,
которая читает `/opt/<проект>/<часть>/.env` — переменные в `.env.local` она не видит.
Держать оба файла нельзя: Next.js даёт `.env.local` приоритет над `.env`, и правка через панель
молча не сработает. У Strapi файл и так `.env` — теперь обе части единообразны.
```ini
STRAPI_URL=http://127.0.0.1:1343
STRAPI_API_TOKEN=<создать в админке после шага 6 — custom, только нужные права>
NEXT_PUBLIC_SITE_URL=https://gastrozony.cz
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ev2rmbc0ca
NEXT_PUBLIC_GTM_ID=GTM-K6H6424Z
ADMIN_USER=gastrozony
ADMIN_PASS=<свой, не dev-овский>
STRAPI_ADMIN_URL=https://strapi.gastrozony.cz
RESEND_API_KEY=<от заказчика>
MAIL_FROM=Gastrozóny <info@gastrozony.cz>
ECOMAIL_API_KEY=<от заказчика>
```

### 6. Сборка и запуск
```bash
export PATH=/opt/node-v22/bin:$PATH
cd /opt/gastrozony/strapi && NODE_ENV=development npm ci && npm run build
pm2 start /opt/gastrozony/deploy/ecosystem.config.js --only gastrozony-strapi
# админа завести через https://strapi.gastrozony.cz/admin (после шага 7) либо `npx strapi admin:create-user`
cd /opt/gastrozony/client && npm ci && npm run build
pm2 start /opt/gastrozony/deploy/ecosystem.config.js --only gastrozony-client
pm2 save
```

### 7. nginx + сертификаты
Два конфига по образцу `ddsirup-client-prod` / `ddsirup-strapi-prod`:

`/etc/nginx/sites-available/gastrozony-client` — `gastrozony.cz` + `www` → `127.0.0.1:3012`,
`/etc/nginx/sites-available/gastrozony-strapi` — `strapi.gastrozony.cz` → `127.0.0.1:1343`.

Обязательно (иначе сломается rate-limit и загрузка файлов в форме):
```nginx
client_max_body_size 32m;              # у Strapi — 100m, как у соседей
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```
Затем:
```bash
ln -s /etc/nginx/sites-available/gastrozony-{client,strapi} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d gastrozony.cz -d www.gastrozony.cz
certbot --nginx -d strapi.gastrozony.cz
```

### 8. Контент
```bash
cd /opt/gastrozony && node scripts/seed.mjs     # идемпотентен; сначала STRAPI_API_TOKEN в client/.env
```
Либо перенести контент из dev-базы (`pg_dump` → `psql`) — решить перед запуском.

---

## Безопасность — сделать до открытия сайта

- [ ] **Убрать публичный `create`** на `application` и `newsletter-subscriber` в `strapi/src/index.ts` (bootstrap) —
      писать должен только серверный токен.
- [ ] Прод-токен Strapi — **custom** (только нужные права), а не full-access dev-токен.
- [x] ~~Новый private key ImageKit~~ — **решено не перевыпускать** (12.09.2026): проект небольшой, риск принят.
- [ ] Свой `ADMIN_PASS` для `/sprava` (dev-овский не переносить).
- [ ] Удалить тестовые записи: заявки `demo.*@example.com`, `test.e2e@`, `test.ui@`, `test.mail@`,
      `test.mailkey@`, `test.final@example.com`; подписчики `test.ecomail@`, `test.ecomail2@example.com`.
- [ ] Репозиторий **публичный** — убедиться, что это осознанно (виден весь код, docs и путь `/sprava`;
      секретов в нём нет, но путь админки перестаёт быть неизвестным).

## Бэкапы

Медиа не бэкапим — файлы в ImageKit. Настроено 12.09.2026, схема по решению заказчика:
**вся база — раз в месяц, заявки — два раза в неделю.**

| Что | Когда | Скрипт | Куда | Хранение |
|---|---|---|---|---|
| Вся база (контент, страницы, настройки, заявки) | 1-го числа в 03:40 | `/root/backups/scripts/gastrozony_db_backup.sh` | `/root/backups/gastrozony/full/` | 400 дней (~13 копий) |
| Только заявки + вложения | пн и чт в 03:45 | `/root/backups/scripts/gastrozony_applications_backup.sh` | `/root/backups/gastrozony/applications/` | 180 дней |

Пароль БД — в `/root/.gastrozony_db_pw` (режим 600), берётся из `strapi/.env`.
Лог каждого набора — `backup.log` в его каталоге (строка `OK`/`FAIL` на запуск).

**Бэкап заявок даёт два файла:**
- `applications_<дата>.dump` — таблицы `applications`, `applications_cmps`, `applications_event_lnk`,
  `components_form_result_items`, `files`, `files_related_mph` (формат custom, для `pg_restore`);
- `prihlasky_<дата>.csv` — тот же CSV, что кнопка «Exportovat CSV» на `/sprava/prihlasky`
  (скрипт дёргает сам сайт с Basic Auth из `client/.env`), можно сразу открыть в Excel или переслать заказчику.

### Восстановление

Вся база:
```bash
sudo -u postgres pg_restore -d gastrozony_db --clean --if-exists --no-owner \
  /root/backups/gastrozony/full/gastrozony_db_<дата>.dump
pm2 restart gastrozony-strapi gastrozony-client
```

Только заявки (когда остальной контент трогать нельзя):
```bash
sudo -u postgres pg_restore -d gastrozony_db --data-only --no-owner \
  -t applications -t applications_cmps -t applications_event_lnk -t components_form_result_items \
  /root/backups/gastrozony/applications/applications_<дата>.dump
```
Перед восстановлением заявок сделайте свежий полный дамп — `--data-only` конфликтует с уже
существующими строками (те же id), при необходимости чистить таблицы вручную.

### Проверить, что бэкапы идут
```bash
crontab -l | grep gastrozony
tail -5 /root/backups/gastrozony/full/backup.log
tail -5 /root/backups/gastrozony/applications/backup.log
ls -lh /root/backups/gastrozony/*/
```

## Как работает автодеплой

`.github/workflows/deploy-client.yml` и `deploy-strapi.yml`: push в `main` → по фильтру путей запускается нужный
(или оба) → `appleboy/ssh-action` заходит на сервер ключом из секрета → `git fetch` + `git reset --hard origin/main`
→ `npm ci` → build → `pm2 restart`. У обоих одна `concurrency: deploy-production`, чтобы два `git reset`
не пересеклись на общем чекауте. Ручной запуск — `workflow_dispatch` (вкладка Actions → Run workflow).

`git reset --hard` затирает локальные правки на сервере — править код прямо в `/opt/gastrozony` нельзя,
только через репозиторий. `.env` файлы reset не трогает (они в `.gitignore`).
