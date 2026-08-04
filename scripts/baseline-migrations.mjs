import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

const migrations = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (migrations.length === 0) {
  console.log('No migrations found.');
  process.exit(0);
}

console.log(`Baselining ${migrations.length} migration(s)...`);

for (const migration of migrations) {
  try {
    execSync(`npx prisma migrate resolve --applied ${migration}`, {
      stdio: 'inherit',
    });
  } catch {
    console.log(`Skipped ${migration} (already applied or failed).`);
  }
}

console.log('Done. Run "npx prisma migrate deploy" to verify.');
