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
| Домены | `gastrozony.cz`, `www.gastrozony.cz`, `strapi.gastrozony.cz` | |

## ⚠ Блокер: DNS

На 12.09.2026 `gastrozony.cz` → **46.28.106.212** (не наш сервер), у `www` и `strapi` записей нет.
Пока A-записи не переведут на **157.90.169.205**, certbot сертификаты не выпустит и сайт не откроется.
Нужны записи: `gastrozony.cz`, `www.gastrozony.cz`, `strapi.gastrozony.cz` → `157.90.169.205`.

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

### 5. `client/.env.local` (на сервере)
```ini
STRAPI_URL=http://127.0.0.1:1343
STRAPI_API_TOKEN=<создать в админке после шага 6 — custom, только нужные права>
NEXT_PUBLIC_SITE_URL=https://gastrozony.cz
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ev2rmbc0ca
NEXT_PUBLIC_GA_ID=<от заказчика>
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
cd /opt/gastrozony && node scripts/seed.mjs     # идемпотентен; сначала STRAPI_API_TOKEN в client/.env.local
```
Либо перенести контент из dev-базы (`pg_dump` → `psql`) — решить перед запуском.

---

## Безопасность — сделать до открытия сайта

- [ ] **Убрать публичный `create`** на `application` и `newsletter-subscriber` в `strapi/src/index.ts` (bootstrap) —
      писать должен только серверный токен.
- [ ] Прод-токен Strapi — **custom** (только нужные права), а не full-access dev-токен.
- [ ] **Новый private key ImageKit** (текущий проходил через чат) — Developer options → API keys.
      Конфиг из `.env` плагин читает только при первом запуске, дальше — Settings → ImageKit в админке.
- [ ] Свой `ADMIN_PASS` для `/sprava` (dev-овский не переносить).
- [ ] Удалить тестовые записи: заявки `demo.*@example.com`, `test.e2e@`, `test.ui@`, `test.mail@`,
      `test.mailkey@`, `test.final@example.com`; подписчики `test.ecomail@`, `test.ecomail2@example.com`.
- [ ] Репозиторий **публичный** — убедиться, что это осознанно (виден весь код, docs и путь `/sprava`;
      секретов в нём нет, но путь админки перестаёт быть неизвестным).

## Бэкапы (cron)
Uploads бэкапить не нужно — медиа в ImageKit. Нужна только БД:
```cron
0 3 * * * sudo -u postgres pg_dump gastrozony_db | gzip > /opt/gastrozony/backups/db-$(date +\%F).sql.gz
0 4 * * * find /opt/gastrozony/backups -name 'db-*.sql.gz' -mtime +30 -delete
```
(каталог `backups` есть и у BSF — `/opt/burger/backups`).

## Как работает автодеплой

`.github/workflows/deploy-client.yml` и `deploy-strapi.yml`: push в `main` → по фильтру путей запускается нужный
(или оба) → `appleboy/ssh-action` заходит на сервер ключом из секрета → `git fetch` + `git reset --hard origin/main`
→ `npm ci` → build → `pm2 restart`. У обоих одна `concurrency: deploy-production`, чтобы два `git reset`
не пересеклись на общем чекауте. Ручной запуск — `workflow_dispatch` (вкладка Actions → Run workflow).

`git reset --hard` затирает локальные правки на сервере — править код прямо в `/opt/gastrozony` нельзя,
только через репозиторий. `.env` файлы reset не трогает (они в `.gitignore`).
