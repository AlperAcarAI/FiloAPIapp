/**
 * Basit SendPulse Mail Testi
 * Direkt sendpulse-api kullanarak mail gönderir
 */

const sendpulse = require('sendpulse-api');

// .env değerlerini kullan
const API_USER_ID = 'e0be24972fe34ff8892e95f91736e652';
const API_SECRET = 'b48abd47121633d8f535595cf0816512';
const SENDER_EMAIL = 'info@ersaulasim.com';
const SENDER_NAME = 'ERSA Ulaşım';
const RECIPIENT_EMAIL = 'info@ersaulasim.com';

console.log('═══════════════════════════════════════════════════');
console.log('  📧 SENDPULSE BASIT MAİL TESTİ                  ');
console.log('═══════════════════════════════════════════════════\n');

console.log('📝 Mail Bilgileri:');
console.log(`   📧 Gönderilecek: ${RECIPIENT_EMAIL}`);
console.log(`   📮 Gönderici: ${SENDER_EMAIL} (${SENDER_NAME})\n`);

console.log('⏳ SendPulse API başlatılıyor...\n');

// SendPulse API'yi başlat
sendpulse.init(API_USER_ID, API_SECRET, '/tmp/', (token) => {
  if (token) {
    console.log('✅ SendPulse API başlatıldı!');
    console.log('🔑 Token alındı\n');
    console.log('📨 Test maili gönderiliyor...\n');
    
    // Test mail içeriği
    const emailData = {
      html: `
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
                                Bu bir test mailidir. SendPulse entegrasyonu başarıyla çalışıyor! ✅
                            </p>
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #065f46; font-size: 14px;">
                                    <strong>✅ Başarılı!</strong> Mail entegrasyonu doğru şekilde yapılandırılmış.
                                </p>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                                Sistem artık personel kaydı yapıldığında otomatik olarak bilgilendirme maili gönderecek.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                © ${new Date().getFullYear()} ERSA Ulaşım<br>
                                ${new Date().toLocaleString('tr-TR')}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `,
      text: 'SendPulse Test Maili - Entegrasyon başarıyla çalışıyor!',
      subject: '🎉 SendPulse Test Maili - ERSA Ulaşım',
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
    };
    
    // Mail gönder
    sendpulse.smtpSendMail((data) => {
      console.log('📊 SendPulse Yanıtı:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      
      if (data.result === true || data.is_error === false) {
        console.log('✅ BAŞARILI! Mail gönderildi!\n');
        console.log('📬 Mail Detayları:');
        console.log('   Konu: 🎉 SendPulse Test Maili - ERSA Ulaşım');
        console.log('   Alıcı: ' + RECIPIENT_EMAIL);
        console.log('   Gönderici: ' + SENDER_EMAIL);
        console.log('   Format: HTML (Renkli & Responsive)\n');
        console.log('💡 Sonraki adımlar:');
        console.log('   1. 📧 ' + RECIPIENT_EMAIL + ' mail kutusunu kontrol edin');
        console.log('   2. 📁 Spam klasörünü de kontrol edin');
        console.log('   3. 📊 SendPulse istatistiklerini görün:');
        console.log('      https://login.sendpulse.com/ru/email/statistics\n');
        console.log('🎉 Test tamamlandı!');
      } else {
        console.log('❌ HATA! Mail gönderilemedi!\n');
        console.log('🔍 Olası nedenler:');
        console.log('   1. Gönderici e-posta adresi doğrulanmamış');
        console.log('   2. API limiti aşıldı');
        console.log('   3. SMTP ayarları hatalı\n');
        console.log('💡 Yapmanız gerekenler:');
        console.log('   1. SendPulse panelinde gönderici e-postanızı doğrulayın');
        console.log('      https://login.sendpulse.com/settings/sender_addresses');
        console.log('   2. API limitlerini kontrol edin');
        console.log('      https://login.sendpulse.com/settings/api');
      }
      console.log('\n═══════════════════════════════════════════════════\n');
    }, emailData);
    
  } else {
    console.log('❌ HATA! SendPulse API başlatılamadı!\n');
    console.log('🔍 Kontrol edin:');
    console.log('   1. API_USER_ID ve API_SECRET doğru mu?');
    console.log('   2. İnternet bağlantınız aktif mi?');
    console.log('   3. SendPulse hesabınız aktif mi?\n');
    console.log('═══════════════════════════════════════════════════\n');
  }
});
