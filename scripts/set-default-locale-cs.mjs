/**
 * Делает чешский единственной и дефолтной локалью Strapi (было English (en)).
 *
 * Контент-типы проекта не локализованы (pluginOptions.i18n не включён), у всех записей
 * `locale = null`, поэтому переключение локали контент не затрагивает. Скрипт всё равно
 * переносит записи с `locale = 'en'` на `'cs'`, если такие где-то появятся.
 *
 * Что меняется в БД:
 *   i18n_locale                  — code 'en' → 'cs', name → 'Čeština (cs)'
 *   plugin_i18n_default_locale   — '"en"' → '"cs"'
 *
 * Запуск:
 *   node scripts/set-default-locale-cs.mjs [--dry]
 *
 * Подключение к БД: переменные окружения DATABASE_* (или DATABASE_URL), иначе strapi/.env.
 * Идемпотентен. После прогона перезапустить Strapi.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STRAPI = join(ROOT, 'strapi');
const DRY = process.argv.includes('--dry');

const CODE = 'cs';
const NAME = 'Čeština (cs)';
const STORE_KEY = 'plugin_i18n_default_locale';

const { Client } = createRequire(pathToFileURL(join(STRAPI, 'package.json')))('pg');

/* ------------------------------------------------------------------ env */

/** strapi/.env; при копировании с Windows приходит с CRLF — \r обязательно срезать. */
const fileEnv = {};
const envFile = join(STRAPI, '.env');
if (existsSync(envFile)) {
  for (const raw of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) fileEnv[m[1]] = m[2];
  }
}
const val = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;

const connection = val('DATABASE_URL')
  ? { connectionString: val('DATABASE_URL') }
  : {
      host: val('DATABASE_HOST', '127.0.0.1'),
      port: Number(val('DATABASE_PORT', '5432')),
      database: val('DATABASE_NAME', 'strapi'),
      user: val('DATABASE_USERNAME', 'strapi'),
      password: val('DATABASE_PASSWORD'),
      ssl: val('DATABASE_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
    };

/* ---------------------------------------------------------------- работа */

const client = new Client(connection);
await client.connect();

const run = async (sql, params) => (DRY ? { rowCount: 0 } : client.query(sql, params));

const locales = (await client.query('select id, code, name from i18n_locale order by id')).rows;
console.log('locales:', locales.map((l) => `${l.code} (${l.name})`).join(', ') || '—');

if (locales.length > 1) {
  console.error(
    `\nV projektu je ${locales.length} jazyků. Skript umí jen situaci s jediným jazykem —` +
      ' ostatní řešte v adminu (Settings → Internationalization).'
  );
  await client.end();
  process.exit(1);
}

const [only] = locales;

if (!only) {
  console.error('\nV i18n_locale není žádný jazyk — spusťte nejdřív Strapi.');
  await client.end();
  process.exit(1);
}

if (only.code === CODE) {
  console.log(`\nJazyk už je ${CODE}.`);
} else {
  // записи со старым кодом локали (у нелокализованных типов locale = null, но проверяем)
  const tables = (
    await client.query(
      `select table_name from information_schema.columns
       where column_name = 'locale' and table_schema = 'public' and table_name <> 'i18n_locale'`
    )
  ).rows.map((r) => r.table_name);

  let moved = 0;
  for (const table of tables) {
    const { rows } = await client.query(
      `select count(*)::int n from "${table}" where locale = $1`,
      [only.code]
    );
    if (rows[0].n === 0) continue;
    console.log(`  ${table}: ${rows[0].n} záznamů ${only.code} → ${CODE}`);
    await run(`update "${table}" set locale = $1 where locale = $2`, [CODE, only.code]);
    moved += rows[0].n;
  }

  await run('update i18n_locale set code = $1, name = $2, updated_at = now() where id = $3', [
    CODE,
    NAME,
    only.id,
  ]);
  console.log(`\n${only.code} (${only.name}) → ${CODE} (${NAME}); přesunuto záznamů: ${moved}`);
}

const stored = (
  await client.query('select value from strapi_core_store_settings where key = $1', [STORE_KEY])
).rows[0];
const target = JSON.stringify(CODE);

if (!stored) {
  console.log(`${STORE_KEY}: chybí → ${target}`);
  await run(
    'insert into strapi_core_store_settings (key, value, type) values ($1, $2, $3)',
    [STORE_KEY, target, 'string']
  );
} else if (stored.value !== target) {
  console.log(`${STORE_KEY}: ${stored.value} → ${target}`);
  await run('update strapi_core_store_settings set value = $1 where key = $2', [target, STORE_KEY]);
} else {
  console.log(`${STORE_KEY}: už je ${target}`);
}

await client.end();
console.log(DRY ? '\n[dry-run] nic nezapsáno.' : '\nHotovo. Restartujte Strapi.');
