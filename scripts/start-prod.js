/**
 * Production start for Render / cloud hosts.
 * - Ensures SSL for Render Postgres
 * - Validates DATABASE_URL is not localhost on Render
 * - Runs prisma migrate deploy (with clear logs)
 * - Starts Nest on 0.0.0.0
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[start-prod] ${message}`);
  process.exit(1);
}

function withSsl(url) {
  if (!url) return url;
  if (/([?&])sslmode=/i.test(url)) return url;
  return url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`;
}

process.env.DATABASE_URL = withSsl(process.env.DATABASE_URL || '');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  fail(
    'DATABASE_URL is missing. In Render → Environment, set DATABASE_URL to your Render Postgres Internal URL.',
  );
}

let host = '';
try {
  host = new URL(databaseUrl).hostname;
} catch {
  fail('DATABASE_URL is invalid. Use a full postgres URL from Render Postgres.');
}

console.log(`[start-prod] Database host: ${host}`);

if (
  process.env.RENDER === 'true' &&
  (host === 'localhost' || host === '127.0.0.1')
) {
  fail(
    'DATABASE_URL points to localhost. Render cannot reach your PC database. Use Render Postgres Internal Database URL.',
  );
}

const mainCandidates = [
  path.join(process.cwd(), 'dist', 'src', 'main.js'),
  path.join(process.cwd(), 'dist', 'main.js'),
];

const mainFile = mainCandidates.find((candidate) => fs.existsSync(candidate));

if (!mainFile) {
  fail(
    'Built server not found. Expected dist/src/main.js. Build Command must run "npm run build" successfully.',
  );
}

console.log('[start-prod] Running prisma migrate deploy...');
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (migrate.status !== 0) {
  console.error('[start-prod] migrate deploy failed — trying db push fallback...');
  const push = spawnSync(
    'npx',
    ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'],
    {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    },
  );

  if (push.status !== 0) {
    fail(
      'Database sync failed. Check DATABASE_URL (use Internal URL + ssl) and Render Postgres status.',
    );
  }

  console.log('[start-prod] db push succeeded');
}

console.log(`[start-prod] Starting ${mainFile} on PORT=${process.env.PORT || 3000}`);
const server = spawnSync(process.execPath, [mainFile], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status ?? 1);
