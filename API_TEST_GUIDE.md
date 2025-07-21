# Varlık API Test Rehberi

Bu rehber, varlık yönetimi API'lerini kendi bilgisayarınızdan nasıl test edebileceğinizi gösterir.

## API Base URL
```
https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev
```

## API Key
Tüm test endpoint'leri API key gerektirir:
```
x-api-key: test-api-key
```

## Mevcut Endpoint'ler

### 1. Tüm Varlıkları Listele
```bash
curl -X GET \
  -H "x-api-key: test-api-key" \
  "https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev/assets"
```

### 2. Belirli Bir Varlığı Getir
```bash
curl -X GET \
  -H "x-api-key: test-api-key" \
  "https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev/assets/4"
```

### 3. Yeni Varlık Oluştur
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key" \
  -d '{
    "model_id": 1,
    "model_year": 2024,
    "plate_number": "34 TEST 999",
    "chassis_no": "TEST123456789",
    "engine_no": "TESTENG001",
    "ownership_type_id": 1,
    "owner_company_id": 1,
    "register_date": "2024-01-15",
    "purchase_date": "2024-01-10"
  }' \
  "https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev/assets"
```

### 4. Varlık Güncelle
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key" \
  -d '{
    "plate_number": "34 UPDATE 123",
    "model_year": 2025
  }' \
  "https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev/assets/4"
```

### 5. Varlık Sil
```bash
curl -X DELETE \
  -H "x-api-key: test-api-key" \
  "https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev/assets/4"
```

## Postman ile Test

Postman kullanıyorsanız:

1. **Collection Oluşturun**: "Varlık API Test"
2. **Environment Ekleyin**:
   - `base_url`: `https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev`
   - `api_key`: `test-api-key`

3. **Headers Ekleyin** (tüm istekler için):
   - `x-api-key`: `{{api_key}}`
   - `Content-Type`: `application/json` (POST/PUT için)

4. **Request'leri Oluşturun**:
   - GET `{{base_url}}/assets`
   - GET `{{base_url}}/assets/4`
   - POST `{{base_url}}/assets`
   - PUT `{{base_url}}/assets/4`
   - DELETE `{{base_url}}/assets/4`

## JavaScript ile Test (Node.js)

```javascript
const axios = require('axios');

const API_BASE = 'https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev';
const API_KEY = 'test-api-key';

const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

// Tüm varlıkları listele
async function getAllAssets() {
  try {
    const response = await axios.get(`${API_BASE}/assets`, { headers });
    console.log('Varlıklar:', response.data);
  } catch (error) {
    console.error('Hata:', error.response?.data || error.message);
  }
}

// Yeni varlık oluştur
async function createAsset() {
  const newAsset = {
    model_id: 1,
    model_year: 2024,
    plate_number: "34 JS 001",
    chassis_no: "JS123456789",
    engine_no: "JSENG001",
    ownership_type_id: 1,
    owner_company_id: 1,
    register_date: "2024-01-15",
    purchase_date: "2024-01-10"
  };

  try {
    const response = await axios.post(`${API_BASE}/assets`, newAsset, { headers });
    console.log('Oluşturulan varlık:', response.data);
  } catch (error) {
    console.error('Hata:', error.response?.data || error.message);
  }
}

// Test fonksiyonlarını çalıştır
getAllAssets();
createAsset();
```

## Python ile Test

```python
import requests
import json

API_BASE = 'https://3d9fb108-b9e8-43bd-9835-61585a0eb37f-00-f39pm8i9ohyv.kirk.replit.dev'
API_KEY = 'test-api-key'

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
}

# Tüm varlıkları listele
def get_all_assets():
    try:
        response = requests.get(f'{API_BASE}/assets', headers=headers)
        response.raise_for_status()
        print('Varlıklar:', json.dumps(response.json(), indent=2))
    except requests.exceptions.RequestException as e:
        print('Hata:', e)

# Yeni varlık oluştur
def create_asset():
    new_asset = {
        "model_id": 1,
        "model_year": 2024,
        "plate_number": "34 PY 001",
        "chassis_no": "PY123456789",
        "engine_no": "PYENG001",
        "ownership_type_id": 1,
        "owner_company_id": 1,
        "register_date": "2024-01-15",
        "purchase_date": "2024-01-10"
    }
    
    try:
        response = requests.post(f'{API_BASE}/assets', 
                               headers=headers, 
                               json=new_asset)
        response.raise_for_status()
        print('Oluşturulan varlık:', json.dumps(response.json(), indent=2))
    except requests.exceptions.RequestException as e:
        print('Hata:', e)

# Test fonksiyonlarını çalıştır
get_all_assets()
create_asset()
```

## Veritabanı Lookup Tabloları

API'de kullanabileceğiniz ID'ler:

### Model ID'leri:
- 1: Mercedes Actros
- 2: Ford Transit  
- 3: BMW 320i

### Sahiplik Türü ID'leri:
- 1: Owned (Sahip)
- 2: Leased (Kiralık)
- 3: Rented (Kiralanmış)

### Firma ID'leri:
- 1: Test Company

## Test Önerileri

1. **Önce GET isteği yapın** - mevcut varlıkları görmek için
2. **POST ile yeni varlık ekleyin** - benzersiz plaka numarası kullanın
3. **PUT ile güncelleyin** - oluşturduğunuz varlığın ID'sini kullanın  
4. **DELETE ile silin** - test verilerini temizlemek için

## Hata Durumları

- **401 Unauthorized**: API key eksik veya hatalı
- **400 Bad Request**: Geçersiz veri formatı
- **404 Not Found**: Varlık bulunamadı
- **500 Internal Server Error**: Sunucu hatası

Herhangi bir sorunuz varsa veya ek özellik isterseniz söyleyin!