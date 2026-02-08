// ...existing code...
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

/**
 * Fallback that throws when no DB is configured.
 */
const NullishQueryFunction = () => {
  throw new Error(
    'No database connection string was provided. Set DATABASE_URL (dev) or NEON_DATABASE_URL (prod).'
  );
};
NullishQueryFunction.transaction = async () => {
  throw new Error(
    'No database connection string was provided. Set DATABASE_URL (dev) or NEON_DATABASE_URL (prod).'
  );
};

/**
 * Create a simple pg-backed query function with .transaction support.
 * query(text, params) -> returns rows array
 */
function createPgQuery(connectionString) {
  const pool = new Pool({
    connectionString,
    // Optional: enable SSL when env requests it (useful for some hosted DBs)
    // ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
  });

  const query = async (text, params = []) => {
    const res = await pool.query(text, params);
    return res.rows;
  };

  query.transaction = async (fn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txQuery = async (text, params = []) => {
        const res = await client.query(text, params);
        return res.rows;
      };
      const result = await fn(txQuery);
      await client.query('COMMIT');
      client.release();
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {}
      client.release();
      throw err;
    }
  };

  // expose pool for migrations/debugging if needed
  query._pool = pool;
  return query;
}

/**
 * Decide connection backend:
 * - Production: use NEON_DATABASE_URL with @neondatabase/serverless (if present)
 * - Dev: use DATABASE_URL with pg Pool
 * - Fallback: throw helpful error
 */
let sql;

if (process.env.NODE_ENV === 'production' && process.env.NEON_DATABASE_URL) {
  // neon() returns a query function compatible with usage in the project
  sql = neon(process.env.NEON_DATABASE_URL);
} else if (process.env.DATABASE_URL) {
  sql = createPgQuery(process.env.DATABASE_URL);
} else {
  sql = NullishQueryFunction;
}

export default sql;
