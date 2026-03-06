import { AsyncLocalStorage } from "async_hooks";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

// Per-request tenant db stored here
const asyncLocalStorage = new AsyncLocalStorage<ReturnType<typeof drizzle>>();

export interface TenantDbConfig {
  domain: string;
  databaseUrl: string;
  name: string;
}

// Domain -> db pool cache (created once, reused across requests)
const poolCache = new Map<string, Pool>();
const dbCache = new Map<string, ReturnType<typeof drizzle>>();

// Tenant configs loaded from environment
let tenantConfigs: TenantDbConfig[] = [];

/**
 * Parse TENANTS env variable.
 * Format: domain1|db_url1|name1,domain2|db_url2|name2
 *
 * Or use individual TENANT_* env vars:
 *   TENANT_1_DOMAIN=filokiapi.architectaiagency.com
 *   TENANT_1_DB_URL=postgresql://...
 *   TENANT_1_NAME=ERSA
 */
export function loadTenantConfigs(): TenantDbConfig[] {
  const configs: TenantDbConfig[] = [];

  // Method 1: Individual TENANT_* env vars (preferred, easier to read)
  for (let i = 1; i <= 20; i++) {
    const domain = process.env[`TENANT_${i}_DOMAIN`];
    const dbUrl = process.env[`TENANT_${i}_DB_URL`];
    const name = process.env[`TENANT_${i}_NAME`] || `Tenant ${i}`;

    if (domain && dbUrl) {
      configs.push({ domain, databaseUrl: dbUrl, name });
    }
  }

  // If no tenant configs found, use DATABASE_URL as default for all domains
  if (configs.length === 0 && process.env.DATABASE_URL) {
    console.log("[TENANT] No tenant configs found, using DATABASE_URL as single-tenant fallback");
    configs.push({
      domain: "*",
      databaseUrl: process.env.DATABASE_URL,
      name: "Default",
    });
  }

  tenantConfigs = configs;

  console.log(`[TENANT] Loaded ${configs.length} tenant(s):`);
  configs.forEach((c) => console.log(`  - ${c.name}: ${c.domain}`));

  return configs;
}

/**
 * Get or create a drizzle db instance for a given tenant config
 */
function getOrCreateDb(config: TenantDbConfig): ReturnType<typeof drizzle> {
  const cached = dbCache.get(config.domain);
  if (cached) return cached;

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const db = drizzle(pool, { schema });

  poolCache.set(config.domain, pool);
  dbCache.set(config.domain, db);

  console.log(`[TENANT] Created db pool for: ${config.name} (${config.domain})`);
  return db;
}

/**
 * Find the tenant config matching the incoming request's host
 */
function findTenantConfig(host: string): TenantDbConfig | null {
  // Strip port from host
  const hostname = host.split(":")[0];

  // Exact domain match
  const exact = tenantConfigs.find((c) => c.domain === hostname);
  if (exact) return exact;

  // Wildcard fallback
  const wildcard = tenantConfigs.find((c) => c.domain === "*");
  if (wildcard) return wildcard;

  return null;
}

/**
 * Express middleware: sets the correct db in AsyncLocalStorage based on request domain
 */
export function tenantDbMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.get("x-forwarded-host") || req.get("host") || "";
  const config = findTenantConfig(host);

  if (!config) {
    console.error(`[TENANT] No tenant found for host: ${host}`);
    return res.status(400).json({
      success: false,
      error: "UNKNOWN_TENANT",
      message: `Bu domain icin tenant yapilandirmasi bulunamadi: ${host}`,
    });
  }

  const db = getOrCreateDb(config);

  asyncLocalStorage.run(db, () => {
    next();
  });
}

/**
 * Get the current request's db from AsyncLocalStorage.
 * Falls back to default db if called outside of request context (e.g. schedulers).
 */
export function getCurrentDb(): ReturnType<typeof drizzle> {
  const db = asyncLocalStorage.getStore();
  if (db) return db;

  // Fallback: return the first tenant's db or default
  const fallbackConfig = tenantConfigs.find((c) => c.domain === "*") || tenantConfigs[0];
  if (fallbackConfig) {
    return getOrCreateDb(fallbackConfig);
  }

  throw new Error("[TENANT] No database connection available");
}

/**
 * Get the pool for a specific domain (for direct pool access if needed)
 */
export function getPoolForDomain(domain: string): Pool | null {
  return poolCache.get(domain) || null;
}
