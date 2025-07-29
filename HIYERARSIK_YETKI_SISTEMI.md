# Hiyerarşik Yetkilendirme Sistemi Tasarımı

## Yönetim Kademelerine Göre Erişim Seviyeleri

### 1. Erişim Seviyesi Tanımları

#### 🏗️ Şantiye Seviyesi (Worksite Level)
- **Hedef Kullanıcılar:** Şantiye şefi, operatör, şoför, güvenlik
- **Erişim Kapsamı:** Sadece kendi şantiyesi
- **Örnek:** X şantiyesi şoförü → Sadece X şantiyesindeki araçlar

#### 🏢 Bölge Seviyesi (Regional Level)  
- **Hedef Kullanıcılar:** Bölge müdürü, bölge mühendisi
- **Erişim Kapsamı:** Birden fazla şantiye (bölge bazlı)
- **Örnek:** İstanbul Bölge Müdürü → İstanbul'daki tüm şantiyeler

#### 🏛️ Genel Müdürlük (Corporate Level)
- **Hedef Kullanıcılar:** Genel müdür, İK müdürü, Mali işler müdürü
- **Erişim Kapsamı:** Tüm şantiyeler, tüm bölgeler
- **Örnek:** Genel Müdür → Tüm şirket verileri

#### 🔧 Departman Bazlı (Department Level)
- **Hedef Kullanıcılar:** Muhasebe, İK, Satın alma uzmanları
- **Erişim Kapsamı:** Departman yetkisine göre tüm lokasyonlar
- **Örnek:** Muhasebe Uzmanı → Tüm şantiyelerin finansal verileri

## Database Schema Güncellemeleri

### 1. Access Levels Tablosu
```sql
CREATE TABLE access_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  hierarchy_level INTEGER NOT NULL, -- 1=Şantiye, 2=Bölge, 3=Genel, 4=Departman
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Örnek veriler
INSERT INTO access_levels (name, code, hierarchy_level, description) VALUES
('Şantiye Seviyesi', 'WORKSITE', 1, 'Sadece kendi şantiyesine erişim'),
('Bölge Seviyesi', 'REGIONAL', 2, 'Bölgedeki tüm şantiyelere erişim'),
('Genel Müdürlük', 'CORPORATE', 3, 'Tüm şirket verilerine erişim'),
('Departman Bazlı', 'DEPARTMENT', 4, 'Departman yetkisine göre erişim');
```

### 2. User Access Rights Tablosu
```sql
CREATE TABLE user_access_rights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  access_level_id INTEGER NOT NULL REFERENCES access_levels(id),
  
  -- Flexible access scope (JSON format)
  access_scope JSONB NOT NULL DEFAULT '{}',
  
  -- Examples of access_scope:
  -- Şantiye seviyesi: {"work_area_ids": [2]}
  -- Bölge seviyesi: {"work_area_ids": [1,2,3,4], "region": "İstanbul"}
  -- Genel müdürlük: {"all_access": true}
  -- Departman bazlı: {"department": "muhasebe", "all_worksites": true}
  
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### 3. Users Tablosu Güncelleme
```sql
ALTER TABLE users 
ADD COLUMN personnel_id INTEGER REFERENCES personnel(id),
ADD COLUMN department VARCHAR(50), -- 'muhasebe', 'ik', 'satin_alma', 'operasyon'
ADD COLUMN position_level INTEGER DEFAULT 1; -- 1=Personel, 2=Şef, 3=Müdür, 4=Genel Müdür

-- Unique constraint
ALTER TABLE users
ADD CONSTRAINT users_personnel_unique UNIQUE (personnel_id);
```

## Authentication Middleware Güncelleme

```javascript
export const authenticateSessionWithHierarchy = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Oturum açmanız gerekiyor'
      });
    }

    // Kullanıcının erişim haklarını al
    const userWithAccess = await db.select({
      userId: users.id,
      username: users.username,
      department: users.department,
      positionLevel: users.positionLevel,
      personnelId: users.personnelId,
      personnelName: personnel.name,
      personnelSurname: personnel.surname,
      
      // Access rights
      accessLevel: accessLevels.code,
      hierarchyLevel: accessLevels.hierarchyLevel,
      accessScope: userAccessRights.accessScope,
      
      // Current worksite (if personnel level)
      currentWorkAreaId: personnelWorkAreas.workAreaId,
      currentPositionId: personnelWorkAreas.positionId
    })
    .from(users)
    .leftJoin(personnel, eq(users.personnelId, personnel.id))
    .leftJoin(userAccessRights, and(
      eq(users.id, userAccessRights.userId),
      eq(userAccessRights.isActive, true)
    ))
    .leftJoin(accessLevels, eq(userAccessRights.accessLevelId, accessLevels.id))
    .leftJoin(personnelWorkAreas, and(
      eq(personnel.id, personnelWorkAreas.personnelId),
      eq(personnelWorkAreas.isActive, true)
    ))
    .where(eq(users.id, userId))
    .limit(1);

    if (!userWithAccess.length) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Kullanıcı bilgileri bulunamadı'
      });
    }

    const userContext = userWithAccess[0];
    
    // Erişim kapsamını hesapla
    userContext.allowedWorkAreaIds = calculateAllowedWorkAreas(userContext);
    userContext.permissions = calculatePermissions(userContext);
    
    req.userContext = userContext;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Kimlik doğrulama hatası'
    });
  }
};

// Erişim kapsamını hesapla
function calculateAllowedWorkAreas(userContext) {
  const { accessLevel, accessScope, currentWorkAreaId } = userContext;
  
  switch (accessLevel) {
    case 'WORKSITE':
      // Sadece kendi şantiyesi
      return currentWorkAreaId ? [currentWorkAreaId] : [];
      
    case 'REGIONAL':
      // accessScope'tan work_area_ids'i al
      return accessScope?.work_area_ids || [];
      
    case 'CORPORATE':
    case 'DEPARTMENT':
      // Tüm şantiyelere erişim (null = all access)
      return null;
      
    default:
      return [];
  }
}

// İzinleri hesapla
function calculatePermissions(userContext) {
  const { accessLevel, department, positionLevel } = userContext;
  
  const basePermissions = ['data:read'];
  
  switch (accessLevel) {
    case 'WORKSITE':
      if (positionLevel >= 2) { // Şef seviyesi ve üstü
        return [...basePermissions, 'data:write', 'personnel:read', 'fleet:read', 'fleet:write'];
      }
      return [...basePermissions, 'fleet:read', 'fuel:write'];
      
    case 'REGIONAL':
      return [...basePermissions, 'data:write', 'personnel:read', 'personnel:write', 
              'fleet:read', 'fleet:write', 'reports:read'];
      
    case 'CORPORATE':
      return ['*']; // Tüm izinler
      
    case 'DEPARTMENT':
      switch (department) {
        case 'muhasebe':
          return [...basePermissions, 'finance:read', 'finance:write', 'reports:read'];
        case 'ik':
          return [...basePermissions, 'personnel:read', 'personnel:write', 'reports:read'];
        case 'satin_alma':
          return [...basePermissions, 'assets:read', 'assets:write', 'finance:read'];
        default:
          return basePermissions;
      }
      
    default:
      return basePermissions;
  }
}
```

## API Endpoint'leri Güncelleme

### Personnel Listesi (Hiyerarşik Filtreleme)
```javascript
app.get('/api/personnel', authenticateSessionWithHierarchy, async (req, res) => {
  try {
    const { allowedWorkAreaIds, accessLevel } = req.userContext;
    
    let query = db.select({
      id: personnel.id,
      name: personnel.name,
      surname: personnel.surname,
      workAreaName: workAreas.name,
      positionName: personnelPositions.name
    })
    .from(personnel)
    .innerJoin(personnelWorkAreas, eq(personnel.id, personnelWorkAreas.personnelId))
    .innerJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
    .innerJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
    .where(and(
      eq(personnel.isActive, true),
      eq(personnelWorkAreas.isActive, true)
    ));

    // Hiyerarşik filtreleme
    if (allowedWorkAreaIds !== null) { // null = all access
      query = query.where(inArray(workAreas.id, allowedWorkAreaIds));
    }

    const personnelList = await query;

    res.json({
      success: true,
      data: personnelList,
      userContext: {
        accessLevel,
        filteredByWorkAreas: allowedWorkAreaIds,
        totalPersonnel: personnelList.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_ERROR',
      message: 'Personel listesi alınamadı'
    });
  }
});
```

## Frontend Implementasyonu

### User Context Hook
```jsx
// hooks/useUserContext.ts
export function useUserContext() {
  const [userContext, setUserContext] = useState(null);
  
  const fetchUserContext = async () => {
    try {
      const response = await apiRequest('/api/auth/context');
      setUserContext(response.data);
    } catch (error) {
      console.error('Context yüklenemedi:', error);
    }
  };

  // Access level bazlı yetkiler
  const hasPermission = (permission) => {
    if (!userContext) return false;
    return userContext.permissions.includes('*') || 
           userContext.permissions.includes(permission);
  };

  const canAccessWorkArea = (workAreaId) => {
    if (!userContext) return false;
    if (userContext.allowedWorkAreaIds === null) return true; // Corporate access
    return userContext.allowedWorkAreaIds.includes(workAreaId);
  };

  return { 
    userContext, 
    hasPermission, 
    canAccessWorkArea,
    refreshContext: fetchUserContext 
  };
}
```

### Hiyerarşik Dashboard
```jsx
// pages/Dashboard.tsx
function Dashboard() {
  const { userContext, hasPermission } = useUserContext();
  
  if (!userContext) return <div>Yükleniyor...</div>;

  const renderAccessLevelBadge = () => {
    const badges = {
      'WORKSITE': { color: 'blue', text: 'Şantiye Seviyesi' },
      'REGIONAL': { color: 'green', text: 'Bölge Seviyesi' },
      'CORPORATE': { color: 'purple', text: 'Genel Müdürlük' },
      'DEPARTMENT': { color: 'orange', text: 'Departman Bazlı' }
    };
    
    const badge = badges[userContext.accessLevel] || badges.WORKSITE;
    
    return (
      <Badge variant="outline" className={`bg-${badge.color}-100 text-${badge.color}-700`}>
        {badge.text}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      {/* Kullanıcı Bilgileri */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Hoş Geldiniz, {userContext.personnelName} {userContext.personnelSurname}
              </CardTitle>
              <CardDescription>
                {userContext.department && `${userContext.department} Departmanı`}
              </CardDescription>
            </div>
            {renderAccessLevelBadge()}
          </div>
        </CardHeader>
      </Card>

      {/* Access Level'a göre kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Şantiye seviyesi kartları */}
        {userContext.accessLevel === 'WORKSITE' && (
          <>
            <WorksitePersonnelCard workAreaId={userContext.currentWorkAreaId} />
            <MyAssignedAssetsCard personnelId={userContext.personnelId} />
            <MyFuelRecordsCard personnelId={userContext.personnelId} />
          </>
        )}

        {/* Bölge seviyesi kartları */}
        {userContext.accessLevel === 'REGIONAL' && (
          <>
            <RegionalPersonnelCard workAreaIds={userContext.allowedWorkAreaIds} />
            <RegionalAssetsCard workAreaIds={userContext.allowedWorkAreaIds} />
            <RegionalReportsCard workAreaIds={userContext.allowedWorkAreaIds} />
          </>
        )}

        {/* Genel müdürlük kartları */}
        {userContext.accessLevel === 'CORPORATE' && (
          <>
            <CorporateOverviewCard />
            <AllRegionsCard />
            <ExecutiveReportsCard />
          </>
        )}

        {/* Departman bazlı kartları */}
        {userContext.accessLevel === 'DEPARTMENT' && (
          <>
            {userContext.department === 'muhasebe' && <FinancialOverviewCard />}
            {userContext.department === 'ik' && <HROverviewCard />}
            {userContext.department === 'satin_alma' && <ProcurementOverviewCard />}
          </>
        )}
      </div>
    </div>
  );
}
```

## Örnek Kullanım Senaryoları

### 1. Şantiye Şefi (Ahmet)
```javascript
{
  accessLevel: 'WORKSITE',
  allowedWorkAreaIds: [2], // Sadece şantiye 2
  permissions: ['data:read', 'data:write', 'personnel:read', 'fleet:read', 'fleet:write']
}
// Sonuç: Sadece kendi şantiyesindeki verileri görür
```

### 2. İstanbul Bölge Müdürü (Ayşe)
```javascript
{
  accessLevel: 'REGIONAL',
  allowedWorkAreaIds: [1, 2, 3, 4], // İstanbul'daki 4 şantiye
  permissions: ['data:read', 'data:write', 'personnel:read', 'personnel:write', 'fleet:read', 'fleet:write', 'reports:read']
}
// Sonuç: İstanbul bölgesindeki tüm şantiye verilerini görür
```

### 3. Genel Müdür (Mehmet)
```javascript
{
  accessLevel: 'CORPORATE',
  allowedWorkAreaIds: null, // Tüm şantiyeler
  permissions: ['*'] // Tüm izinler
}
// Sonuç: Tüm şirket verilerine erişir
```

### 4. Muhasebe Uzmanı (Fatma)
```javascript
{
  accessLevel: 'DEPARTMENT',
  department: 'muhasebe',
  allowedWorkAreaIds: null, // Tüm şantiyeler
  permissions: ['data:read', 'finance:read', 'finance:write', 'reports:read']
}
// Sonuç: Tüm şantiyelerin finansal verilerini görür
```

## İmplementasyon Süreci

### Aşama 1: Database Schema (2 saat)
1. access_levels tablosu oluşturma
2. user_access_rights tablosu oluşturma  
3. users tablosu güncelleme
4. Test verilerini oluşturma

### Aşama 2: Backend Geliştirme (3 saat)
1. Hiyerarşik authentication middleware
2. calculateAllowedWorkAreas fonksiyonu
3. calculatePermissions fonksiyonu
4. API endpoint'leri güncelleme

### Aşama 3: Frontend Geliştirme (3 saar)
1. useUserContext hook güncelleme
2. Hiyerarşik dashboard komponenti
3. Access level bazlı UI elemanlari

## Sonuç

Bu sistem **tam esneklik** sağlar:

- **Şantiye çalışanı:** Sadece kendi şantiyesi
- **Bölge müdürü:** Bölgesindeki tüm şantiyeler  
- **Genel müdür:** Tüm şirket
- **Departman uzmanı:** Uzmanlık alanına göre tüm lokasyonlar

**Toplam Geliştirme:** ~8 saat
**Esneklik:** Maksimum
**Güvenlik:** Hiyerarşik kontrol