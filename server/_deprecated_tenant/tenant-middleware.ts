import { Request, Response, NextFunction } from 'express';
import { tenantManager } from './tenant-manager.js';
import type { TenantConfig } from './tenant-manager.js';

// TenantRequest interface'ini burada tanımla - SecurityRequest'ten miras alacak şekilde
export interface TenantRequest extends Request {
  tenant?: TenantConfig;
  db?: any;
  security?: {
    deviceFingerprint?: string;
    riskScore?: number;
  };
}

/**
 * Tenant routing middleware
 * Host header'dan subdomain'i extract eder ve tenant bilgisini request'e ekler
 */
export function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const subdomain = tenantManager.extractSubdomain(host);
    
    if (!subdomain) {
      // If no subdomain found, default to 'demo' for development
      const defaultSubdomain = 'demo';
      const defaultTenant = tenantManager.getTenantFromSubdomain(defaultSubdomain);
      if (defaultTenant) {
        req.tenant = defaultTenant;
        next();
        return;
      }
      
      return res.status(400).json({
        success: false,
        error: 'INVALID_TENANT',
        message: 'Geçerli bir tenant bulunamadı. Lütfen doğru subdomain kullanın.'
      });
    }

    const tenant = tenantManager.getTenantFromSubdomain(subdomain);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: `Tenant bulunamadı: ${subdomain}`
      });
    }

    if (!tenant.isActive) {
      return res.status(403).json({
        success: false,
        error: 'TENANT_INACTIVE',
        message: 'Bu tenant şu anda aktif değil.'
      });
    }

    // Tenant bilgisini request'e ekle
    req.tenant = tenant;
    
    console.log(`[TENANT] ${req.method} ${req.path} - Tenant: ${tenant.name} (${tenant.subdomain})`);
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_ERROR',
      message: 'Tenant bilgisi alınırken hata oluştu.'
    });
  }
}

/**
 * Database connection middleware
 * Tenant'a özgü database connection'ını request'e ekler
 */
export async function tenantDatabaseMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        error: 'NO_TENANT',
        message: 'Tenant bilgisi bulunamadı.'
      });
    }

    // Tenant-specific database connection'ı al
    const db = await tenantManager.getDatabaseConnection(req.tenant.id);
    req.db = db;
    
    next();
  } catch (error) {
    console.error('Tenant database middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_CONNECTION_ERROR',
      message: 'Veritabanı bağlantısı kurulamadı.'
    });
  }
}

/**
 * Admin-only middleware - sadece özel tenant'lar için
 */
export function adminTenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      error: 'NO_TENANT',
      message: 'Tenant bilgisi bulunamadı.'
    });
  }

  // Admin tenant kontrolü (örn: admin.yourdomain.com)
  if (req.tenant.subdomain !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'ADMIN_ONLY',
      message: 'Bu endpoint sadece admin tenant için kullanılabilir.'
    });
  }

  next();
}

/**
 * Tenant health check endpoint
 */
export async function tenantHealthCheck(req: TenantRequest, res: Response) {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        error: 'NO_TENANT',
        message: 'Tenant bilgisi bulunamadı.'
      });
    }

    const isHealthy = await tenantManager.healthCheck(req.tenant.id);
    
    res.json({
      success: true,
      data: {
        tenant: {
          id: req.tenant.id,
          name: req.tenant.name,
          subdomain: req.tenant.subdomain,
          isActive: req.tenant.isActive
        },
        database: {
          healthy: isHealthy,
          checkedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Tenant health check error:', error);
    res.status(500).json({
      success: false,
      error: 'HEALTH_CHECK_ERROR',
      message: 'Health check yapılamadı.'
    });
  }
}