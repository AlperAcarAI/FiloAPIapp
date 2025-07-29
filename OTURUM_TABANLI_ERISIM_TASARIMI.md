# Oturum Tabanlı Erişim Kontrolü Tasarımı

## Konsept Analizi

**Kullanıcı Önerisi:** Arayüzde kişi oturum açtığında personel ID, şantiye ID, pozisyon ID bilgilerini tutup API'lerle ilişkilendirme

## Avantajları

### ✅ Güvenlik Avantajları
- **Kimlik Doğrulama:** Her kullanıcı kendi personel kimliğiyle oturum açar
- **Otomatik Filtreleme:** API'ler kullanıcının yetkisine göre otomatik filtreler
- **Audit Trail:** Hangi personelin ne yaptığı tam olarak izlenir
- **Session Bazlı:** Oturum sonlandığında erişim kesilir

### ✅ Kullanılabilirlik Avantajları
- **Kolay Giriş:** Personel sadece kullanıcı adı/şifre ile giriş yapar
- **Otomatik Kısıtlama:** Manuel API key yönetimi gereksiz
- **Personalize Deneyim:** Kullanıcı kendi verilerini görür
- **Role-Based UI:** Pozisyona göre arayüz özelleştirilebilir

## Teknik Tasarım

### 1. Oturum Veri Yapısı

```javascript
// User Session Object
{
  userId: 123,
  personnelId: 456,
  workAreaId: 2,
  positionId: 15,
  permissions: ["data:read", "fleet:read", "personnel:read"],
  companyId: 1,
  loginTime: "2025-01-29T15:30:00Z",
  lastActivity: "2025-01-29T16:45:00Z",
  sessionToken: "sess_xyz789abc"
}
```

### 2. Database Schema Güncellemeleri

#### A) Users Tablosuna Personnel Referansı
```sql
-- Mevcut users tablosuna personnel bağlantısı
ALTER TABLE users 
ADD COLUMN personnel_id INTEGER REFERENCES personnel(id);

-- Unique constraint - her personel sadece bir user hesabı
ALTER TABLE users
ADD CONSTRAINT users_personnel_unique UNIQUE (personnel_id);
```

#### B) Session Storage Güncellemesi
```sql
-- Session tablosuna kullanıcı context bilgileri
ALTER TABLE sessions
ADD COLUMN user_context JSONB DEFAULT NULL;

-- Örnek session data:
{
  "personnelId": 456,
  "workAreaId": 2, 
  "positionId": 15,
  "permissions": ["data:read", "fleet:read"],
  "companyId": 1
}
```

### 3. Authentication Middleware Güncellemesi

```javascript
// Oturum bazlı kimlik doğrulama
export const authenticateSession = async (req, res, next) => {
  try {
    const sessionId = req.session.id;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Oturum açmanız gerekiyor'
      });
    }

    // Kullanıcı ve personel bilgilerini al
    const userWithPersonnel = await db.select({
      userId: users.id,
      username: users.username,
      personnelId: personnel.id,
      personnelName: personnel.name,
      personnelSurname: personnel.surname,
      workAreaId: personnelWorkAreas.workAreaId,
      positionId: personnelWorkAreas.positionId,
      companyId: workAreas.companyId
    })
    .from(users)
    .innerJoin(personnel, eq(users.personnelId, personnel.id))
    .innerJoin(personnelWorkAreas, eq(personnel.id, personnelWorkAreas.personnelId))
    .innerJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
    .where(and(
      eq(users.id, userId),
      eq(personnelWorkAreas.isActive, true)
    ))
    .limit(1);

    if (!userWithPersonnel.length) {
      return res.status(401).json({
        success: false,
        error: 'PERSONNEL_NOT_FOUND',
        message: 'Personel bilgileri bulunamadı'
      });
    }

    // Request objesine kullanıcı context'ini ekle
    req.userContext = userWithPersonnel[0];
    
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
```

### 4. API Endpoint'lerinin Güncellenmesi

#### A) Personnel Listesi (Otomatik Filtreleme)
```javascript
app.get('/api/personnel', authenticateSession, async (req, res) => {
  try {
    const { workAreaId, positionId } = req.userContext;
    
    // Kullanıcı sadece kendi çalışma alanındaki personeli görebilir
    const personnelList = await db.select()
      .from(personnel)
      .innerJoin(personnelWorkAreas, eq(personnel.id, personnelWorkAreas.personnelId))
      .where(and(
        eq(personnelWorkAreas.workAreaId, workAreaId),
        eq(personnel.isActive, true),
        eq(personnelWorkAreas.isActive, true)
      ));

    res.json({
      success: true,
      data: personnelList,
      userContext: {
        workArea: workAreaId,
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

#### B) Assets Listesi (Çalışma Alanı Filtreli)
```javascript
app.get('/api/assets', authenticateSession, async (req, res) => {
  try {
    const { workAreaId, personnelId } = req.userContext;
    
    // Kullanıcının çalışma alanındaki araçlar + kendisine atanan araçlar
    const assets = await db.select({
      id: assets.id,
      plateNumber: assets.plateNumber,
      modelName: carModels.name,
      brandName: carBrands.name,
      isAssignedToMe: sql`CASE WHEN apa.personnel_id = ${personnelId} THEN true ELSE false END`
    })
    .from(assets)
    .leftJoin(assetsPersonelAssignment, eq(assets.id, assetsPersonelAssignment.assetId))
    .leftJoin(carModels, eq(assets.modelId, carModels.id))
    .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
    .where(and(
      or(
        eq(assets.currentWorkAreaId, workAreaId), // Çalışma alanındaki araçlar
        eq(assetsPersonelAssignment.personnelId, personnelId) // Kendisine atanan
      ),
      eq(assets.isActive, true)
    ));

    res.json({
      success: true,
      data: assets,
      userContext: {
        workArea: workAreaId,
        myAssets: assets.filter(a => a.isAssignedToMe).length,
        totalAssets: assets.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_ERROR', 
      message: 'Araç listesi alınamadı'
    });
  }
});
```

### 5. Frontend Session Management

#### A) Login Sonrası Context Yükleme
```jsx
// hooks/useUserContext.ts
export function useUserContext() {
  const [userContext, setUserContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserContext();
  }, []);

  const fetchUserContext = async () => {
    try {
      const response = await apiRequest('/api/auth/context');
      setUserContext(response.data);
    } catch (error) {
      console.error('Context yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  return { userContext, loading, refreshContext: fetchUserContext };
}
```

#### B) Personalize Dashboard
```jsx
// pages/Dashboard.tsx
function Dashboard() {
  const { userContext } = useUserContext();
  
  if (!userContext) return <div>Yükleniyor...</div>;

  return (
    <div className="p-6">
      {/* Kullanıcı Bilgileri */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Hoş Geldiniz, {userContext.personnelName} {userContext.personnelSurname}
          </CardTitle>
          <CardDescription>
            {userContext.positionName} - {userContext.workAreaName}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Kişiselleştirilmiş Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Çalışma Alanınızdaki Personel</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonnelSummary workAreaId={userContext.workAreaId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Size Atanan Araçlar</CardTitle>
          </CardHeader>
          <CardContent>
            <MyAssets personnelId={userContext.personnelId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yakıt Kayıtlarınız</CardTitle>
          </CardHeader>
          <CardContent>
            <MyFuelRecords personnelId={userContext.personnelId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 6. Yetkilendirme Seviyeleri

#### Pozisyon Bazlı Yetkiler
```javascript
const POSITION_PERMISSIONS = {
  'Şantiye Şefi': ['data:read', 'data:write', 'personnel:read', 'fleet:read', 'fleet:write'],
  'İş Makinesi Operatörü': ['data:read', 'fleet:read', 'fuel:write'],
  'Şoför': ['data:read', 'fleet:read', 'fuel:write'],
  'Güvenlik Görevlisi': ['data:read', 'personnel:read'],
  'Muhasebe': ['data:read', 'data:write', 'finance:read', 'finance:write']
};

// Middleware'de pozisyon kontrolü
export const checkPositionPermission = (requiredPermission) => {
  return (req, res, next) => {
    const { positionName } = req.userContext;
    const permissions = POSITION_PERMISSIONS[positionName] || [];
    
    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSION',
        message: `Bu işlem için ${requiredPermission} yetkisi gerekli`
      });
    }
    
    next();
  };
};
```

## İmplementasyon Adımları

### Aşama 1: Database Schema (1 saat)
1. Users tablosuna personnel_id ekleme
2. Unique constraint ekleme
3. Test kullanıcıları oluşturma

### Aşama 2: Authentication Sistemi (2 saat)
1. Session middleware güncelleme
2. User context middleware yazma
3. Login endpoint'i güncelleme

### Aşama 3: API Endpoint'leri (2 saat)
1. Mevcut API'lere session bazlı filtreleme
2. Context API endpoint'i (/api/auth/context)
3. Yetki kontrolü middleware'leri

### Aşama 4: Frontend Entegrasyonu (2 saat)
1. useUserContext hook'u
2. Dashboard kişiselleştirmesi
3. Navigation güncelleme

### Aşama 5: Test ve Güvenlik (1 saat)
1. Senaryo testleri
2. Güvenlik testleri
3. Performance testleri

## Örnek Kullanım Senaryosu

```javascript
// Ahmet (Şantiye Şefi) oturum açtığında:
{
  personnelId: 15,
  workAreaId: 2,
  positionId: 1, // Şantiye Şefi
  permissions: ["data:read", "data:write", "personnel:read", "fleet:read", "fleet:write"]
}

// GET /api/personnel → Sadece 2 numaralı çalışma alanındaki personeller
// GET /api/assets → Çalışma alanı 2'deki araçlar + kendisine atanan araçlar
// POST /api/fuel-records → Sadece kendi yetki alanındaki araçlara yakıt kaydı
```

## Güvenlik Özellikleri

1. **Session Timeout:** 8 saat inaktivite sonrası otomatik çıkış
2. **IP Binding:** Session IP adresi ile eşleşmezse geçersiz
3. **Concurrent Session Control:** Aynı kullanıcı max 2 oturum
4. **Audit Logging:** Tüm işlemler personel ID ile loglanır
5. **Role-Based Access:** Pozisyon bazlı API erişim kontrolü

## Sonuç

Bu yaklaşım **%100 kullanıcı dostu** ve **%100 güvenli** bir sistem sağlar:

- Kullanıcılar sadece username/password ile giriş yapar
- Sistem otomatik olarak yetkilerini belirler
- API'ler kullanıcının kim olduğunu bilir ve ona göre filtreler
- Her işlem kişiye özel audit trail oluşturur
- Zero-configuration: Manuel API key yönetimi yok

**Toplam Geliştirme Süresi:** ~8 saat
**Kullanıcı Deneyimi:** Mükemmel
**Güvenlik Seviyesi:** Maksimum