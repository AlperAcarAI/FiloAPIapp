# Dosya Yükleme API'leri Raporu

## Genel Bakış
Frontend uygulamanızda dosya yükleme işlemleri için iki ana kategori API endpoint'i bulunmaktadır:
1. **Tekil Dosya Yükleme** - Döküman yönetimi için
2. **Toplu Dosya Yükleme** - CSV/Excel verilerinin toplu olarak içe aktarılması için

---

## 1. Tekil Dosya Yükleme API'leri

### 1.1 Döküman Yükleme Endpoint'i
**URL:** `POST /api/documents/upload`

**Kimlik Doğrulama:** JWT Token gerekli
**İzinler:** `document:write` yetkisi gerekli

#### Desteklenen Dosya Formatları:
- **PDF**: `application/pdf`
- **MS Word**: `.doc`, `.docx`
- **MS Excel**: `.xls`, `.xlsx`
- **Resim Dosyaları**: `.jpg`, `.jpeg`, `.png`, `.gif`
- **Metin Dosyaları**: `.txt`

#### Dosya Boyutu Limiti:
- **Maksimum**: 50MB

#### Zorunlu Parametreler:
```javascript
{
  "file": FormData,           // Yüklenecek dosya
  "entityType": String,       // "personnel", "company", "work_area", "asset"
  "entityId": Number,         // İlgili entity'nin ID'si
  "docTypeId": Number,        // Döküman tipinin ID'si
  "title": String            // Döküman başlığı
}
```

#### Opsiyonel Parametreler:
```javascript
{
  "description": String,      // Döküman açıklaması
  "validityStartDate": Date,  // Geçerlilik başlangıç tarihi
  "validityEndDate": Date     // Geçerlilik bitiş tarihi
}
```

#### Örnek İstek (JavaScript):
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('entityType', 'personnel');
formData.append('entityId', '123');
formData.append('docTypeId', '1');
formData.append('title', 'İdentity Dökümanı');
formData.append('description', 'Personel kimlik belgesi');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  },
  body: formData
});
```

#### Başarılı Yanıt (201):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "title": "İdentity Dökümanı",
    "fileName": "kimlik_1641234567890_abc123.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "uploadDate": "2024-01-10T10:30:00Z",
    "fileHash": "sha256hash...",
    "entityType": "personnel",
    "entityId": 123
  },
  "message": "Dosya başarıyla yüklendi ve döküman kaydı oluşturuldu"
}
```

#### Hata Durumları:
- **400**: Eksik veya geçersiz parametreler
- **400**: Desteklenmeyen dosya formatı
- **400**: Dosya zaten yüklenmiş (duplicate)
- **413**: Dosya boyutu çok büyük
- **500**: Sunucu hatası

### 1.2 Döküman İndirme Endpoint'i
**URL:** `GET /api/documents/download/:id`

**Kimlik Doğrulama:** JWT Token gerekli
**İzinler:** `document:read` yetkisi gerekli

#### Örnek İstek:
```javascript
const response = await fetch('/api/documents/download/456', {
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.pdf';
  a.click();
}
```

### 1.3 Dosya Depolama Sistemi
- **Depolama Konumu**: `uploads/YYYY/MM/DD/` formatında tarih bazlı klasörleme
- **Dosya Adlandırma**: `{orijinalAd}_{timestamp}_{randomId}.{uzantı}`
- **Güvenlik**: SHA-256 hash ile duplicate kontrol
- **Cleanup**: Hata durumunda otomatik dosya temizleme

---

## 2. Toplu Dosya Yükleme API'leri

### 2.1 CSV/Excel Toplu İçe Aktarma
**URL:** `POST /api/secure/bulk-import/csv`

**Kimlik Doğrulama:** API Token gerekli

#### Desteklenen Formatlar:
- **CSV**: `.csv`
- **Excel**: `.xlsx`, `.xls`

#### Dosya Boyutu Limiti:
- **Maksimum**: 50MB

#### Zorunlu Parametreler:
```javascript
{
  "file": FormData,           // CSV/Excel dosyası
  "targetTable": String,      // "car_brands_models" vb.
  "batchSize": Number         // Varsayılan: 50
}
```

#### Örnek İstek:
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('targetTable', 'car_brands_models');
formData.append('batchSize', '100');

const response = await fetch('/api/secure/bulk-import/csv', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiToken
  },
  body: formData
});
```

#### Başarılı Yanıt (200):
```json
{
  "success": true,
  "message": "Bulk import işlemi başlatıldı",
  "data": {
    "importId": "import_1641234567890_abc123def",
    "totalRows": 1000,
    "estimatedTime": 40,
    "statusEndpoint": "/api/secure/bulk-import/status/import_1641234567890_abc123def"
  }
}
```

### 2.2 İçe Aktarma Durumu Kontrol
**URL:** `GET /api/secure/bulk-import/status/:importId`

#### Yanıt Örneği:
```json
{
  "success": true,
  "data": {
    "id": "import_1641234567890_abc123def",
    "status": "processing",
    "totalRows": 1000,
    "processedRows": 450,
    "skippedRows": 12,
    "addedRows": 438,
    "errors": [],
    "progress": 45,
    "elapsedTime": 18,
    "estimatedTimeRemaining": 22,
    "speed": 25
  }
}
```

#### Durum Değerleri:
- `processing`: İşlem devam ediyor
- `completed`: İşlem tamamlandı
- `failed`: İşlem başarısız
- `cancelled`: İşlem iptal edildi

### 2.3 Şablon İndirme
**URL:** `GET /api/secure/bulk-import/templates`

Desteklenen tablo şablonlarının listesini döndürür.

---

## 3. Güvenlik Özellikleri

### 3.1 Kimlik Doğrulama
- **JWT Token**: Tekil dosya işlemleri için
- **API Token**: Toplu işlemler için
- **İzin Kontrolleri**: Granular permission sistemi

### 3.2 Dosya Güvenliği
- **MIME Type Kontrolleri**: Dosya türü doğrulaması
- **Uzantı Kontrolleri**: Çift katmanlı format kontrol
- **Boyut Limitleri**: 50MB maksimum dosya boyutu
- **Hash Kontrolleri**: SHA-256 ile duplicate önleme

### 3.3 Hata Yönetimi
- **Cleanup Mekanizması**: Başarısız yüklemelerde otomatik dosya temizleme
- **Validation**: Zod şemaları ile veri doğrulama
- **Rate Limiting**: Batch processing ile sistem koruması

---

## 4. Frontend Entegrasyonu İçin Öneriler

### 4.1 Dosya Yükleme Komponenti
```javascript
const FileUploadComponent = ({ entityType, entityId, docTypeId }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('docTypeId', docTypeId);
    formData.append('title', file.name);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getJwtToken()}`
        },
        body: formData
      });

      if (response.ok) {
        // Başarılı yükleme işlemi
        const result = await response.json();
        console.log('Dosya yüklendi:', result.data);
      }
    } catch (error) {
      console.error('Yükleme hatası:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleFileUpload(e.target.files[0])}
        disabled={uploading}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
      />
      {uploading && <div>Yükleniyor...</div>}
    </div>
  );
};
```

### 4.2 Toplu İçe Aktarma Komponenti
```javascript
const BulkImportComponent = () => {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const handleBulkImport = async (file, targetTable) => {
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetTable', targetTable);
    formData.append('batchSize', '100');

    try {
      const response = await fetch('/api/secure/bulk-import/csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getApiToken()}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        // Durum takibi başlat
        pollImportStatus(result.data.importId);
      }
    } catch (error) {
      console.error('İçe aktarma hatası:', error);
      setImporting(false);
    }
  };

  const pollImportStatus = async (importId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/secure/bulk-import/status/${importId}`, {
          headers: {
            'Authorization': `Bearer ${getApiToken()}`
          }
        });

        if (response.ok) {
          const status = await response.json();
          setImportStatus(status.data);

          if (status.data.status === 'completed' || status.data.status === 'failed') {
            clearInterval(interval);
            setImporting(false);
          }
        }
      } catch (error) {
        console.error('Durum kontrol hatası:', error);
        clearInterval(interval);
        setImporting(false);
      }
    }, 2000);
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleBulkImport(e.target.files[0], 'car_brands_models')}
        disabled={importing}
        accept=".csv,.xlsx,.xls"
      />
      {importing && importStatus && (
        <div>
          <div>İlerleme: {importStatus.progress}%</div>
          <div>İşlenen: {importStatus.processedRows}/{importStatus.totalRows}</div>
          <div>Eklenen: {importStatus.addedRows}</div>
          <div>Atlanan: {importStatus.skippedRows}</div>
        </div>
      )}
    </div>
  );
};
```

---

## 5. Performans ve Optimizasyon

### 5.1 Dosya Yükleme Optimizasyonu
- **Chunk Upload**: Büyük dosyalar için parça parça yükleme
- **Progress Tracking**: Gerçek zamanlı ilerleme takibi
- **Resume Upload**: Kesintili yüklemelerde devam etme

### 5.2 Toplu İşlem Optimizasyonu
- **Batch Processing**: Veritabanı yükünü azaltmak için batch işleme
- **Memory Management**: Büyük dosyalar için memory stream kullanımı
- **Error Recovery**: Hatalı kayıtları atlayarak devam etme

---

## 6. Gelecek Geliştirmeler

### 6.1 Önerilen Eklemeler
- **Dosya Önizleme**: PDF ve resim dosyaları için önizleme
- **Virus Scanning**: Yüklenen dosyaların güvenlik taraması
- **Cloud Storage**: AWS S3 veya Azure Blob Storage entegrasyonu
- **Compression**: Otomatik dosya sıkıştırma
- **Watermark**: PDF dosyalarına filigran ekleme

### 6.2 API Geliştirmeleri
- **Versioning**: API versiyonlama sistemi
- **Rate Limiting**: Gelişmiş rate limiting
- **Caching**: Dosya metadata'ları için cache sistemi
- **Analytics**: Dosya kullanım istatistikleri

---

## 7. Hata Kodları ve Çözümleri

### 7.1 Yaygın Hatalar
| Hata Kodu | Açıklama | Çözüm |
|-----------|----------|-------|
| 400 | Desteklenmeyen dosya formatı | Desteklenen formatları kontrol edin |
| 413 | Dosya boyutu çok büyük | Dosya boyutunu 50MB altına indirin |
| 400 | Duplicate dosya | Dosya zaten yüklenmiş |
| 401 | Yetkisiz erişim | JWT token'ı kontrol edin |
| 403 | Yetersiz izin | Kullanıcı izinlerini kontrol edin |

### 7.2 Debug İpuçları
- **Network Tab**: Browser developer tools'da network isteklerini kontrol edin
- **Console Logs**: Server loglarını inceleyin
- **File Permissions**: Uploads klasörü yazma izinlerini kontrol edin
- **Storage Space**: Sunucu disk alanını kontrol edin

---

## Sorun Giderme

### "require is not defined" Hatası
Bu hata genellikle aşağıdaki durumlardan kaynaklanır:
- JWT token'ının süresi dolmuş olabilir
- Tarayıcı cache'i temizlenmesi gerekebilir
- Network bağlantı sorunları

**Çözüm Adımları:**
1. Yeni JWT token alın (login endpoint'ini kullanarak)
2. Request header'larını kontrol edin
3. Tarayıcı developer tools'da network tab'ını kontrol edin

### Test Edilen API Durumu (10 Ağustos 2025)
✅ **Dosya Yükleme API'si Aktif ve Çalışıyor**
- Endpoint: `POST /api/documents/upload`
- Başarılı test: 201 status kodu ile dosya yüklendi
- Audit logging çalışıyor
- Duplicate detection aktif
- Dosya hash hesaplama çalışıyor
- Permission sistemi düzeltildi ve çalışıyor
- Son test: Permission Test Success dosyası başarıyla yüklendi (ID: 23)

## Sonuç

Dosya yükleme API sisteminiz güvenli, ölçeklenebilir ve kapsamlı özellikler sunmaktadır. Tekil dosya yükleme ve toplu veri içe aktarma işlemleri için ayrı optimizasyonlar yapılmış, güvenlik önlemleri alınmış ve hata yönetimi implementasyonu tamamlanmıştır.

**Sistem Durumu:** ✅ Aktif ve çalışır durumda (10 Ağustos 2025)

Frontend entegrasyonu için yukarıdaki kod örneklerini kullanabilir, ihtiyaçlarınıza göre özelleştirebilirsiniz.