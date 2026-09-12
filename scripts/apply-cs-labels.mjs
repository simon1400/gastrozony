/**
 * Проставляет чешские подписи полей в конфигурацию Content Manager существующей базы.
 * Источник подписей — scripts/cs-labels.mjs. Ключи полей не меняются.
 *
 * Зачем скрипт: Strapi при старте синхронизирует конфигурацию Content Manager так, что
 * значения из БД имеют приоритет над `config.metadatas` из schema.json. То есть на уже
 * поднятой базе (dev, прод) подписи из схем не применятся — их нужно записать в БД.
 *
 * Запуск:
 *   node scripts/apply-cs-labels.mjs [--dry]
 *
 * Подключение к БД: переменные окружения DATABASE_* (или DATABASE_URL), иначе strapi/.env.
 * Идемпотентен: повторный запуск ничего не меняет. После прогона перезапустить Strapi
 * (админка кеширует конфигурацию в рамках сессии).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import { CONTENT_TYPE_LABELS, COMPONENT_LABELS, labelsFor } from './cs-labels.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STRAPI = join(ROOT, 'strapi');
const DRY = process.argv.includes('--dry');

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

const PREFIX = {
  contentType: 'plugin_content_manager_configuration_content_types::',
  component: 'plugin_content_manager_configuration_components::',
};

/** publishedAt есть только у типов с draftAndPublish, createdBy/updatedBy — не везде. */
const COMMON_OPTIONAL = new Set(['publishedAt', 'createdBy', 'updatedBy']);

const client = new Client(connection);
await client.connect();

let changed = 0;
let untouched = 0;
const missingRows = [];
const missingFields = [];

const apply = async (uid, storeKey) => {
  const { rows } = await client.query(
    'select value from strapi_core_store_settings where key = $1',
    [storeKey]
  );
  if (rows.length === 0) {
    missingRows.push(uid);
    return;
  }

  const config = JSON.parse(rows[0].value);
  const labels = labelsFor(uid);
  const diff = [];

  for (const [field, label] of Object.entries(labels)) {
    const meta = config.metadatas?.[field];
    if (!meta) {
      // поле есть в словаре, но не в модели — опечатка или поле удалили из схемы
      if (!COMMON_OPTIONAL.has(field)) missingFields.push(`${uid}.${field}`);
      continue;
    }
    // edit.label пустой у id/documentId — там подпись живёт только в list
    if ('label' in (meta.edit ?? {}) && meta.edit.label !== label) {
      diff.push(`${field}: edit "${meta.edit.label}" → "${label}"`);
      meta.edit.label = label;
    }
    if (meta.list && meta.list.label !== label) {
      diff.push(`${field}: list "${meta.list.label}" → "${label}"`);
      meta.list.label = label;
    }
  }

  if (diff.length === 0) {
    untouched++;
    return;
  }

  changed++;
  console.log(`\n${uid}`);
  for (const line of diff) console.log(`  ${line}`);

  if (!DRY) {
    await client.query('update strapi_core_store_settings set value = $1 where key = $2', [
      JSON.stringify(config),
      storeKey,
    ]);
  }
};

for (const uid of Object.keys(CONTENT_TYPE_LABELS)) {
  await apply(uid, PREFIX.contentType + uid);
}
for (const uid of Object.keys(COMPONENT_LABELS)) {
  await apply(uid, PREFIX.component + uid);
}

await client.end();

console.log(
  `\n${DRY ? '[dry-run] ' : ''}upraveno: ${changed}, bez změny: ${untouched}` +
    `, celkem: ${changed + untouched}`
);
if (missingRows.length) {
  console.warn(`\nchybí konfigurace v DB (spusťte Strapi alespoň jednou): ${missingRows.join(', ')}`);
}
if (missingFields.length) {
  console.warn(`\npole ze slovníku nejsou v modelu: ${missingFields.join(', ')}`);
}
if (changed && !DRY) console.log('\nRestartujte Strapi, aby admin načetl nové popisky.');
