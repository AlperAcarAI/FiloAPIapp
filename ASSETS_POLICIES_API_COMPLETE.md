# Assets Policies API - Complete Implementation

## ✅ **Working Endpoints**

### **Assets Policies Management**

#### **1. GET /api/assets-policies** - List All Policies
```bash
GET /api/assets-policies
GET /api/proxy/assets-policies  # Proxy endpoint

# With filters:
?assetId=14                    # Specific asset
?policyTypeId=2               # Specific policy type
?insuranceCompanyId=1         # Specific insurance company
?activeOnly=true              # Only active policies
?expiringInDays=30           # Expiring within 30 days
?search=TEST                 # Search in policy numbers
?limit=10&offset=0           # Pagination
```

**Response:**
```json
{
  "success": true,
  "message": "Poliçeler başarıyla getirildi.",
  "data": {
    "policies": [
      {
        "id": 1,
        "assetId": 14,
        "policyTypeId": 2,
        "sellerCompanyId": 1,
        "insuranceCompanyId": 2,
        "policyNumber": "TEST-2025-999",
        "amountCents": 750000,
        "startDate": "2025-08-16",
        "endDate": "2026-08-16",
        "isActive": true,
        "remainingDays": 365
      }
    ],
    "totalCount": 1
  }
}
```

#### **2. POST /api/assets-policies** - Create New Policy ✅
```bash
POST /api/assets-policies
POST /api/proxy/assets-policies  # Proxy endpoint

{
  "assetId": 14,                    # Must be existing asset
  "policyTypeId": 2,               # Must be existing policy type
  "sellerCompanyId": 1,            # Seller company
  "insuranceCompanyId": 2,         # Insurance company
  "policyNumber": "TEST-2025-999", # Unique policy number
  "amountCents": 750000,           # 7,500 TL in cents
  "startDate": "2025-08-16",       # Start date (required)
  "endDate": "2026-08-16"          # End date (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Poliçe başarıyla oluşturuldu.",
  "data": {
    "id": 1,
    "assetId": 14,
    "policyTypeId": 2,
    "policyNumber": "TEST-2025-999",
    "amountCents": 750000,
    "startDate": "2025-08-16",
    "endDate": "2026-08-16",
    "isActive": true
  }
}
```

#### **3. GET /api/assets-policies/:id** - Policy Details
```bash
GET /api/assets-policies/1
```

#### **4. PUT /api/assets-policies/:id** - Update Policy
```bash
PUT /api/assets-policies/1
{
  "amountCents": 800000,
  "endDate": "2027-01-01"
}
```

#### **5. DELETE /api/assets-policies/:id** - Soft Delete
```bash
DELETE /api/assets-policies/1
```

## 🔧 **Validation & Business Rules**

### **Required Fields:**
- `assetId` (must exist in assets table)
- `policyTypeId` (must exist in policy_types table) 
- `sellerCompanyId` (must exist in companies table)
- `insuranceCompanyId` (must exist in companies table)
- `policyNumber` (must be unique per asset)
- `amountCents` (positive integer)
- `startDate` (valid date)

### **Business Logic:**
1. **Duplicate Prevention**: Same policy number cannot exist for same asset
2. **Asset Validation**: Asset must exist before creating policy
3. **Policy Type Validation**: Policy type must be active
4. **Company Validation**: Both seller and insurance companies must exist
5. **Soft Delete**: Policies are marked inactive, not deleted
6. **Audit Trail**: All operations logged to audit_logs table

## 📊 **Available Policy Types**
- ID 1: Zorunlu Trafik Sigortası
- ID 2: Kasko
- ID 10: Kasko Sigortası ✅ (Used in examples)
- ID 11: Trafik Sigortası
- ID 12: Nakliye Sigortası
- ID 13: İş Makinesi Sigortası
- ID 14: Yol Yardım Sigortası

## 🚗 **Test Data Created**
```json
{
  "id": 1,
  "assetId": 14,           # Toyota Corolla (plate: 34XYZ789)
  "policyTypeId": 2,       # Kasko
  "policyNumber": "TEST-2025-999",
  "amountCents": 750000,   # 7,500 TL
  "startDate": "2025-08-16",
  "endDate": "2026-08-16",
  "isActive": true
}
```

## ⚠️ **Common Issues**

### **Asset Not Found (404)**
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND",
  "message": "Belirtilen araç bulunamadı."
}
```
**Solution:** Use existing asset ID (check /api/vehicles endpoint)

### **Duplicate Policy (400)**
```json
{
  "success": false,
  "error": "DUPLICATE_POLICY", 
  "message": "Bu araç için aynı poliçe numarası zaten mevcut."
}
```
**Solution:** Use unique policy number for each asset

### **Validation Error (400)**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Gerekli alanlar eksik: assetId, policyTypeId, ..."
}
```
**Solution:** Provide all required fields

## 🔐 **Authentication & Security**
- ✅ JWT Authentication required
- ✅ Audit logging enabled
- ✅ Proxy endpoint secured
- ✅ Input validation
- ✅ SQL injection protection
- ✅ Turkish error messages

## 📈 **Usage Examples**

```bash
# 1. Create policy for existing asset
POST /api/assets-policies
{
  "assetId": 14,
  "policyTypeId": 10,
  "sellerCompanyId": 1,
  "insuranceCompanyId": 2,
  "policyNumber": "KSK-2025-14-001",
  "amountCents": 500000,
  "startDate": "2025-08-16",
  "endDate": "2026-08-16"
}

# 2. List policies for specific asset
GET /api/assets-policies?assetId=14

# 3. Find expiring policies
GET /api/assets-policies?expiringInDays=30&activeOnly=true

# 4. Search by policy number
GET /api/assets-policies?search=KSK-2025
```

The Assets Policies API is now fully functional and ready for production use!