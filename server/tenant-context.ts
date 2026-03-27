import { AsyncLocalStorage } from "async_hooks";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

// Per-request tenant context stored here
interface TenantContext {
  db: ReturnType<typeof drizzle>;
  config: TenantDbConfig;
}
const asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

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

  // Tenant bilgisini request objesine de ekle (upload path vb. icin)
  (req as any).tenantConfig = config;

  asyncLocalStorage.run({ db, config }, () => {
    next();
  });
}

/**
 * Get the current request's db from AsyncLocalStorage.
 * Falls back to default db if called outside of request context (e.g. schedulers).
 */
export function getCurrentDb(): ReturnType<typeof drizzle> {
  const ctx = asyncLocalStorage.getStore();
  if (ctx) return ctx.db;

  // Fallback: return the first tenant's db or default
  const fallbackConfig = tenantConfigs.find((c) => c.domain === "*") || tenantConfigs[0];
  if (fallbackConfig) {
    return getOrCreateDb(fallbackConfig);
  }

  throw new Error("[TENANT] No database connection available");
}

/**
 * Get the current tenant config from AsyncLocalStorage.
 * Useful for tenant-aware file uploads, email sending, etc.
 */
export function getCurrentTenantConfig(): TenantDbConfig | null {
  const ctx = asyncLocalStorage.getStore();
  return ctx?.config || null;
}

/**
 * Get a safe tenant identifier for use in file paths, logs, etc.
 * Returns lowercase name with special chars replaced by dashes.
 */
export function getCurrentTenantSlug(): string {
  const config = getCurrentTenantConfig();
  if (!config) return "default";
  return config.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
}

/**
 * Get the pool for a specific domain (for direct pool access if needed)
 */
export function getPoolForDomain(domain: string): Pool | null {
  return poolCache.get(domain) || null;
}

/**
 * Bot istekleri gibi HTTP domain header'ı olmayan durumlar için
 * belirli bir tenant domain'i ile AsyncLocalStorage scope'u oluşturur.
 */
export function runWithTenant<T>(domain: string, fn: () => Promise<T>): Promise<T> {
  const config = findTenantConfig(domain);
  if (!config) {
    throw new Error(`[TENANT] Tenant bulunamadı: ${domain}`);
  }
  const db = getOrCreateDb(config);
  return asyncLocalStorage.run({ db, config }, fn);
}

/**
 * Mevcut tenant config'lerini döndürür (bot auth için tenant eşleştirmede kullanılır)
 */
export function getTenantConfigs(): TenantDbConfig[] {
  return tenantConfigs;
}
