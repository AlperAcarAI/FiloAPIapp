import { Express, Router } from 'express';
import { tenantMiddleware, tenantDatabaseMiddleware, tenantHealthCheck, type TenantRequest } from './tenant-middleware.js';
import { tenantManager } from './tenant-manager.js';
import { authenticateToken } from './auth.js';

const router = Router();

/**
 * Tenant management routes
 */

// Health check endpoint - tenant'a özgü
router.get('/health', tenantMiddleware, tenantHealthCheck);

// Tenant bilgilerini getir
router.get('/info', tenantMiddleware, (req: TenantRequest, res) => {
  res.json({
    success: true,
    data: {
      tenant: {
        id: req.tenant?.id,
        name: req.tenant?.name,
        subdomain: req.tenant?.subdomain,
        isActive: req.tenant?.isActive
      }
    }
  });
});

// Yeni tenant oluştur (sadece admin)
router.post('/create', authenticateToken, async (req: TenantRequest, res) => {
  try {
    const { name, subdomain, databaseUrl } = req.body;
    
    if (!name || !subdomain || !databaseUrl) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Name, subdomain ve databaseUrl zorunlu.'
      });
    }

    // Subdomain benzersizlik kontrolü
    const existingTenant = tenantManager.getTenantFromSubdomain(subdomain);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        error: 'SUBDOMAIN_EXISTS',
        message: 'Bu subdomain zaten kullanımda.'
      });
    }

    await tenantManager.createTenant({
      id: subdomain,
      name,
      subdomain,
      databaseUrl,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tenant başarıyla oluşturuldu.',
      data: {
        tenant: {
          id: subdomain,
          name,
          subdomain,
          isActive: true
        }
      }
    });
  } catch (error) {
    console.error('Tenant creation error:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_CREATION_ERROR',
      message: 'Tenant oluşturulurken hata oluştu.'
    });
  }
});

// Aktif tenant'ları listele (sadmin admin)
router.get('/list', authenticateToken, (req: TenantRequest, res) => {
  try {
    const tenants = tenantManager.getActiveTenants();
    res.json({
      success: true,
      data: {
        tenants: tenants.map(t => ({
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          isActive: t.isActive,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Tenant list error:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_LIST_ERROR',
      message: 'Tenant listesi alınırken hata oluştu.'
    });
  }
});

// Tenant'ı deaktif et (sadece admin)
router.patch('/:subdomain/deactivate', authenticateToken, (req: TenantRequest, res) => {
  try {
    const { subdomain } = req.params;
    
    const tenant = tenantManager.getTenantFromSubdomain(subdomain);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant bulunamadı.'
      });
    }

    tenantManager.deactivateTenant(subdomain);

    res.json({
      success: true,
      message: 'Tenant deaktif edildi.',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          isActive: false
        }
      }
    });
  } catch (error) {
    console.error('Tenant deactivation error:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_DEACTIVATION_ERROR',
      message: 'Tenant deaktif edilirken hata oluştu.'
    });
  }
});

export default router;