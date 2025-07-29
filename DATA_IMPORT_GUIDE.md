# 28.000 Satır Google Sheets Veri İçe Aktarma Rehberi

## Yöntem 1: CSV Export + Bulk Import (Önerilen)

### Adım 1: Google Sheets'ten CSV Export
1. Google Sheets'i açın
2. File > Download > Comma Separated Values (.csv)
3. Dosyayı yerel bilgisayarınıza indirin

### Adım 2: CSV Upload API Geliştirme
Büyük veri setleri için özel bulk import API'si geliştirebiliriz:

```bash
# CSV dosya yükleme endpoint'i
POST /api/secure/bulk-import/csv
```

**Özellikler:**
- Batch processing (1000'er satır gruplarında)
- Progress tracking
- Error handling ve validation
- Duplicate detection
- Transaction rollback desteği

### Adım 3: Veri Mapping
Hangi tabloya hangi kolonların eşleşeceğini belirtmeniz gerekir:

**Mevcut Tablolar:**
- `assets` (araçlar)
- `personnel` (personel)
- `companies` (şirketler) 
- `fuel_records` (yakıt kayıtları)
- `financial` tablolar
- Reference tablolar (şehirler, markalar vb.)

## Yöntem 2: Google Sheets API Entegrasyonu

### Direct Google Sheets API
```bash
# Google Sheets API ile direkt okuma
GET /api/secure/import/google-sheets/{sheet_id}
```

**Gereksinimler:**
- Google Sheets API Key
- Sheet ID
- Real-time sync özellikleri

## Yöntem 3: Excel/XLSX Import

```bash
# Excel dosya yükleme
POST /api/secure/bulk-import/xlsx
```

## Teknik Detaylar

### Performans Optimizasyonları
- **Batch Size:** 1000 satır/batch
- **Memory Management:** Stream processing
- **Database:** Bulk insert transactions
- **Validation:** Schema validation her batch için

### Error Handling
- İşlem sırasında hata durumunda rollback
- Hatalı satırlar için detaylı log
- Resume from checkpoint özelliği

### Progress Tracking
- Real-time progress bar
- ETA hesaplama
- İşlem durumu API'si

## Hangi Yöntemi Seçmeliyiz?

Lütfen şu bilgileri paylaşın:

1. **Veri Türü:** Hangi tür veri? (araç, personel, yakıt kayıtları vb.)
2. **Kolon Yapısı:** Google Sheets'teki kolonlar neler?
3. **Güncellik:** Tek seferlik import mi, yoksa düzenli sync mi?
4. **Veri Kalitesi:** Temizleme gerekiyor mu?

Bu bilgilere göre en uygun import yöntemini geliştiririz.