import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

function log(...args) { console.log('[migrate]', ...args); }

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      run_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(pool) {
  const res = await pool.query(`SELECT name FROM migrations ORDER BY id`);
  return new Set(res.rows.map(r => r.name));
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!databaseUrl) {
    console.error('No DATABASE_URL or NEON_DATABASE_URL found in environment.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 5 });

  try {
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    await ensureMigrationsTable(pool);
    const applied = await getApplied(pool);

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) { log('no migrations found in', MIGRATIONS_DIR); await pool.end(); return; }

    for (const file of files) {
      if (applied.has(file)) { log('skipping already applied:', file); continue; }
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      log('applying', file);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations(name) VALUES($1)', [file]);
        await client.query('COMMIT');
        log('applied', file);
      } catch (err) {
        await client.query('ROLLBACK').catch(()=>{});
        client.release();
        throw err;
      } finally { client.release(); }
    }
    log('migrations complete');
  } finally { await pool.end(); }
}

run().catch(err => { console.error('Migration runner failed:', err); process.exit(1); });