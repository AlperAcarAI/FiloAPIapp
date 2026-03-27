# SendPulse E-posta Entegrasyonu Kurulum Talimatı

## 📋 Genel Bakış

Personel kaydı oluşturulduğunda otomatik olarak `alper.acar@dijiminds.com` adresine bilgilendirme maili gönderilir.

## 🔧 Kurulum Adımları

### 1. SendPulse API Bilgilerini Alma

1. [SendPulse](https://login.sendpulse.com) hesabınıza giriş yapın
2. Sağ üst köşedeki profil ikonuna tıklayın
3. **"Settings"** (Ayarlar) menüsüne gidin
4. Sol menüden **"API"** sekmesini seçin
5. Aşağıdaki bilgileri kopyalayın:
   - **API User ID** (ID)
   - **API Secret** (Secret)

### 2. .env Dosyasını Güncelleme

`.env` dosyasını açın ve aşağıdaki değerleri gerçek bilgilerinizle değiştirin:

```bash
# SendPulse Email Service Configuration
SENDPULSE_API_ID=YOUR_ACTUAL_API_ID_HERE
SENDPULSE_API_SECRET=YOUR_ACTUAL_API_SECRET_HERE
SENDPULSE_SENDER_EMAIL=noreply@filoki.com
SENDPULSE_SENDER_NAME=Sahacı Personel Sistemi
SENDPULSE_RECIPIENT_EMAIL=alper.acar@dijiminds.com
```

**Önemli Notlar:**
- `SENDPULSE_SENDER_EMAIL`: SendPulse'da onaylanmış bir gönderici e-posta adresi olmalıdır
- `SENDPULSE_RECIPIENT_EMAIL`: Mail alacak kişinin e-posta adresi (şu an: alper.acar@dijiminds.com)

### 3. SendPulse'da Gönderici E-posta Onaylama

SendPulse'un mailinizi göndermesine izin vermek için:

1. SendPulse panelinde **"Settings"** > **"Sender addresses"** menüsüne gidin
2. **"Add sender address"** butonuna tıklayın
3. Gönderici e-posta adresinizi ekleyin (örn: noreply@filoki.com)
4. Doğrulama mailini kontrol edin ve onaylayın

### 4. Sunucuyu Yeniden Başlatma

.env dosyasını güncelledikten sonra sunucuyu yeniden başlatın:

```bash
npm run dev
# veya production için
pm2 restart ecosystem.config.cjs
```

## ✅ Test Etme

Yeni bir personel kaydı oluşturarak testi yapabilirsiniz:

```bash
curl -X POST https://your-domain.com/api/secure/personnel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "surname": "Personel",
    "phoneNo": "555-1234",
    "isActive": true
  }'
```

Başarılı olursa:
- Personel veritabanına kaydedilir
- `alper.acar@dijiminds.com` adresine bilgilendirme maili gönderilir
- Konsol loglarında ✅ başarı mesajı görürsünüz

## 📧 E-posta İçeriği

Gönderilen mailte şu bilgiler yer alır:
- 👤 Ad Soyad
- 🆔 TC Kimlik No
- 📅 Doğum Tarihi
- 🌍 Uyruk Bilgisi
- 🏙️ Doğum Yeri
- 📍 Adres
- 📞 Telefon
- 💳 IBAN
- ✅ Durum (Aktif/Pasif)

## 🔍 Sorun Giderme

### Mail Gönderilmiyor

1. **API Bilgilerini Kontrol Edin:**
   - `.env` dosyasındaki `SENDPULSE_API_ID` ve `SENDPULSE_API_SECRET` doğru mu?
   - API bilgilerinde boşluk veya ekstra karakter var mı?

2. **Konsol Loglarını Kontrol Edin:**
   ```bash
   # Başarılı
   ✅ SendPulse API initialized successfully
   ✅ Personnel creation email sent successfully: [Name] [Surname]
   
   # Hatalı
   ❌ SendPulse API initialization failed
   ⚠️ Email gönderimi sırasında hata oluştu
   ```

3. **Gönderici E-posta Onaylı mı?**
   - SendPulse panelinde "Sender addresses" bölümünü kontrol edin
   - E-posta adresi "Verified" (Onaylanmış) durumda olmalı

4. **SendPulse Hesap Limitleri:**
   - Ücretsiz hesaplarda aylık mail limiti var mı kontrol edin
   - SMTP/API kullanım kotanızı kontrol edin

### Mail Gönderimi Personel Kaydını Etkilemez

**Önemli:** Mail gönderimi başarısız olsa bile personel kaydı başarıyla tamamlanır. Bu tasarım şu şekilde çalışır:

```javascript
// Mail asenkron olarak gönderilir
sendPulseService.sendPersonnelCreatedEmail({...})
  .catch(err => {
    // Hata olsa bile personel kaydı tamamlanmış olur
    console.error('⚠️ Email gönderimi sırasında hata oluştu');
  });

// Personel kaydı başarılı response döner
res.status(201).json({ success: true, ... });
```

## 📝 Alıcı E-postasını Değiştirme

Farklı bir e-posta adresine göndermek için `.env` dosyasında:

```bash
SENDPULSE_RECIPIENT_EMAIL=yeni-email@domain.com
```

Birden fazla alıcıya göndermek isterseniz, `server/sendpulse-service.ts` dosyasındaki `to` array'ini düzenleyin:

```typescript
to: [
  { name: 'Alper Acar', email: 'alper.acar@dijiminds.com' },
  { name: 'İK Departmanı', email: 'ik@filoki.com' }
]
```

## 🎨 E-posta Tasarımını Özelleştirme

E-posta şablonunu özelleştirmek için `server/sendpulse-service.ts` dosyasındaki `generateEmailHTML` metodunu düzenleyin.

Renkleri değiştirmek için gradient ve border renklerini güncelleyin:

```typescript
// Başlık gradient'i
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Kart border renkleri
border-left: 4px solid #667eea;
```

## 📞 Destek

Sorun yaşarsanız:
1. Konsol loglarını kontrol edin
2. SendPulse panel > API > Logs bölümünü kontrol edin
3. `.env` dosyasındaki bilgilerin doğruluğunu tekrar kontrol edin

---

**Son Güncelleme:** 30.12.2025
**Versiyon:** 1.0.0
