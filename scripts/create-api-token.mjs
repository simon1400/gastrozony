/**
 * Создаёт full-access API-токен Strapi для seed-скрипта и серверных API routes Next
 * и записывает его в client/.env.local (STRAPI_API_TOKEN).
 * Запуск: node scripts/create-api-token.mjs   (из корня проекта; Strapi может работать параллельно)
 *
 * Идемпотентен: если в client/.env.local токен уже есть — ничего не делает.
 * Если токен с таким именем есть в Strapi, а в env его нет — пересоздаёт (plaintext не восстановить).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STRAPI_DIR = join(ROOT, 'strapi');
const CLIENT_ENV = join(ROOT, 'client', '.env.local');
const TOKEN_NAME = 'gastrozony-server';

const envText = existsSync(CLIENT_ENV) ? readFileSync(CLIENT_ENV, 'utf8') : '';
if (/^STRAPI_API_TOKEN=\S+/m.test(envText)) {
  console.log('STRAPI_API_TOKEN už je v client/.env.local — nic nedělám.');
  process.exit(0);
}

const require = createRequire(join(STRAPI_DIR, 'package.json'));
const { createStrapi } = require('@strapi/strapi');

// CLI `strapi develop` грузит strapi/.env сам, программный createStrapi — нет
for (const raw of readFileSync(join(STRAPI_DIR, '.env'), 'utf8').split(/\r?\n/)) {
  const m = raw.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

process.chdir(STRAPI_DIR);
const app = await createStrapi({ appDir: STRAPI_DIR, distDir: join(STRAPI_DIR, 'dist') }).load();

try {
  const tokens = app.service('admin::api-token');
  const existing = await tokens.getByName(TOKEN_NAME);
  if (existing) await tokens.revoke(existing.id);

  const { accessKey } = await tokens.create({
    name: TOKEN_NAME,
    description: 'Seed + serverové API routes Next (přihlášky, upload, newsletter). Nikdy do klientského bundlu.',
    type: 'full-access',
    kind: 'content-api',
    lifespan: null,
  });

  const line = `STRAPI_API_TOKEN=${accessKey}`;
  const next = /^#?\s*STRAPI_API_TOKEN=.*$/m.test(envText)
    ? envText.replace(/^#?\s*STRAPI_API_TOKEN=.*$/m, line)
    : `${envText.trimEnd()}\n${line}\n`;
  writeFileSync(CLIENT_ENV, next, 'utf8');
  console.log(`Token „${TOKEN_NAME}“ vytvořen a zapsán do client/.env.local`);
} finally {
  await app.destroy();
}
process.exit(0);
