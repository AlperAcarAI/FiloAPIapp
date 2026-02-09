# Malzeme Kod Eşleştirme Sayfası - Frontend Geliştirme Prompt'u

## Bağlam

Birden fazla kurum/firma ile çalışan bir sistemimiz var. Her kurumun kendi malzeme kodları ve isimleri farklı olabiliyor. Örneğin aynı malzeme bir kurumda `10002033 - BAKIR BARA 30X5` iken, diğerinde `3.1.2.2.YM - Cu Bara 30*5mm` olarak geçiyor.

Sistemde bir **master malzeme listesi** (ana referans) var. Firmalar kendi malzeme kodlarını bu master listeyle zamanla eşleştiriyorlar. Backend API'si hazır, frontend sayfasının tasarlanması gerekiyor.

---

## Sayfa Amacı

Kullanıcıların:
1. Bir firma seçip, o firmanın malzeme kodlarını master malzeme listesiyle eşleştirmesini sağlamak
2. Mevcut eşleştirmeleri görüntülemek, düzenlemek, silmek
3. Bulanık arama (fuzzy matching) ile benzer isimlere sahip malzemeleri otomatik önermek
4. Toplu eşleştirme önerisi alıp hızlıca onaylayabilmek

---

## Sayfa Tasarımı (Önerilen Bölümler)

### Bölüm 1: Firma Seçimi ve Özet
- Üstte bir firma seçici (dropdown/combobox)
- Firma seçildiğinde özet istatistikler gösterilir:
  - Toplam master malzeme sayısı
  - Bu firma için eşleştirilmiş malzeme sayısı
  - Henüz eşleştirilmemiş malzeme sayısı
  - Eşleştirme oranı (% progress bar)

### Bölüm 2: Mevcut Eşleştirmeler Tablosu
Firma seçildikten sonra mevcut eşleştirmeleri tablo olarak göster:

| Firma Malzeme Kodu | Firma Malzeme Adı | ↔ | Master Kod | Master Malzeme Adı | İşlemler |
|---------------------|-------------------|---|------------|---------------------|----------|
| 3.1.2.2.YM | Cu Bara 30*5mm | ↔ | 10002033 | BAKIR BARA 30X5 | Düzenle / Sil |

- Arama kutusu (firma kodu, firma adı, master kod veya master adı üzerinde)
- Satır başına düzenle ve sil butonları

### Bölüm 3: Yeni Eşleştirme Oluşturma
İki kolonlu bir arayüz:

**Sol kolon: Firma Malzemesi**
- Firma malzeme kodu (text input)
- Firma malzeme adı (text input)

**Sağ kolon: Master Malzeme Seçimi**
- Arama kutusu (yazıldıkça suggest endpoint'ini çağırır)
- `fuzzy=true` ile bulanık arama seçeneği (toggle/switch)
- Sonuçlar listesi: her satırda master kod, master ad ve benzerlik skoru (% olarak)
- Kullanıcı bir master malzemeye tıklayarak seçer
- "Eşleştir" butonu ile kayıt oluşturulur

### Bölüm 4: Toplu Eşleştirme Önerisi (Opsiyonel ama çok faydalı)
- Kullanıcı bir Excel/CSV dosyası yükler veya metin kutusuna malzeme isimlerini yapıştırır
- "Önerileri Getir" butonuna basınca `suggest-bulk` endpoint'i çağrılır
- Sonuçlar tablo olarak gösterilir:

| # | Firma Malzeme Adı | Öneri 1 (skor) | Öneri 2 (skor) | Öneri 3 (skor) | Seçim |
|---|-------------------|----------------|----------------|----------------|-------|
| 1 | Cu Bara 30*5mm | BAKIR BARA 30X5 (82%) | BAKIR BARA 40X5 (65%) | - | ○ ○ ○ |
| 2 | Demir Direk 12m | DEMİR DİREK 12M (91%) | DEMİR DİREK 10M (70%) | - | ○ ○ ○ |

- Her satırda radio button ile doğru öneriyi seçebilir veya "Eşleşme yok" diyebilir
- "Seçilenleri Kaydet" butonu ile `bulk` endpoint'i çağrılarak toplu kayıt yapılır

---

## API Endpoint'leri

Base URL: `/api/secure/progress-payments` (tüm endpoint'ler JWT auth gerektirir)

### 1. Eşleştirmeleri Listele
```
GET /material-code-mappings?companyId=5&search=bara&active=true
```
**Response:**
```json
[
  {
    "id": 1,
    "materialId": 42,
    "companyId": 5,
    "companyMaterialCode": "3.1.2.2.YM",
    "companyMaterialName": "Cu Bara 30*5mm",
    "isActive": true,
    "createdAt": "2026-01-31T...",
    "updatedAt": "2026-01-31T...",
    "materialCode": "10002033",
    "materialName": "BAKIR BARA 30X5",
    "companyName": "AKEDAŞ"
  }
]
```

### 2. Firma Bazlı Eşleştirmeler
```
GET /material-code-mappings/by-company/5?search=bara
```
**Response:**
```json
[
  {
    "id": 1,
    "materialId": 42,
    "companyMaterialCode": "3.1.2.2.YM",
    "companyMaterialName": "Cu Bara 30*5mm",
    "masterCode": "10002033",
    "masterName": "BAKIR BARA 30X5",
    "materialDescription": "Bakır bara, 30x5mm kesit"
  }
]
```

### 3. Eşleştirme Önerisi (Tekli Arama)
Normal arama:
```
GET /material-code-mappings/suggest?companyId=5&search=bakır bara
```

Bulanık arama (fuzzy matching):
```
GET /material-code-mappings/suggest?companyId=5&search=Cu Bara 30mm&fuzzy=true&threshold=0.15
```

**Response (fuzzy):**
```json
[
  {
    "id": 42,
    "code": "10002033",
    "name": "BAKIR BARA 30X5",
    "description": null,
    "similarity": 0.52
  },
  {
    "id": 43,
    "code": "10002034",
    "name": "BAKIR BARA 40X5",
    "description": null,
    "similarity": 0.38
  }
]
```

**Parametreler:**
- `companyId` (zorunlu): Firma ID
- `search`: Aranacak malzeme adı
- `fuzzy`: `true` olursa trigram benzerlik araması yapar
- `threshold`: Minimum benzerlik skoru (0-1 arası, varsayılan 0.15)
- `includeMatched`: `true` olursa zaten eşleştirilmiş malzemeleri de getirir

### 4. Toplu Fuzzy Eşleştirme Önerisi
```
POST /material-code-mappings/suggest-bulk
```
**Request Body:**
```json
{
  "items": [
    { "name": "Cu Bara 30*5mm" },
    { "name": "Demir Direk 12 metre" },
    { "name": "Alüminyum İletken 477 MCM" }
  ],
  "threshold": 0.15,
  "maxSuggestions": 5
}
```
**Response:**
```json
{
  "total": 3,
  "matched": 2,
  "unmatched": 1,
  "suggestions": [
    {
      "input": { "name": "Cu Bara 30*5mm" },
      "matches": [
        { "id": 42, "code": "10002033", "name": "BAKIR BARA 30X5", "similarity": 0.52 },
        { "id": 43, "code": "10002034", "name": "BAKIR BARA 40X5", "similarity": 0.38 }
      ]
    },
    {
      "input": { "name": "Demir Direk 12 metre" },
      "matches": [
        { "id": 100, "code": "10001221", "name": "DEMİR DİREK 12M", "similarity": 0.78 }
      ]
    },
    {
      "input": { "name": "Alüminyum İletken 477 MCM" },
      "matches": []
    }
  ]
}
```

### 5. Tek Eşleştirme Detayı
```
GET /material-code-mappings/15
```

### 6. Yeni Eşleştirme Oluştur
```
POST /material-code-mappings
```
**Request Body:**
```json
{
  "materialId": 42,
  "companyId": 5,
  "companyMaterialCode": "3.1.2.2.YM",
  "companyMaterialName": "Cu Bara 30*5mm"
}
```
**Hata durumu (409 - zaten eşleştirilmiş):**
```json
{ "error": "Bu malzeme için bu firmada zaten bir eşleştirme mevcut" }
```

### 7. Toplu Eşleştirme (Upsert)
```
POST /material-code-mappings/bulk
```
**Request Body:**
```json
{
  "companyId": 5,
  "mappings": [
    { "materialId": 42, "companyMaterialCode": "3.1.2.2.YM", "companyMaterialName": "Cu Bara 30*5mm" },
    { "materialId": 100, "companyMaterialCode": "5.5.1.1.MON", "companyMaterialName": "Demir Direk Montaj" }
  ]
}
```
**Response:**
```json
{
  "total": 2,
  "created": 1,
  "updated": 1,
  "errors": 0,
  "results": [
    { "materialId": 42, "status": "updated", "data": { "..." } },
    { "materialId": 100, "status": "created", "data": { "..." } }
  ]
}
```

### 8. Eşleştirmeyi Güncelle
```
PUT /material-code-mappings/15
```
**Request Body (kısmi güncelleme):**
```json
{
  "companyMaterialCode": "3.1.2.2.YM-REV",
  "companyMaterialName": "Bakır Bara 30x5mm (Revize)"
}
```

### 9. Eşleştirmeyi Sil (Soft Delete)
```
DELETE /material-code-mappings/15
```
**Response:**
```json
{ "message": "Eşleştirme pasif hale getirildi" }
```

---

## Destekleyici Endpoint'ler

Sayfa içinde ihtiyaç duyulacak diğer endpoint'ler:

### Firma Listesi
```
GET /api/secure/companies
```

### Master Malzeme Listesi
```
GET /api/secure/progress-payments/materials?search=bara&active=true
```
**Response:**
```json
[
  {
    "id": 42,
    "code": "10002033",
    "name": "BAKIR BARA 30X5",
    "typeId": 3,
    "description": null,
    "isActive": true
  }
]
```

---

## Veritabanı Şeması (Referans)

### materials (Master Malzeme Listesi)
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | serial PK | |
| code | varchar(50) | Unique master malzeme kodu |
| name | varchar(255) | Malzeme adı |
| typeId | integer FK | Malzeme türü |
| description | text | Açıklama |
| isActive | boolean | Aktif mi |

### material_code_mappings (Firma Bazlı Eşleştirme)
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | serial PK | |
| materialId | integer FK → materials | Master malzeme referansı |
| companyId | integer FK → companies | Firma referansı |
| companyMaterialCode | varchar(100) | Firmanın kendi malzeme kodu |
| companyMaterialName | varchar(255) | Firmanın kendi malzeme adı |
| isActive | boolean | Aktif mi |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Unique constraint:** Bir firma için bir master malzemeye sadece bir eşleştirme olabilir (`materialId` + `companyId`).

---

## UX İpuçları

1. **Fuzzy arama debounce:** Kullanıcı yazarken her tuşta istek atma, 300-500ms debounce uygula
2. **Benzerlik skoru gösterimi:** Skoru yüzde (%) olarak ve renk kodlamasıyla göster:
   - %70+ → Yeşil (yüksek eşleşme)
   - %40-70 → Sarı (orta eşleşme)
   - %15-40 → Kırmızı (düşük eşleşme)
3. **Toplu öneri akışı:** Excel'den kopyala-yapıştır destekle (her satır bir malzeme adı)
4. **Geri bildirim:** Eşleştirme kaydedildiğinde tablo anında güncellensin
5. **İlerleme takibi:** Firma seçildiğinde eşleştirme oranını progress bar ile göster, motivasyon sağlar
6. **Filtreleme:** Eşleştirilmiş / Eşleştirilmemiş / Tümü filtresi
