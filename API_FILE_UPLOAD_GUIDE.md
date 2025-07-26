# API ile Dosya Yükleme Rehberi

## Genel Bilgiler

API endpoint'imiz başka uygulamalardan dosya yüklemek için hazırlanmıştır. Güvenlik için API Key gereklidir.

### Endpoint Bilgileri
- **URL**: `POST /api/secure/documents/upload`
- **Authentication**: API Key (Header: `X-API-Key`)
- **Content-Type**: `multipart/form-data`
- **Demo API Key**: `ak_demo2025key`

### Desteklenen Dosya Tipleri
- PDF: `application/pdf`
- Resimler: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Text: `text/plain`

### Maksimum Dosya Boyutu
50MB (52,428,800 bytes)

## JavaScript/Node.js Örneği

```javascript
// Form data ile dosya gönderme
const uploadFiles = async (assetId, docTypeId, files, description = '') => {
  const formData = new FormData();
  
  // Gerekli parametreler
  formData.append('assetId', assetId.toString());
  formData.append('docTypeId', docTypeId.toString());
  
  // Opsiyonel açıklama
  if (description) {
    formData.append('description', description);
  }
  
  // Dosyaları ekle (birden fazla dosya desteklenir)
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await fetch('http://your-server.com/api/secure/documents/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': 'ak_demo2025key' // Gerçek API key kullanın
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    const result = await response.json();
    console.log('Upload successful:', result);
    return result;
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Kullanım örneği
const fileInput = document.getElementById('fileInput');
const files = Array.from(fileInput.files);

uploadFiles(1, 15, files, 'Test belgesi yükleme')
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

## cURL Örneği

```bash
# Tek dosya yükleme
curl -X POST "http://your-server.com/api/secure/documents/upload" \
  -H "X-API-Key: ak_demo2025key" \
  -F "assetId=1" \
  -F "docTypeId=15" \
  -F "description=Test belgesi" \
  -F "files=@/path/to/your/document.pdf"

# Birden fazla dosya yükleme
curl -X POST "http://your-server.com/api/secure/documents/upload" \
  -H "X-API-Key: ak_demo2025key" \
  -F "assetId=1" \
  -F "docTypeId=15" \
  -F "description=Birden fazla belge" \
  -F "files=@/path/to/document1.pdf" \
  -F "files=@/path/to/document2.jpg"
```

## Python Örneği

```python
import requests

def upload_files(asset_id, doc_type_id, file_paths, description=''):
    url = 'http://your-server.com/api/secure/documents/upload'
    headers = {
        'X-API-Key': 'ak_demo2025key'
    }
    
    data = {
        'assetId': str(asset_id),
        'docTypeId': str(doc_type_id),
        'description': description
    }
    
    files = []
    try:
        # Dosyaları aç
        for file_path in file_paths:
            files.append(('files', open(file_path, 'rb')))
        
        response = requests.post(url, headers=headers, data=data, files=files)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {'error': response.text}
            raise Exception(f"Upload failed: {error_data}")
            
    finally:
        # Dosyaları kapat
        for _, file_obj in files:
            file_obj.close()

# Kullanım
try:
    result = upload_files(
        asset_id=1,
        doc_type_id=15,
        file_paths=['/path/to/document1.pdf', '/path/to/image.jpg'],
        description='Python ile yüklenen belgeler'
    )
    print('Upload successful:', result)
except Exception as e:
    print('Upload error:', e)
```

## PHP Örneği

```php
<?php
function uploadFiles($assetId, $docTypeId, $filePaths, $description = '') {
    $url = 'http://your-server.com/api/secure/documents/upload';
    
    $postData = [
        'assetId' => $assetId,
        'docTypeId' => $docTypeId,
        'description' => $description
    ];
    
    // Dosyaları ekle
    foreach ($filePaths as $filePath) {
        if (file_exists($filePath)) {
            $postData['files[]'] = new CURLFile($filePath);
        }
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ak_demo2025key'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        throw new Exception("Upload failed: " . $response);
    }
}

// Kullanım
try {
    $result = uploadFiles(
        1, 
        15, 
        ['/path/to/document.pdf', '/path/to/image.jpg'],
        'PHP ile yüklenen belgeler'
    );
    echo "Upload successful: " . json_encode($result);
} catch (Exception $e) {
    echo "Upload error: " . $e->getMessage();
}
?>
```

## C# Örneği

```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

public class DocumentUploader
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    
    public DocumentUploader(string apiKey = "ak_demo2025key")
    {
        _httpClient = new HttpClient();
        _apiKey = apiKey;
    }
    
    public async Task<string> UploadFilesAsync(int assetId, int docTypeId, string[] filePaths, string description = "")
    {
        var url = "http://your-server.com/api/secure/documents/upload";
        
        using (var formData = new MultipartFormDataContent())
        {
            // API Key header
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _apiKey);
            
            // Form parametreleri
            formData.Add(new StringContent(assetId.ToString()), "assetId");
            formData.Add(new StringContent(docTypeId.ToString()), "docTypeId");
            
            if (!string.IsNullOrEmpty(description))
            {
                formData.Add(new StringContent(description), "description");
            }
            
            // Dosyaları ekle
            foreach (var filePath in filePaths)
            {
                if (File.Exists(filePath))
                {
                    var fileBytes = await File.ReadAllBytesAsync(filePath);
                    var fileName = Path.GetFileName(filePath);
                    formData.Add(new ByteArrayContent(fileBytes), "files", fileName);
                }
            }
            
            var response = await _httpClient.PostAsync(url, formData);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            if (response.IsSuccessStatusCode)
            {
                return responseContent;
            }
            else
            {
                throw new Exception($"Upload failed: {responseContent}");
            }
        }
    }
}

// Kullanım
var uploader = new DocumentUploader();
try
{
    var result = await uploader.UploadFilesAsync(
        1, 
        15, 
        new[] { @"C:\path\to\document.pdf", @"C:\path\to\image.jpg" },
        "C# ile yüklenen belgeler"
    );
    Console.WriteLine($"Upload successful: {result}");
}
catch (Exception ex)
{
    Console.WriteLine($"Upload error: {ex.Message}");
}
```

## Request Parameters

### Gerekli Parametreler
- `assetId` (integer): Varlık ID'si
- `docTypeId` (integer): Dokuman kategorisi ID'si  
- `files` (file array): Yüklenecek dosya(lar)

### Opsiyonel Parametreler
- `description` (string): Dosya açıklaması

## Response Format

### Başarılı Response (200)
```json
{
  "success": true,
  "message": "Dosyalar başarıyla yüklendi.",
  "data": {
    "uploadedFiles": [
      {
        "id": 1,
        "fileName": "document.pdf",
        "fileSize": 1024576,
        "mimeType": "application/pdf",
        "assetId": 1,
        "docTypeId": 15
      }
    ],
    "successCount": 1,
    "failedCount": 0
  }
}
```

### Hata Response (400/413/500)
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

## Dokuman Kategorileri

Dokuman kategorilerini öğrenmek için:
```bash
curl -X GET "http://your-server.com/api/secure/getDocTypes" \
  -H "X-API-Key: ak_demo2025key"
```

## Güvenlik Notları

1. **API Key**: Gerçek uygulamada güvenli bir API key kullanın
2. **HTTPS**: Üretim ortamında HTTPS kullanın
3. **File Validation**: Dosya tiplerini client tarafında da kontrol edin
4. **Size Limits**: 50MB sınırını aşmayın

## Hata Kodları

- `400`: Geçersiz parametreler veya dosya formatı
- `401`: Geçersiz API key
- `403`: Yetkisiz erişim
- `413`: Dosya boyutu çok büyük
- `500`: Server hatası

## Test Endpoint'i

Sisteminizi test etmek için demo endpoint'i kullanabilirsiniz:
```bash
curl -X GET "http://your-server.com/api/secure/data" \
  -H "X-API-Key: ak_demo2025key"
```