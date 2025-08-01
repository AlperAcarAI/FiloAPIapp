import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import ws from "ws";

// Tenant configuration interface
export interface TenantConfig {
  id: string;
  name: string;
  subdomain: string;
  databaseUrl: string;
  isActive: boolean;
  createdAt: Date;
}

// Tenant registry - Bu production'da external config service olabilir
const TENANT_REGISTRY: Map<string, TenantConfig> = new Map([
  ['demo', {
    id: 'demo',
    name: 'Demo Şirketi',
    subdomain: 'demo',
    databaseUrl: process.env.DATABASE_URL || '',
    isActive: true,
    createdAt: new Date()
  }],
  ['test', {
    id: 'test',
    name: 'Test Şirketi',
    subdomain: 'test',
    databaseUrl: process.env.DATABASE_URL || '',
    isActive: true,
    createdAt: new Date()
  }]
]);

// Database connection pool cache
const connectionPools: Map<string, Pool> = new Map();
const drizzleInstances: Map<string, ReturnType<typeof drizzle>> = new Map();

export class TenantManager {
  private static instance: TenantManager;

  private constructor() {}

  public static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager();
    }
    return TenantManager.instance;
  }

  /**
   * Subdomain'den tenant bilgisini al
   */
  public getTenantFromSubdomain(subdomain: string): TenantConfig | null {
    return TENANT_REGISTRY.get(subdomain) || null;
  }

  /**
   * Host header'dan subdomain'i extract et
   */
  public extractSubdomain(host: string): string | null {
    if (!host) return 'demo'; // Default to demo if no host
    
    // Replit environment check - always return demo for replit hosts
    if (host.includes('replit.dev') || host.includes('repl.co') || host.includes('-00-')) {
      return 'demo'; // Replit environment → demo (default)
    }
    
    // subdomain.domain.com formatından subdomain'i al
    const parts = host.split('.');
    
    // localhost veya IP durumları için özel kontrol
    if (host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
      // test.localhost:5000 gibi durumlar için subdomain'i al
      if (parts.length >= 2 && parts[0] !== 'localhost') {
        return parts[0]; // test.localhost:5000 → test
      }
      return 'demo'; // localhost:5000 → demo (default)
    }
    if (parts.length >= 3) {
      return parts[0]; // İlk part subdomain
    }
    
    return null;
  }

  /**
   * Tenant için database connection'ı al
   */
  public async getDatabaseConnection(tenantId: string) {
    const tenant = TENANT_REGISTRY.get(tenantId);
    if (!tenant || !tenant.isActive) {
      throw new Error(`Tenant not found or inactive: ${tenantId}`);
    }

    // Mevcut connection varsa kullan
    if (drizzleInstances.has(tenantId)) {
      return drizzleInstances.get(tenantId)!;
    }

    // Yeni connection oluştur
    const pool = new Pool({ 
      connectionString: tenant.databaseUrl,
      // Her tenant için ayrı connection settings
      max: 10, // Max connections per tenant
      idleTimeoutMillis: 30000
    });

    // WebSocket constructor'ı set et
    const neonConfig = await import('@neondatabase/serverless');
    neonConfig.neonConfig.webSocketConstructor = ws;

    const db = drizzle({ client: pool, schema });
    
    // Cache'le
    connectionPools.set(tenantId, pool);
    drizzleInstances.set(tenantId, db);

    return db;
  }

  /**
   * Yeni tenant oluştur
   */
  public async createTenant(config: Omit<TenantConfig, 'createdAt'>): Promise<void> {
    const tenant: TenantConfig = {
      ...config,
      createdAt: new Date()
    };

    TENANT_REGISTRY.set(config.subdomain, tenant);
    
    // Burada yeni database oluşturulması ve schema migration işlemleri yapılacak
    console.log(`Created new tenant: ${config.name} (${config.subdomain})`);
  }

  /**
   * Tenant'ı deaktif et
   */
  public deactivateTenant(subdomain: string): void {
    const tenant = TENANT_REGISTRY.get(subdomain);
    if (tenant) {
      tenant.isActive = false;
      // Connection'ları temizle
      this.closeConnections(subdomain);
    }
  }

  /**
   * Tenant connection'ları kapat
   */
  public closeConnections(tenantId: string): void {
    const pool = connectionPools.get(tenantId);
    if (pool) {
      pool.end();
      connectionPools.delete(tenantId);
      drizzleInstances.delete(tenantId);
    }
  }

  /**
   * Tüm aktif tenant'ları listele
   */
  public getActiveTenants(): TenantConfig[] {
    return Array.from(TENANT_REGISTRY.values()).filter(t => t.isActive);
  }

  /**
   * Tenant'ın database'inin health check'i
   */
  public async healthCheck(tenantId: string): Promise<boolean> {
    try {
      const db = await this.getDatabaseConnection(tenantId);
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error(`Health check failed for tenant ${tenantId}:`, error);
      return false;
    }
  }
}

// Singleton instance export
export const tenantManager = TenantManager.getInstance();

// TenantRequest interface'i tenant-middleware.ts'de tanımlanacak