# Rental Assets API - Updated Documentation

## Column Change Summary
- **Old Column**: `km_hour_limit` 
- **New Column**: `km_month_limit`
- **API Field**: `kmMonthLimit` (camelCase)

## Updated Endpoints

### 1. GET /api/rental-assets
**Description**: List all rental assets with filtering and pagination

**Query Parameters**:
- `agreementId` (number): Filter by agreement ID
- `assetId` (number): Filter by asset ID
- `minMountCents` (number): Minimum mount in cents
- `maxMountCents` (number): Maximum mount in cents
- `minVatPercent` (string): Minimum VAT percentage
- `maxVatPercent` (string): Maximum VAT percentage
- **`minKmMonthLimit`** (number): Minimum monthly KM limit ✅ NEW
- **`maxKmMonthLimit`** (number): Maximum monthly KM limit ✅ NEW
- `search` (string): Search in plate numbers and agreement numbers
- `sortBy` (string): Sort field options: `id`, `mountCents`, `vatPercent`, **`kmMonthLimit`**, `kmTotalLimit` ✅ UPDATED
- `sortOrder` (string): `asc` or `desc`
- `limit` (number): Default 20
- `offset` (number): Default 0

**Response**:
```json
{
  "success": true,
  "message": "Kiralama araçları başarıyla getirildi.",
  "data": {
    "rentalAssets": [
      {
        "id": 1,
        "agreementId": 1,
        "agreementNumber": "SZL2025-TEST-001",
        "assetId": 14,
        "plateNumber": "34XYZ789",
        "mountCents": 1500000,
        "vatPercent": "18.00",
        "kmMonthLimit": 100,
        "kmTotalLimit": 50000,
        "rentalCompanyId": 1,
        "rentalCompanyName": "Demo Şirket A.Ş.",
        "tenantCompanyId": 2,
        "tenantCompanyName": "Demo Lojistik A.Ş.",
        "agreementIsActive": true,
        "agreementStartDate": "2025-08-12",
        "agreementEndDate": "2025-12-31"
      }
    ],
    "totalCount": 3,
    "pagination": {
      "limit": 2,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 2. GET /api/rental-assets/:id
**Description**: Get single rental asset details

**Response**:
```json
{
  "success": true,
  "message": "Kiralama aracı detayı başarıyla getirildi.",
  "data": {
    "id": 1,
    "agreementId": 1,
    "agreementNumber": "SZL2025-TEST-001",
    "assetId": 14,
    "plateNumber": "34XYZ789",
    "mountCents": 1500000,
    "vatPercent": "18.00",
    "kmMonthLimit": 100,
    "kmTotalLimit": 50000,
    "rentalCompanyId": 1,
    "rentalCompanyName": "Demo Şirket A.Ş.",
    "tenantCompanyId": 2,
    "tenantCompanyName": "Demo Lojistik A.Ş.",
    "agreementStartDate": "2025-08-12",
    "agreementEndDate": "2025-12-31",
    "agreementIsActive": true,
    "agreementIsShortTerm": false
  }
}
```

### 3. POST /api/rental-assets
**Description**: Create new rental asset

**Request Body**:
```json
{
  "agreementId": 1,
  "assetId": 15,
  "mountCents": 2000000,
  "vatPercent": "18.00",
  "kmMonthLimit": 130,
  "kmTotalLimit": 80000
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 4,
    "agreementId": 1,
    "assetId": 15,
    "mountCents": 2000000,
    "vatPercent": "18.00",
    "kmMonthLimit": 130,
    "kmTotalLimit": 80000
  },
  "message": "Kiralama aracı başarıyla oluşturuldu."
}
```

### 4. PUT /api/rental-assets/:id
**Description**: Update rental asset

**Request Body**:
```json
{
  "mountCents": 2500000,
  "vatPercent": "20.00",
  "kmMonthLimit": 150,
  "kmTotalLimit": 100000
}
```

### 5. DELETE /api/rental-assets/:id
**Description**: Delete rental asset (hard delete with cascade)

### 6. GET /api/rental-assets/by-agreement/:agreementId
**Description**: Get all assets for a specific agreement with summary

**Response**:
```json
{
  "success": true,
  "message": "Sözleşme araçları başarıyla getirildi.",
  "data": {
    "assets": [
      {
        "id": 1,
        "assetId": 14,
        "plateNumber": "34XYZ789",
        "mountCents": 1500000,
        "vatPercent": "18.00",
        "kmMonthLimit": 100,
        "kmTotalLimit": 50000,
        "totalCostWithVat": 1770000
      }
    ],
    "summary": {
      "totalAssets": 2,
      "totalMountCents": 3300000,
      "avgVatPercent": "18.0000000000000000",
      "totalKmMonthLimit": 210,
      "totalKmTotalLimit": 110000
    }
  }
}
```

## Updated Field Validations

**kmMonthLimit** (required):
- Type: number (integer)
- Minimum: 0
- Description: Monthly kilometer limit for the asset

**kmTotalLimit** (required):
- Type: number (integer) 
- Minimum: 0
- Description: Total kilometer limit for the rental period

## Example API Calls

```bash
# Filter by monthly KM limits
GET /api/rental-assets?minKmMonthLimit=100&maxKmMonthLimit=150

# Sort by monthly KM limit
GET /api/rental-assets?sortBy=kmMonthLimit&sortOrder=desc

# Create with new field
POST /api/rental-assets
{
  "agreementId": 1,
  "assetId": 15,
  "mountCents": 2000000,
  "vatPercent": "18.00",
  "kmMonthLimit": 130,
  "kmTotalLimit": 80000
}
```

## Database Schema
```sql
-- Updated table structure
CREATE TABLE rental_assets (
  id SERIAL PRIMARY KEY,
  agreement_id INTEGER NOT NULL REFERENCES rental_agreements(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  mount_cents INTEGER NOT NULL,
  vat_percent DECIMAL(5,2) NOT NULL,
  km_month_limit INTEGER NOT NULL,  -- RENAMED FROM km_hour_limit
  km_total_limit INTEGER NOT NULL
);
```