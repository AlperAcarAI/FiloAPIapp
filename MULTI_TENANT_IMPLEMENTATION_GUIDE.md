# Multi-Tenant Implementation Guide (29 Ocak 2025)

## 🔧 AŞAMA 1: Database Schema Değişiklikleri

### 1.1 Tenants Tablosu Oluşturma
```sql
-- Ana tenant tablosu
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                    -- "ABC Lojistik Ltd."
  subdomain VARCHAR(50) UNIQUE NOT NULL,         -- "abc-lojistik" 
  domain VARCHAR(100),                           -- Özel domain: "lojistik.abc.com"
  subscription_plan VARCHAR(20) DEFAULT 'basic', -- "basic", "premium", "enterprise"
  max_users INTEGER DEFAULT 10,                  -- Plan bazlı sınırlar
  max_assets INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Tenant özel ayarları (JSON)
  settings JSONB DEFAULT '{}',
  
  -- Billing bilgileri
  billing_email VARCHAR(100),
  subscription_expires_at TIMESTAMP,
  
  -- Branding (white-label için)
  logo_url VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#1f2937',
  company_name VARCHAR(100)                      -- Özelleştirilebilir şirket adı
);

-- Indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_active ON tenants(is_active);
```

### 1.2 Mevcut Tablolara tenant_id Ekleme
```sql
-- 1. Companies tablosuna tenant_id ekle
ALTER TABLE companies ADD COLUMN tenant_id INTEGER;
ALTER TABLE companies ADD CONSTRAINT fk_companies_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_companies_tenant ON companies(tenant_id);

-- 2. Users tablosuna tenant_id ekle  
ALTER TABLE users ADD COLUMN tenant_id INTEGER;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- 3. Assets tablosuna tenant_id ekle
ALTER TABLE assets ADD COLUMN tenant_id INTEGER;
ALTER TABLE assets ADD CONSTRAINT fk_assets_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_assets_tenant ON assets(tenant_id);

-- 4. Personnel tablosuna tenant_id ekle
ALTER TABLE personnel ADD COLUMN tenant_id INTEGER;
ALTER TABLE personnel ADD CONSTRAINT fk_personnel_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_personnel_tenant ON personnel(tenant_id);

-- 5. Fuel_records tablosuna tenant_id ekle
ALTER TABLE fuel_records ADD COLUMN tenant_id INTEGER;  
ALTER TABLE fuel_records ADD CONSTRAINT fk_fuel_records_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_fuel_records_tenant ON fuel_records(tenant_id);

-- 6. Work_areas tablosuna tenant_id ekle
ALTER TABLE work_areas ADD COLUMN tenant_id INTEGER;
ALTER TABLE work_areas ADD CONSTRAINT fk_work_areas_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_work_areas_tenant ON work_areas(tenant_id);

-- Diğer tüm ana tablolar için aynı işlem...
```

### 1.3 Mevcut Veriyi İlk Tenant'a Ata
```sql
-- İlk tenant oluştur (mevcut müşteri)
INSERT INTO tenants (name, subdomain, subscription_plan, is_active)
VALUES ('Mevcut Şirket', 'demo', 'enterprise', true);

-- Mevcut tüm veriyi bu tenant'a ata
UPDATE companies SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;  
UPDATE assets SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE personnel SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE fuel_records SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE work_areas SET tenant_id = 1 WHERE tenant_id IS NULL;

-- NOT NULL constraint ekle (veri ataması sonrası)
ALTER TABLE companies ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE assets ALTER COLUMN tenant_id SET NOT NULL;
-- Diğerleri için de aynı...
```

## 🔐 AŞAMA 2: Backend Multi-Tenant Middleware

### 2.1 Tenant Context Middleware
```typescript
// server/tenant-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface TenantRequest extends Request {
  tenantId?: number;
  tenant?: any;
}

export const tenantMiddleware = async (
  req: TenantRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    let tenantId: number | null = null;
    
    // 1. Subdomain'den tenant belirleme
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'api') {
      const tenant = await db.select()
        .from(tenants)
        .where(eq(tenants.subdomain, subdomain))
        .where(eq(tenants.is_active, true))
        .limit(1);
      
      if (tenant.length) {
        tenantId = tenant[0].id;
        req.tenant = tenant[0];
      }
    }
    
    // 2. Header'dan tenant ID alma (API için)
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = parseInt(req.headers['x-tenant-id'] as string);
    }
    
    // 3. JWT token'dan tenant ID alma
    if (!tenantId && req.user && (req.user as any).tenantId) {
      tenantId = (req.user as any).tenantId;
    }
    
    // 4. Default tenant (development/demo için)
    if (!tenantId) {
      tenantId = 1; // Demo tenant
    }
    
    // Tenant'ın aktif olup olmadığını kontrol et
    if (!req.tenant) {
      const tenant = await db.select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .where(eq(tenants.is_active, true))
        .limit(1);
      
      if (!tenant.length) {
        return res.status(403).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Geçersiz tenant veya deaktif hesap'
        });
      }
      
      req.tenant = tenant[0];
    }
    
    req.tenantId = tenantId;
    next();
    
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_ERROR',
      message: 'Tenant doğrulama hatası'
    });
  }
};
```

### 2.2 Storage Interface Güncelleme
```typescript
// server/storage.ts - Multi-tenant versiyonu
export class DatabaseStorage implements IStorage {
  
  // Tüm metodlara tenantId parameter eklenir
  async getAssets(tenantId: number, filters?: any): Promise<Asset[]> {
    const query = db.select()
      .from(assets)
      .where(eq(assets.tenant_id, tenantId));  // ZORUNLU FILTER!
    
    // Diğer filtreler...
    if (filters?.companyId) {
      query.where(eq(assets.company_id, filters.companyId));
    }
    
    return await query;
  }
  
  async createAsset(tenantId: number, assetData: InsertAsset): Promise<Asset> {
    // Tenant ID otomatik eklenir
    const [asset] = await db.insert(assets)
      .values({
        ...assetData,
        tenant_id: tenantId  // ZORUNLU ALAN!
      })
      .returning();
    return asset;
  }
  
  async getPersonnel(tenantId: number): Promise<Personnel[]> {
    return await db.select()
      .from(personnel)
      .where(eq(personnel.tenant_id, tenantId));  // TENANT İZOLASYONU!
  }
  
  // Tüm diğer metodlar aynı pattern'i takip eder...
}
```

### 2.3 Route'ları Güncelleme
```typescript
// server/routes.ts - Multi-tenant API'ler
import { tenantMiddleware, TenantRequest } from './tenant-middleware';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Tüm API'lere tenant middleware ekle
  app.use('/api', tenantMiddleware);
  
  // Asset API'leri - Tenant izolasyonlu 
  app.get('/api/backend/assets', authenticateJWT, async (req: TenantRequest, res) => {
    try {
      const tenantId = req.tenantId!;
      const assets = await storage.getAssets(tenantId, req.query);
      
      res.json({
        success: true,
        data: assets,
        tenantInfo: {
          tenantId,
          tenantName: req.tenant?.name
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Asset verileri alınamadı'
      });
    }
  });
  
  // Personnel API'leri - Tenant izolasyonlu
  app.get('/api/backend/personnel', authenticateJWT, async (req: TenantRequest, res) => {
    const tenantId = req.tenantId!;
    const personnel = await storage.getPersonnel(tenantId);
    
    res.json({
      success: true,
      data: personnel,
      message: `${req.tenant?.name} personel listesi`
    });
  });
  
  // Fuel Records - Tenant izolasyonlu
  app.get('/api/backend/fuel-records', authenticateJWT, async (req: TenantRequest, res) => {
    const tenantId = req.tenantId!;
    const fuelRecords = await storage.getFuelRecords(tenantId, req.query);
    
    res.json({
      success: true,
      data: fuelRecords
    });
  });
  
  // Work Areas - Tenant izolasyonlu
  app.get('/api/backend/work-areas', authenticateJWT, async (req: TenantRequest, res) => {
    const tenantId = req.tenantId!;
    const workAreas = await storage.getWorkAreas(tenantId);
    
    res.json({
      success: true,
      data: workAreas
    });
  });
  
  return httpServer;
}
```

## 🌐 AŞAMA 3: Frontend Multi-Tenant Desteği

### 3.1 Tenant Context Hook
```typescript
// client/src/hooks/useTenant.ts
import { useQuery } from '@tanstack/react-query';

export function useTenant() {
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['/api/tenant/info'],
    retry: false,
  });

  return {
    tenant,
    isLoading,
    tenantId: tenant?.id,
    tenantName: tenant?.name,
    tenantLogo: tenant?.logo_url,
    tenantColors: {
      primary: tenant?.primary_color || '#1f2937'
    }
  };
}
```

### 3.2 Branding Component
```typescript
// client/src/components/TenantBranding.tsx
import { useTenant } from '@/hooks/useTenant';

export function TenantBranding() {
  const { tenant, tenantLogo, tenantColors } = useTenant();
  
  return (
    <div className="tenant-branding" style={{
      '--primary-color': tenantColors.primary
    }}>
      {tenantLogo && (
        <img src={tenantLogo} alt={tenant?.name} className="h-8 w-auto" />
      )}
      <h1 style={{ color: tenantColors.primary }}>
        {tenant?.company_name || tenant?.name}
      </h1>
    </div>
  );
}
```

## 🚀 AŞAMA 4: Deployment ve URL Yapısı

### 4.1 Subdomain Yönlendirmesi (Nginx)
```nginx
# /etc/nginx/sites-available/fleetmanager
server {
    listen 80;
    server_name *.fleetmanager.com fleetmanager.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 URL Yapısı Örnekleri
```
https://demo.fleetmanager.com           → Demo tenant
https://abc-lojistik.fleetmanager.com   → ABC Lojistik tenant
https://xyz-tasima.fleetmanager.com     → XYZ Taşıma tenant
https://api.fleetmanager.com/api/...    → API endpoint'leri
```

## 📊 AŞAMA 5: Monitoring ve Analytics

### 5.1 Tenant Bazlı İstatistikler
```typescript
// Tenant kullanım metrikleri
app.get('/api/admin/tenant-stats', async (req, res) => {
  const stats = await db.select({
    tenantId: tenants.id,
    tenantName: tenants.name,
    userCount: sql`COUNT(DISTINCT users.id)`,
    assetCount: sql`COUNT(DISTINCT assets.id)`,
    lastActivity: sql`MAX(users.last_login_at)`
  })
  .from(tenants)
  .leftJoin(users, eq(users.tenant_id, tenants.id))
  .leftJoin(assets, eq(assets.tenant_id, tenants.id))
  .groupBy(tenants.id, tenants.name);
  
  res.json({ success: true, data: stats });
});
```

## 🎯 BAŞLANGIÇ ADIMI: Hemen Uygulanabilir

Bu tasarımı hemen uygulamaya başlamak için hangi aşamadan başlamak istersiniz?

1. **Database Migration** - Tenant tablosu ve mevcut tablolara tenant_id eklenmesi
2. **Backend Middleware** - Tenant izolasyonu ve güvenlik katmanları  
3. **API Güncelleme** - Mevcut API'lerin multi-tenant uyumlu hale getirilmesi
4. **Frontend Adaptation** - Tenant branding ve context yönetimi

Bu implementasyon ile 2-3 hafta içinde multi-tenant sisteminiz hazır olur!