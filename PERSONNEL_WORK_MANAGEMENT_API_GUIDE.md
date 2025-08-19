# Personel İş Sonlandırma ve Transfer API'leri Kullanım Kılavuzu

Bu dokümantasyon, yeni oluşturulan personel iş sonlandırma ve transfer API'lerinin kullanımını açıklar.

## API Endpoint'leri

### 1. İş Sonlandırma API'si
**Endpoint:** `PUT /api/secure/personnel-work-areas/{id}/terminate`

Mevcut bir personel çalışma alanı atamasını sonlandırır.

#### Request Body:
```json
{
  "endDate": "2024-01-15",
  "reason": "İstifa" // opsiyonel
}
```

#### Response (200):
```json
{
  "success": true,
  "message": "Personel iş ataması başarıyla sonlandırıldı.",
  "data": {
    "assignment": {
      "id": 123,
      "personnelId": 456,
      "workAreaId": 789,
      "startDate": "2023-06-01",
      "endDate": "2024-01-15",
      "isActive": false,
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "personnelName": "Ahmet Yılmaz",
      "workAreaName": "İstanbul Şantiyesi",
      "positionName": "İnşaat Mühendisi"
    },
    "terminationInfo": {
      "terminationDate": "2024-01-15",
      "reason": "İstifa",
      "terminatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Transfer API'si
**Endpoint:** `POST /api/secure/personnel-work-areas/{id}/transfer`

Mevcut atamanın sonlandırılması ve yeni çalışma alanına transfer işlemi.

#### Request Body:
```json
{
  "transferDate": "2024-01-15",
  "newWorkAreaId": 999,
  "newPositionId": 888,
  "newProjectId": 777, // opsiyonel
  "reason": "Terfi" // opsiyonel
}
```

#### Response (201):
```json
{
  "success": true,
  "message": "Personel transfer işlemi başarıyla tamamlandı.",
  "data": {
    "transfer": {
      "transferDate": "2024-01-15",
      "reason": "Terfi",
      "transferredAt": "2024-01-15T10:30:00.000Z"
    },
    "terminatedAssignment": {
      "id": 123,
      "workAreaId": 789,
      "workAreaName": "İstanbul Şantiyesi",
      "positionName": "İnşaat Mühendisi",
      "startDate": "2023-06-01",
      "endDate": "2024-01-15",
      "isActive": false
    },
    "newAssignment": {
      "id": 124,
      "personnelId": 456,
      "personnelName": "Ahmet Yılmaz",
      "workAreaId": 999,
      "workAreaName": "Ankara Şantiyesi",
      "positionId": 888,
      "positionName": "Proje Yöneticisi",
      "projectId": 777,
      "projectCode": "PRJ-2024-001",
      "startDate": "2024-01-15",
      "endDate": null,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Hata Kodları

### İş Sonlandırma API'si Hataları:
- `400 MISSING_END_DATE`: Sonlandırma tarihi eksik
- `400 INVALID_DATE_FORMAT`: Geçersiz tarih formatı
- `400 INVALID_TERMINATION_DATE`: Sonlandırma tarihi başlangıç tarihinden önce
- `404 ASSIGNMENT_NOT_FOUND`: Atama bulunamadı
- `409 ASSIGNMENT_ALREADY_TERMINATED`: Atama zaten sonlandırılmış

### Transfer API'si Hataları:
- `400 MISSING_REQUIRED_FIELDS`: Gerekli alanlar eksik
- `400 INVALID_DATE_FORMAT`: Geçersiz tarih formatı
- `400 INVALID_TRANSFER_DATE`: Transfer tarihi başlangıç tarihinden önce
- `404 ASSIGNMENT_NOT_FOUND`: Mevcut atama bulunamadı
- `404 NEW_WORK_AREA_NOT_FOUND`: Yeni çalışma alanı bulunamadı
- `404 NEW_POSITION_NOT_FOUND`: Yeni pozisyon bulunamadı
- `404 NEW_PROJECT_NOT_FOUND`: Yeni proje bulunamadı
- `409 ASSIGNMENT_ALREADY_TERMINATED`: Mevcut atama zaten sonlandırılmış
- `409 DUPLICATE_ASSIGNMENT_IN_NEW_AREA`: Yeni çalışma alanında zaten aktif atama var

## Kullanım Örnekleri

### 1. İş Sonlandırma Örneği:
```bash
curl -X PUT "http://localhost:5000/api/secure/personnel-work-areas/123/terminate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endDate": "2024-01-15",
    "reason": "İstifa"
  }'
```

### 2. Transfer Örneği:
```bash
curl -X POST "http://localhost:5000/api/secure/personnel-work-areas/123/transfer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transferDate": "2024-01-15",
    "newWorkAreaId": 999,
    "newPositionId": 888,
    "newProjectId": 777,
    "reason": "Terfi"
  }'
```

## Önemli Notlar

1. **Transaction Güvenliği**: Transfer API'si tüm işlemleri tek bir transaction içinde gerçekleştirir
2. **Tarih Validasyonu**: Sonlandırma/transfer tarihi başlangıç tarihinden önce olamaz
3. **Çakışma Kontrolü**: Transfer sırasında yeni çalışma alanında aktif atama kontrolü yapılır
4. **Authentication**: Tüm endpoint'ler JWT token gerektirir
5. **Authorization**: Hierarchical work area filtering uygulanır

## Test Senaryoları

1. **Normal İş Sonlandırma**: Aktif atamayı sonlandırma
2. **Normal Transfer**: Aktif atamayı başka çalışma alanına transfer
3. **Hatalı Tarih**: Başlangıç tarihinden önce sonlandırma/transfer
4. **Zaten Sonlandırılmış**: Pasif atamayı sonlandırma/transfer
5. **Çakışma**: Aynı çalışma alanında aktif atama varken transfer

Bu API'ler ile personel çalışma bilgilerini güvenli ve tutarlı şekilde yönetebilirsiniz.
