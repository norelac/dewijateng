// ==============================================================================
// DEWI JATENG - Database Client (PostgreSQL 16 & Drizzle ORM)
// Pure PostgreSQL Architecture on OrbStack Docker & Production
// ==============================================================================

import pkg, { type QueryResult, type QueryResultRow } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';

const { Pool } = pkg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/dewijateng';

// Singleton Pool instance untuk Next.js hot-reload environment
declare global {
  // eslint-disable-next-line no-var
  var __dewijateng_pg_pool__: InstanceType<typeof Pool> | undefined;
}

export const pool =
  global.__dewijateng_pg_pool__ ||
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dewijateng_pg_pool__ = pool;
}

// Drizzle ORM Singleton Instance
export const db = drizzle(pool, { schema });

export default pool;

// Helper untuk query SQL mentah / PostGIS spasial khusus jika diperlukan
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  return res;
}
