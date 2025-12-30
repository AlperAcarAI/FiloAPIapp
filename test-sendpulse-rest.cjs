/**
 * SendPulse REST API ile Test Mail Gönderimi
 * Direkt REST API kullanılarak mail gönderilir
 */

const https = require('https');

// .env değerleri
const API_USER_ID = 'e0be24972fe34ff8892e95f91736e652';
const API_SECRET = 'b48abd47121633d8f535595cf0816512';
const SENDER_EMAIL = 'info@ersaulasim.com';
const SENDER_NAME = 'ERSA Ulaşım';
const RECIPIENT_EMAIL = 'info@ersaulasim.com';

console.log('═══════════════════════════════════════════════════');
console.log('  📧 SENDPULSE REST API MAİL TESTİ              ');
console.log('═══════════════════════════════════════════════════\n');

// Adım 1: Access Token Al
function getAccessToken() {
  return new Promise((resolve, reject) => {
    console.log('🔐 1. Adım: Access Token alınıyor...\n');
    
    const postData = JSON.stringify({
      grant_type: 'client_credentials',
      client_id: API_USER_ID,
      client_secret: API_SECRET
    });

    const options = {
      hostname: 'api.sendpulse.com',
      port: 443,
      path: '/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            console.log('✅ Access Token alındı!');
            console.log(`   Token: ${response.access_token.substring(0, 50)}...`);
            console.log(`   Geçerlilik: ${response.expires_in} saniye\n`);
            resolve(response.access_token);
          } else {
            console.error('❌ Token alınamadı!');
            console.error('Yanıt:', data);
            reject(new Error('Token alınamadı'));
          }
        } catch (error) {
          console.error('❌ JSON parse hatası:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ İstek hatası:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Adım 2: Mail Gönder
function sendEmail(accessToken) {
  return new Promise((resolve, reject) => {
    console.log('📨 2. Adım: Mail gönderiliyor...\n');

    // HTML içeriğini Base64'e encode et
    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Mail</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                                🎉 SendPulse Test Maili
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                ERSA Ulaşım Personel Sistemi
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                                Merhaba! 👋
                            </p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Bu bir test mailidir. SendPulse REST API entegrasyonu başarıyla çalışıyor! ✅
                            </p>
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #065f46; font-size: 14px;">
                                    <strong>✅ Başarılı!</strong> Personel kaydı yapıldığında otomatik mail gönderimi aktif.
                                </p>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                                Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                © ${new Date().getFullYear()} ERSA Ulaşım Personel Sistemi
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const htmlBase64 = Buffer.from(htmlContent).toString('base64');

    const emailData = {
      email: {
        html: htmlBase64,
        text: 'SendPulse REST API Test - Entegrasyon başarıyla çalışıyor!',
        subject: '🎉 SendPulse Test - ERSA Ulaşım Personel Sistemi',
        from: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [
          {
            name: 'Test Alıcı',
            email: RECIPIENT_EMAIL
          }
        ]
      }
    };

    const postData = JSON.stringify(emailData);

    const options = {
      hostname: 'api.sendpulse.com',
      port: 443,
      path: '/smtp/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📊 SendPulse Yanıtı:');
        console.log(data);
        console.log('');

        try {
          const response = JSON.parse(data);
          
          if (response.result === true || response.id) {
            console.log('✅ BAŞARILI! Mail gönderildi!\n');
            console.log('📬 Mail Detayları:');
            console.log('   ID: ' + (response.id || 'N/A'));
            console.log('   Konu: 🎉 SendPulse Test - ERSA Ulaşım');
            console.log('   Alıcı: ' + RECIPIENT_EMAIL);
            console.log('   Gönderici: ' + SENDER_EMAIL);
            console.log('   Format: HTML (Base64 Encoded)\n');
            console.log('💡 Sonraki adımlar:');
            console.log('   1. 📧 ' + RECIPIENT_EMAIL + ' mail kutusunu kontrol edin');
            console.log('   2. 📁 Spam klasörünü de kontrol edin');
            console.log('   3. 📊 SendPulse istatistiklerini görün:');
            console.log('      https://login.sendpulse.com/ru/email/statistics\n');
            console.log('🎉 Test tamamlandı!');
            resolve(response);
          } else {
            console.log('❌ HATA! Mail gönderilemedi!\n');
            console.log('🔍 Olası nedenler:');
            console.log('   1. Gönderici e-posta adresi doğrulanmamış');
            console.log('   2. API limiti aşıldı');
            console.log('   3. SMTP ayarları hatalı');
            reject(new Error('Mail gönderilemedi'));
          }
        } catch (error) {
          console.error('❌ Yanıt parse edilemedi:', error.message);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ İstek hatası:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Ana fonksiyon
async function main() {
  try {
    console.log('📝 Mail Bilgileri:');
    console.log(`   📧 Gönderilecek: ${RECIPIENT_EMAIL}`);
    console.log(`   📮 Gönderici: ${SENDER_EMAIL} (${SENDER_NAME})\n`);

    const accessToken = await getAccessToken();
    await sendEmail(accessToken);
    
    console.log('\n═══════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ BEKLENMEDIK HATA!');
    console.error('Hata:', error.message);
    console.log('\n═══════════════════════════════════════════════════\n');
  }
}

// Programı başlat
main();
