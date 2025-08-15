# Rental Assets API - Updated Changes Summary

## 🔄 Column Change
- **Database**: `km_hour_limit` → `km_month_limit`
- **API Field**: `kmHourLimit` → `kmMonthLimit`

## 🛠️ Updated API Endpoints

### GET /api/rental-assets
**NEW Query Parameters:**
- `minKmMonthLimit` (number) - Aylık minimum KM limiti
- `maxKmMonthLimit` (number) - Aylık maksimum KM limiti
- `sortBy=kmMonthLimit` - Aylık KM limitine göre sıralama

**Response Field:**
```json
{
  "kmMonthLimit": 100,  // UPDATED from kmHourLimit
  "kmTotalLimit": 50000
}
```

### POST /api/rental-assets
**Request Body:**
```json
{
  "agreementId": 1,
  "assetId": 15,
  "mountCents": 2000000,
  "vatPercent": "18.00",
  "kmMonthLimit": 130,     // UPDATED field name
  "kmTotalLimit": 80000
}
```

### PUT /api/rental-assets/:id
**Request Body (partial update):**
```json
{
  "kmMonthLimit": 150,     // UPDATED field name
  "mountCents": 2500000
}
```

### GET /api/rental-assets/by-agreement/:agreementId
**Summary Response:**
```json
{
  "summary": {
    "totalAssets": 2,
    "totalMountCents": 3300000,
    "avgVatPercent": "18.00",
    "totalKmMonthLimit": 210,    // UPDATED field name
    "totalKmTotalLimit": 110000
  }
}
```

## 📝 Example API Calls

```bash
# 1. Aylık KM limitine göre filtreleme
GET /api/rental-assets?minKmMonthLimit=100&maxKmMonthLimit=150

# 2. Aylık KM limitine göre sıralama
GET /api/rental-assets?sortBy=kmMonthLimit&sortOrder=desc

# 3. Yeni alan ile oluşturma
POST /api/rental-assets
{
  "agreementId": 1,
  "assetId": 15,
  "mountCents": 2000000,
  "vatPercent": "18.00",
  "kmMonthLimit": 130,
  "kmTotalLimit": 80000
}

# 4. Güncelleme
PUT /api/rental-assets/1
{
  "kmMonthLimit": 150,
  "mountCents": 2500000
}
```

## ✅ Validation Rules
- `kmMonthLimit`: required, integer, min: 0
- `kmTotalLimit`: required, integer, min: 0

## 🔧 Database Schema
```sql
-- Updated column in rental_assets table
ALTER TABLE rental_assets RENAME COLUMN km_hour_limit TO km_month_limit;
```

Tüm mevcut veriler korunmuş ve API'lar başarıyla güncellenmiştir.