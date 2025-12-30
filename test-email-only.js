/**
 * Sadece SendPulse Mail Gönderimi Test Scripti
 * Personel kaydı oluşturmadan direkt mail gönderir
 */

import { sendPulseService } from './server/sendpulse-service.js';

console.log('═══════════════════════════════════════════════════');
console.log('  📧 SENDPULSE E-POSTA TEST (Sadece Mail)        ');
console.log('═══════════════════════════════════════════════════\n');

// Test personel verisi (sadece mail için)
const testPersonnelData = {
  name: 'Ahmet',
  surname: 'Test',
  tcNo: '12345678901',
  birthdate: '1990-05-20',
  nationName: 'Türkiye',
  birthplaceName: 'Ankara',
  address: 'Test Mahallesi, Test Sokak No: 42, Çankaya/Ankara',
  phoneNo: '+90 555 123 45 67',
  iban: 'TR33 0006 1005 1978 6457 8413 26',
  status: 'Aktif',
  isActive: true,
  companyId: 1
};

console.log('📝 Test Mail Bilgileri:');
console.log(`   👤 Ad Soyad: ${testPersonnelData.name} ${testPersonnelData.surname}`);
console.log(`   🆔 TC No: ${testPersonnelData.tcNo}`);
console.log(`   📞 Telefon: ${testPersonnelData.phoneNo}`);
console.log(`   📧 Gönderilecek: info@ersaulasim.com`);
console.log(`   📮 Gönderici: info@ersaulasim.com (ERSA Ulaşım)\n`);

console.log('⏳ SendPulse servisinin başlatılması bekleniyor...');

// SendPulse servisinin initialize olması için 2 saniye bekle
setTimeout(async () => {
  console.log('📨 Mail gönderiliyor...\n');
  
  try {
    const result = await sendPulseService.sendPersonnelCreatedEmail(testPersonnelData);
    
    if (result) {
      console.log('✅ BAŞARILI! Mail gönderildi!\n');
      console.log('📬 Mail Detayları:');
      console.log('   Konu: 🎉 Yeni Personel Kaydı: Ahmet Test');
      console.log('   Alıcı: info@ersaulasim.com');
      console.log('   Format: HTML (Renkli & Responsive)');
      console.log('\n💡 Şimdi yapmanız gerekenler:');
      console.log('   1. info@ersaulasim.com mail kutusunu kontrol edin');
      console.log('   2. Spam klasörünü de kontrol edin');
      console.log('   3. SendPulse panelinde istatistikleri görün:');
      console.log('      https://login.sendpulse.com/ru/email/statistics\n');
      console.log('🎉 Test tamamlandı!');
    } else {
      console.log('❌ HATA! Mail gönderilemedi!\n');
      console.log('🔍 Olası nedenler:');
      console.log('   1. SendPulse API başlatılamadı');
      console.log('   2. Gönderici e-posta adresi doğrulanmamış');
      console.log('   3. API limiti aşıldı');
      console.log('\n💡 SendPulse panelini kontrol edin:');
      console.log('   https://login.sendpulse.com/settings/api');
    }
  } catch (error) {
    console.error('❌ BEKLENMEDIK HATA!\n');
    console.error('Hata detayı:', error.message);
    console.error('\nTam hata:', error);
  }
  
  console.log('\n═══════════════════════════════════════════════════\n');
}, 2000);
