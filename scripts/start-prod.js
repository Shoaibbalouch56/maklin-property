/**
 * Production start for Render / cloud hosts.
 * - Validates DATABASE_URL is not localhost
 * - Runs prisma migrate deploy
 * - Starts the Nest API and binds via main.ts to 0.0.0.0
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[start-prod] ${message}`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL || '';

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
    `Built server not found. Expected dist/src/main.js. Build Command must run "npm run build" successfully.`,
  );
}

console.log('[start-prod] Running prisma migrate deploy...');
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (migrate.status !== 0) {
  fail('prisma migrate deploy failed. Check DATABASE_URL and that Postgres is running.');
}

console.log(`[start-prod] Starting ${mainFile} on PORT=${process.env.PORT || 3000}`);
const server = spawnSync(process.execPath, [mainFile], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status ?? 1);
