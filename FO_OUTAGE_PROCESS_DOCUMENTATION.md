# FO Outage Process Tabloları - Dokümantasyon

## Genel Bakış

Kesinti işlem süreçlerini yönetmek için tasarlanmış 3 tablo:
1. **fo_outage_process** - Ana tablo
2. **fo_outage_process_personnels** - Personel ilişkilendirme tablosu (junction table)
3. **fo_outage_process_assets** - Makine/Araç ilişkilendirme tablosu (junction table)

## Tablo Yapıları

### 1. fo_outage_process (Ana Tablo)

Kesinti işlem süreçlerinin tüm detaylarını saklayan ana tablo.

#### Sütunlar

| Sütun Adı | Veri Tipi | Açıklama | Kısıtlamalar |
|-----------|-----------|----------|--------------|
| `id` | SERIAL | Birincil anahtar | PRIMARY KEY |
| `firm_id` | INTEGER | Kesinti yapan firma | NOT NULL, FK → companies |
| `processor_firm_id` | INTEGER | İşlemi yapan firma | NOT NULL, FK → companies |
| `cause_of_outage` | TEXT | Kesinti nedeni | - |
| `root_build_name` | VARCHAR(255) | Kök bina adı | - |
| `root_build_code` | VARCHAR(100) | Kök bina kodu | - |
| `output_start_point` | VARCHAR(255) | Çıkış başlangıç noktası | - |
| `start_date` | DATE | Başlangıç tarihi | NOT NULL |
| `end_date` | DATE | Bitiş tarihi | - |
| `start_clock` | VARCHAR(8) | Başlangıç saati (HH:MM:SS) | - |
| `end_clock` | VARCHAR(8) | Bitiş saati (HH:MM:SS) | - |
| `area_of_outage` | TEXT | Kesinti alanı | - |
| `supervisor_id` | INTEGER | Denetçi personel | FK → personnel |
| `processor_supervisor` | VARCHAR(255) | İşlemci denetçisi (metin) | - |
| `worker_chef_id` | INTEGER | İşçi şefi | FK → personnel |
| `project_id` | INTEGER | İlişkili proje | FK → projects |
| `pyp` | TEXT | PYP bilgisi | - |
| `created_at` | TIMESTAMP | Oluşturulma zamanı | NOT NULL, DEFAULT NOW() |
| `created_by` | INTEGER | Oluşturan kullanıcı | FK → users |
| `updated_at` | TIMESTAMP | Güncellenme zamanı | NOT NULL, DEFAULT NOW() |
| `updated_by` | INTEGER | Güncelleyen kullanıcı | FK → users |
| `is_active` | BOOLEAN | Aktif durumu | NOT NULL, DEFAULT true |

#### İlişkiler

- `firm_id` → `companies.id` (Kesinti yapan firma)
- `processor_firm_id` → `companies.id` (İşlemi yapan firma)
- `supervisor_id` → `personnel.id` (Denetçi)
- `worker_chef_id` → `personnel.id` (İşçi şefi)
- `project_id` → `projects.id` (Bağlı proje)
- `created_by`, `updated_by` → `users.id` (Audit alanları)

#### İndeksler

- `idx_fo_outage_process_firm` on (firm_id)
- `idx_fo_outage_process_processor_firm` on (processor_firm_id)
- `idx_fo_outage_process_project` on (project_id)
- `idx_fo_outage_process_dates` on (start_date, end_date)
- `idx_fo_outage_process_active` on (is_active)

### 2. fo_outage_process_personnels (Junction Table)

Kesinti işlemine atanan personelleri yöneten ara tablo. Many-to-many ilişki.

#### Sütunlar

| Sütun Adı | Veri Tipi | Açıklama | Kısıtlamalar |
|-----------|-----------|----------|--------------|
| `id` | SERIAL | Birincil anahtar | PRIMARY KEY |
| `outage_process_id` | INTEGER | Kesinti işlem ID | NOT NULL, FK → fo_outage_process, ON DELETE CASCADE |
| `personnel_id` | INTEGER | Personel ID | NOT NULL, FK → personnel |

#### Kısıtlamalar

- `UNIQUE (outage_process_id, personnel_id)` - Bir personel aynı kesinti işleminde bir kez yer alabilir

#### İndeksler

- `idx_fo_outage_personnels_process` on (outage_process_id)
- `idx_fo_outage_personnels_personnel` on (personnel_id)

### 3. fo_outage_process_assets (Junction Table)

Kesinti işleminde kullanılan makine/araçları yöneten ara tablo. Many-to-many ilişki.

#### Sütunlar

| Sütun Adı | Veri Tipi | Açıklama | Kısıtlamalar |
|-----------|-----------|----------|--------------|
| `id` | SERIAL | Birincil anahtar | PRIMARY KEY |
| `outage_process_id` | INTEGER | Kesinti işlem ID | NOT NULL, FK → fo_outage_process, ON DELETE CASCADE |
| `asset_id` | INTEGER | Araç/Makine ID | NOT NULL, FK → assets |

#### Kısıtlamalar

- `UNIQUE (outage_process_id, asset_id)` - Bir araç aynı kesinti işleminde bir kez yer alabilir

#### İndeksler

- `idx_fo_outage_assets_process` on (outage_process_id)
- `idx_fo_outage_assets_asset` on (asset_id)

## TypeScript Tipleri

### Schema Tanımları

```typescript
// Ana tablo tipi
export type FoOutageProcess = typeof foOutageProcess.$inferSelect;

// Insert tipi (ekleme için)
export type InsertFoOutageProcess = z.infer<typeof insertFoOutageProcessSchema>;

// Update tipi (güncelleme için)
export type UpdateFoOutageProcess = z.infer<typeof updateFoOutageProcessSchema>;

// Junction table tipleri
export type FoOutageProcessPersonnel = typeof foOutageProcessPersonnels.$inferSelect;
export type InsertFoOutageProcessPersonnel = z.infer<typeof insertFoOutageProcessPersonnelSchema>;

export type FoOutageProcessAsset = typeof foOutageProcessAssets.$inferSelect;
export type InsertFoOutageProcessAsset = z.infer<typeof insertFoOutageProcessAssetSchema>;
```

### Zod Validation

```typescript
// Insert validation
const insertFoOutageProcessSchema = createInsertSchema(foOutageProcess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
  startClock: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Saat HH:MM:SS formatında olmalıdır").optional(),
  endClock: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Saat HH:MM:SS formatında olmalıdır").optional(),
});

// Update validation (tüm alanlar opsiyonel)
const updateFoOutageProcessSchema = insertFoOutageProcessSchema.partial();
```

## Kullanım Örnekleri

### 1. Yeni Kesinti İşlemi Oluşturma

```typescript
const newOutageProcess: InsertFoOutageProcess = {
  firmId: 1,
  processorFirmId: 2,
  causeOfOutage: "Planlı bakım çalışması",
  rootBuildName: "Ana Transformatör Merkezi",
  rootBuildCode: "TM-001",
  outputStartPoint: "A Bloğu",
  startDate: "2025-10-30",
  endDate: "2025-10-30",
  startClock: "09:00:00",
  endClock: "17:00:00",
  areaOfOutage: "Merkez bölge",
  supervisorId: 5,
  processorSupervisor: "Ahmet Yılmaz",
  workerChefId: 10,
  projectId: 3,
  pyp: "PYP-2025-001",
  createdBy: 1,
  updatedBy: 1,
  isActive: true
};
```

### 2. Personel Ekleme

```typescript
const addPersonnel: InsertFoOutageProcessPersonnel = {
  outageProcessId: 1,
  personnelId: 15
};
```

### 3. Araç/Makine Ekleme

```typescript
const addAsset: InsertFoOutageProcessAsset = {
  outageProcessId: 1,
  assetId: 20
};
```

## Migration Dosyası

Migration dosyası `FiloAPIapp/migrations/create_fo_outage_process_tables.sql` konumundadır.

Çalıştırmak için:
```bash
psql -U username -d database_name -f FiloAPIapp/migrations/create_fo_outage_process_tables.sql
```

## Önemli Notlar

1. **Saat Formatı**: `start_clock` ve `end_clock` alanları VARCHAR(8) olarak tanımlandı ve HH:MM:SS formatında saklanır.

2. **Cascade Silme**: Junction tablolarda `ON DELETE CASCADE` kullanıldı. Ana kesinti işlemi silindiğinde ilişkili personel ve araç kayıtları otomatik silinir.

3. **Unique Constraint**: Aynı personel veya araç, aynı kesinti işleminde birden fazla kez eklenemez.

4. **Audit Alanları**: `created_at`, `created_by`, `updated_at`, `updated_by` alanları ile tüm değişiklikler takip edilebilir.

5. **Soft Delete**: `is_active` alanı ile soft delete yapılabilir.

6. **İlişkiler**: Drizzle ORM relations ile tüm ilişkiler tanımlandı ve JOIN sorguları kolayca yapılabilir.

## Sonraki Adımlar

1. ✅ Schema tanımları oluşturuldu
2. ✅ Migration dosyası hazırlandı
3. ⏳ API endpoint'leri oluşturulmalı (CRUD operasyonları)
4. ⏳ Doğrulama ve test senaryoları yazılmalı
5. ⏳ Swagger/OpenAPI dokümantasyonu eklenebilir
