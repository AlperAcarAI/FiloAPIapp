# Personnel API - Değişiklik Raporu

## 🔄 **API Yapısında Değişiklikler**

### **1. Endpoint Path Değişikliği:**
```bash
# ESKİ:
GET /api/personnel

# YENİ:
GET /api/secure/personnel
```

### **2. Authentication Requirements:**
```bash
# Gerekli Headers:
Authorization: Bearer {JWT_TOKEN}
# API Key artık gerekli değil!
```

---

## 📊 **Response Structure Değişiklikleri**

### **ESKİ Response:**
```json
{
  "success": true,
  "message": "Personeller başarıyla getirildi.",
  "data": {
    "personnel": [
      {
        "id": 1,
        "tcNo": "12345678901",
        "name": "Ahmet",
        "surname": "Yılmaz",
        "birthdate": "1990-01-01",
        "address": "İstanbul",
        "phoneNo": "+905551234567",
        "status": "aktif",
        "isActive": true,
        "nationName": "Türkiye",
        "birthplaceName": "İstanbul"
      }
    ],
    "totalCount": 1
  }
}
```

### **YENİ Response (Work Area Bilgileri ile):**
```json
{
  "success": true,
  "message": "Personeller başarıyla getirildi.",
  "data": {
    "personnel": [
      {
        "id": 1,
        "tcNo": "12345678901",
        "name": "Ahmet",
        "surname": "Yılmaz",
        "birthdate": "1990-01-01",
        "address": "İstanbul",
        "phoneNo": "+905551234567",
        "status": "aktif",
        "isActive": true,
        "companyId": 1,
        "nationName": "Türkiye",
        "birthplaceName": "İstanbul",
        
        // YENİ ALANLAR:
        "currentWorkAreaId": 2,
        "workAreaName": "İstanbul Merkez Şantiyesi",
        "positionName": "Şantiye Şefi"
      }
    ],
    "totalCount": 1
  }
}
```

---

## 🔒 **Work Area Filtreleme Mantığı**

### **Access Level'a Göre Filtreleme:**

| **Access Level** | **Görüntüleyebileceği Personel** |
|------------------|----------------------------------|
| **WORKSITE** | Sadece kendi şantiyesindeki personel |
| **REGIONAL** | Birden fazla şantiyedeki personel |
| **CORPORATE** | Tüm personel (Genel Müdürlük) |

### **Filtreleme Query Parametreleri:**
```bash
GET /api/secure/personnel?search=ahmet&active=true&workAreaId=2
```

---

## 🆕 **Yeni Alanlar:**

| **Alan** | **Tip** | **Açıklama** |
|----------|---------|--------------|
| `companyId` | integer | Personelin bağlı olduğu şirket ID |
| `currentWorkAreaId` | integer | Mevcut çalışma alanı ID |
| `workAreaName` | string | Şantiye/çalışma alanı adı |
| `positionName` | string | Pozisyon/görev adı |

---

## ⚠️ **Breaking Changes:**

1. **Endpoint Path**: `/api/personnel` → `/api/secure/personnel`
2. **API Key Removed**: `x-api-key` header artık gerekli değil
3. **Hierarchical Auth**: Kullanıcının access level'ına göre filtreleme
4. **Response Structure**: Yeni work area alanları eklendi

---

## 🔧 **Mevcut Sorunlar:**

- ❌ Database connection timeout sorunu
- ❌ LSP diagnostics hataları (14 adet)
- ❌ Token validation issues

---

## 📝 **Migration Guide:**

### **Frontend Değişiklikleri:**
```javascript
// ESKİ:
const response = await fetch('/api/personnel', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// YENİ:
const response = await fetch('/api/secure/personnel', {
  headers: {
    'Authorization': `Bearer ${token}`
    // API Key artık gerekli değil!
  }
});
```

### **Response Handling:**
```javascript
// ESKİ:
const { personnel } = response.data;

// YENİ:
const { personnel } = response.data;
// Artık her personel için:
// - currentWorkAreaId
// - workAreaName  
// - positionName
// alanları mevcut
```

**Sonuç:** API yapısı önemli ölçüde değişti. Work area filtreleme ve hiyerarşik yetkilendirme eklendi.