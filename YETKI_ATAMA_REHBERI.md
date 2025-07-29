# Yetki Atama Sistemi Rehberi

## Mevcut Yetki Yapısı

### 1. Yetki Seviyeleri (access_levels tablosu)
```
1. Şantiye Seviyesi (WORKSITE) - Sadece kendi şantiyesine erişim
2. Bölge Seviyesi (REGIONAL) - Bölgedeki tüm şantiyelere erişim  
3. Genel Müdürlük (CORPORATE) - Tüm şirket verilerine erişim
4. Departman Bazlı (DEPARTMENT) - Departman yetkisine göre erişim
```

### 2. Yetki Atama Tabloları
- **users**: Temel kullanıcı bilgileri
- **user_access_rights**: Kullanıcıya verilen yetkiler
- **access_levels**: Yetki seviye tanımları
- **personnel_work_areas**: Personel-şantiye atamaları

## Yetki Atama İşlemleri

### A) YENİ KULLANICI OLUŞTURMA

```sql
-- 1. Yeni kullanıcı ekle
INSERT INTO users (email, password_hash, company_id, department, position_level, personnel_id) 
VALUES ('kullanici@sirket.com', 'hash_password', 1, 'muhasebe', 2, NULL);

-- 2. Kullanıcıya yetki ata
INSERT INTO user_access_rights (user_id, access_level_id, access_scope, granted_by, is_active)
VALUES (
  (SELECT id FROM users WHERE email = 'kullanici@sirket.com'),
  2, -- Bölge Seviyesi
  '{"work_area_ids": [1, 2, 3]}', -- Erişim kapsamı
  12, -- Yetkiyi veren kişi ID
  true
);
```

### B) ŞANTİYE SEVİYESİ YETKİ ATAMA

```sql
-- Şantiye şefi ataması
INSERT INTO user_access_rights (user_id, access_level_id, access_scope, granted_by, is_active)
VALUES (
  15, -- Kullanıcı ID
  1,  -- Şantiye Seviyesi
  '{"work_area_ids": [2]}', -- Sadece 2 numaralı şantiye
  12, -- Admin tarafından atandı
  true
);
```

### C) BÖLGE SEVİYESİ YETKİ ATAMA

```sql
-- Bölge müdürü ataması
INSERT INTO user_access_rights (user_id, access_level_id, access_scope, granted_by, is_active)
VALUES (
  16, -- Kullanıcı ID
  2,  -- Bölge Seviyesi
  '{"work_area_ids": [1, 2, 3, 4]}', -- Bölgedeki tüm şantiyeler
  12, -- Admin tarafından atandı
  true
);
```

### D) GENEL MÜDÜRLÜK YETKİ ATAMA

```sql
-- Genel müdür ataması
INSERT INTO user_access_rights (user_id, access_level_id, access_scope, granted_by, is_active)
VALUES (
  17, -- Kullanıcı ID
  3,  -- Genel Müdürlük
  '{"work_area_ids": null}', -- Tüm şantiyelere erişim
  12, -- Admin tarafından atandı
  true
);
```

### E) DEPARTMAN BAZLI YETKİ ATAMA

```sql
-- Muhasebe departmanı ataması
INSERT INTO user_access_rights (user_id, access_level_id, access_scope, granted_by, is_active)
VALUES (
  18, -- Kullanıcı ID
  4,  -- Departman Bazlı
  '{"department": "muhasebe", "work_area_ids": null, "permissions": ["financial:read", "financial:write"]}',
  12, -- Admin tarafından atandı
  true
);
```

## Yetki Güncelleme İşlemleri

### Mevcut Yetkiyi Pasif Yapma
```sql
UPDATE user_access_rights 
SET is_active = false 
WHERE user_id = 15 AND is_active = true;
```

### Yeni Yetki Ekleme
```sql
INSERT INTO user_access_rights (user_id, access_level_id, access_scope, granted_by, is_active)
VALUES (15, 2, '{"work_area_ids": [1, 2]}', 12, true);
```

## Personel-Şantiye Ataması

```sql
-- Personeli şantiyeye ata
INSERT INTO personnel_work_areas (personnel_id, work_area_id, position_id, start_date, is_active)
VALUES (1, 2, 3, CURRENT_DATE, true);
```

## Yetki Kontrolü Sorguları

### Kullanıcının Mevcut Yetkilerini Görme
```sql
SELECT u.email, al.name as access_level, uar.access_scope
FROM users u
JOIN user_access_rights uar ON u.id = uar.user_id
JOIN access_levels al ON uar.access_level_id = al.id
WHERE u.id = 15 AND uar.is_active = true;
```

### Şantiye Bazlı Erişim Kontrolü
```sql
SELECT wa.name as work_area_name, uar.access_scope
FROM user_access_rights uar
JOIN users u ON uar.user_id = u.id
LEFT JOIN work_areas wa ON wa.id = ANY(
  CAST(uar.access_scope->>'work_area_ids' AS int[])
)
WHERE u.id = 15 AND uar.is_active = true;
```

## Örnek Senaryolar

### 1. Yeni Şantiye Şefi Atama
- Email: mehmet.usta@sirket.com
- Şantiye: İstanbul Merkez (ID: 2)
- Pozisyon: Şantiye Şefi

### 2. Bölge Müdürü Atama  
- Email: ali.yonetici@sirket.com
- Bölge: İstanbul bölgesi (Şantiye ID: 1,2,3)
- Pozisyon: Bölge Müdürü

### 3. Muhasebe Uzmanı Atama
- Email: ayse.muhasebe@sirket.com
- Departman: Muhasebe
- Erişim: Tüm şantiyelerin finansal verileri

Bu sistem üzerinden tüm yetki atamalarınızı yapabilirsiniz.