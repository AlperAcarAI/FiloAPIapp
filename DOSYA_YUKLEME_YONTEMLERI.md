# Dosya Yükleme Yöntemleri

## 1. Multipart Form Upload (✅ HAZIR - Önerilen)

### Endpoint
```
POST /documents/upload
```

### Kimlik Doğrulama
- **JWT Token Gerekli:** `Authorization: Bearer TOKEN`
- **İzinler:** `document:write` yetkisi gerekli

### İstek Formatı (multipart/form-data)
```http
POST /documents/upload HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
Authorization: Bearer YOUR_JWT_TOKEN

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="kimlik.pdf"
Content-Type: application/pdf

[BINARY FILE DATA]
------WebKitFormBoundary
Content-Disposition: form-data; name="entityType"

personnel
------WebKitFormBoundary
Content-Disposition: form-data; name="entityId"

1
------WebKitFormBoundary
Content-Disposition: form-data; name="docTypeId"

5
------WebKitFormBoundary
Content-Disposition: form-data; name="title"

Kimlik Fotokopisi
------WebKitFormBoundary--
```

### cURL Örneği
```bash
curl -X POST "http://localhost:5000/documents/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/kimlik.pdf" \
  -F "entityType=personnel" \
  -F "entityId=1" \
  -F "docTypeId=5" \
  -F "title=Kimlik Fotokopisi" \
  -F "description=Personel kimlik belgesi"
```

## 2. Base64 Upload

### İstek Formatı (JSON)
```json
{
  "entityType": "personnel",
  "entityId": 1,
  "docTypeId": 5,
  "title": "Kimlik Fotokopisi",
  "fileName": "kimlik.pdf",
  "mimeType": "application/pdf",
  "fileData": "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo..."
}
```

### cURL Örneği
```bash
# Dosyayı base64'e çevir
FILE_BASE64=$(base64 -w 0 kimlik.pdf)

curl -X POST "http://localhost:5000/documents/upload-base64" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"entityType\": \"personnel\",
    \"entityId\": 1,
    \"docTypeId\": 5,
    \"title\": \"Kimlik Fotokopisi\",
    \"fileName\": \"kimlik.pdf\",
    \"mimeType\": \"application/pdf\",
    \"fileData\": \"data:application/pdf;base64,$FILE_BASE64\"
  }"
```

## 3. İki Aşamalı Upload

### Aşama 1: Dosya Yükle
```bash
curl -X POST "http://localhost:5000/api/upload-file" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@kimlik.pdf"
```

**Cevap:**
```json
{
  "success": true,
  "data": {
    "filePath": "/uploads/2025/08/09/kimlik_abc123.pdf",
    "fileName": "kimlik.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "fileHash": "sha256:a1b2c3..."
  }
}
```

### Aşama 2: Döküman Kaydı Oluştur
```bash
curl -X POST "http://localhost:5000/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entityType": "personnel",
    "entityId": 1,
    "docTypeId": 5,
    "title": "Kimlik Fotokopisi",
    "filePath": "/uploads/2025/08/09/kimlik_abc123.pdf",
    "fileName": "kimlik.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "fileHash": "sha256:a1b2c3..."
  }'
```

## 4. Frontend JavaScript Örneği

### HTML Form
```html
<form id="uploadForm" enctype="multipart/form-data">
  <input type="file" id="file" name="file" required>
  <select name="entityType">
    <option value="personnel">Personel</option>
    <option value="asset">Varlık</option>
    <option value="company">Şirket</option>
    <option value="work_area">Çalışma Alanı</option>
  </select>
  <input type="number" name="entityId" placeholder="Entity ID" required>
  <input type="number" name="docTypeId" placeholder="Döküman Tip ID" required>
  <input type="text" name="title" placeholder="Başlık" required>
  <button type="submit">Yükle</button>
</form>
```

### JavaScript
```javascript
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Dosya başarıyla yüklendi!');
    } else {
      alert('Hata: ' + result.error);
    }
  } catch (error) {
    alert('Yükleme hatası: ' + error.message);
  }
});
```

## Hangi Yöntem Önerilir?

### Küçük Dosyalar (< 10MB)
- **Multipart Form Upload** (Yöntem 1) - En pratik

### Büyük Dosyalar (> 10MB)
- **İki Aşamalı Upload** (Yöntem 3) - Progress tracking mümkün

### API Entegrasyonu
- **Base64 Upload** (Yöntem 2) - JSON tabanlı API'lar için

## Dosya Boyutu Limitleri
- Maksimum dosya boyutu: 50MB
- İzin verilen formatlar: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX
- Dosya adında Türkçe karakter destegi var

## Güvenlik
- Dosya tipi kontrolü yapılır
- Virus scan (gelecekte eklenebilir)
- Dosya boyutu limiti
- JWT token zorunlu
- Dosya hash kontrolü (duplicate prevention)