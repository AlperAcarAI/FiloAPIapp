# Yetki Atama Rehberi (29 Ocak 2025)

## 🔐 Admin Yetkilendirme Sistemi

**Admin Email:** `alper.acar@architectaiagency.com`
- Sadece admin ve permission:manage yetkisi olan kişiler yetki ataması yapabilir
- Corporate seviye kullanıcılar permission:manage izni ile yetki yöneticisi olabilir

## 📊 API Endpoint'leri

### 1. Kullanıcı Listesi
```http
GET /api/permission-management/users?search=email&limit=20&offset=0
Authorization: Bearer {JWT_TOKEN}
```

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "email": "kullanici@sirket.com",
      "department": "operasyon",
      "personnelName": "Ali",
      "accessLevelName": "Bölge Seviyesi",
      "accessScope": "{\"work_area_ids\": [1,2,3]}"
    }
  ]
}
```

### 2. Yetki Seviyeleri
```http
GET /api/permission-management/access-levels
Authorization: Bearer {JWT_TOKEN}
```

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "Şantiye Seviyesi", "hierarchyLevel": 1},
    {"id": 2, "name": "Bölge Seviyesi", "hierarchyLevel": 2},
    {"id": 3, "name": "Genel Müdürlük", "hierarchyLevel": 3},
    {"id": 4, "name": "Departman Seviyesi", "hierarchyLevel": 4}
  ]
}
```

### 3. Yetki Atama
```http
POST /api/permission-management/assign-permission
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "userId": 12,
  "accessLevelId": 2,
  "accessScope": "{\"work_area_ids\": [1, 2, 3]}"
}
```

### 4. Yetki Güncelleme
```http
PUT /api/permission-management/update-permission/5
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "accessLevelId": 3,
  "accessScope": "{\"unlimited_access\": true, \"work_area_ids\": \"ALL\"}"
}
```

### 5. Yetki İptali
```http
DELETE /api/permission-management/revoke-permission/5
Authorization: Bearer {JWT_TOKEN}
```

### 6. Kullanıcı Yetki Geçmişi
```http
GET /api/permission-management/user-permissions/12
Authorization: Bearer {JWT_TOKEN}
```

## 🏗️ Yetki Seviyesi Örnekleri

### Corporate Seviye (ID: 3)
```json
{
  "userId": 7,
  "accessLevelId": 3,
  "accessScope": "{\"unlimited_access\": true, \"work_area_ids\": \"ALL\", \"permissions\": [\"permission:manage\"]}"
}
```

### Bölge Seviyesi (ID: 2)
```json
{
  "userId": 15,
  "accessLevelId": 2,
  "accessScope": "{\"work_area_ids\": [1, 2, 3, 4]}"
}
```

### Şantiye Seviyesi (ID: 1)
```json
{
  "userId": 14,
  "accessLevelId": 1,
  "accessScope": "{\"work_area_ids\": [2]}"
}
```

### Departman Seviyesi (ID: 4)
```json
{
  "userId": 13,
  "accessLevelId": 4,
  "accessScope": "{\"department\": \"muhasebe\", \"work_area_ids\": [1, 2, 3], \"permissions\": [\"financial:read\", \"financial:write\"]}"
}
```

## 🛡️ Güvenlik Özellikleri

✅ **Admin Kontrolü**: Sadece alper.acar@architectaiagency.com admin yetkisi
✅ **Permission Manager**: Corporate seviye + permission:manage izni gerekli
✅ **Soft Delete**: Yetki iptali hard delete değil, isActive=false yapıyor
✅ **Admin Koruması**: Admin yetkisi iptal edilemiyor
✅ **Audit Trail**: Tüm yetki atamaları grantedBy field'inde kayıtlı

## 📋 Kullanım Adımları

1. **Admin Token Al:**
```bash
curl -X POST "/api/backend/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "alper.acar@architectaiagency.com", "password": "admin_password"}'
```

2. **Kullanıcı Listesi Görüntüle:**
```bash
curl -X GET "/api/permission-management/users" \
  -H "Authorization: Bearer {TOKEN}"
```

3. **Yetki Ata:**
```bash
curl -X POST "/api/permission-management/assign-permission" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"userId": 12, "accessLevelId": 2, "accessScope": "{\"work_area_ids\": [1,2,3]}"}'
```

## ⚠️ Önemli Notlar

- **JSON Format**: accessScope mutlaka JSON string formatında olmalı
- **Quotes Escape**: JSON içindeki quotes (\") escape edilmeli
- **Work Area IDs**: Array formatında [1,2,3] şeklinde
- **Corporate Access**: unlimited_access: true flag'i ile kontrollü
- **Admin Email**: Sistem kodunda tanımlı, değiştirilemez

Bu rehberle güvenli yetki atamaları yapabilirsiniz!