import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { getCurrentDb } from './tenant-context';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Default pool - used as fallback and for startup checks
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const defaultDb = drizzle(pool, { schema });

// Proxy: routes that import { db } will transparently get the correct tenant db
// During a request → returns tenant-specific db from AsyncLocalStorage
// Outside a request (schedulers, startup) → returns default db
export const db: ReturnType<typeof drizzle> = new Proxy(defaultDb, {
  get(_target, prop, receiver) {
    try {
      const tenantDb = getCurrentDb();
      return Reflect.get(tenantDb, prop, receiver);
    } catch {
      // Fallback to default db (outside request context)
      return Reflect.get(defaultDb, prop, receiver);
    }
  },
});
