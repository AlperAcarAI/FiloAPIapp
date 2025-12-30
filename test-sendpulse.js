/**
 * SendPulse E-posta Entegrasyonu Test Scripti
 * 
 * Bu script, personel kaydı oluşturarak SendPulse mail gönderimini test eder.
 */

const API_BASE_URL = 'http://localhost:5001';
const API_KEY = 'ak_prod2025_rwba6dj1sw'; // .env'deki DEFAULT_API_KEY

// Test personel verisi
const testPersonnel = {
  name: 'Test',
  surname: 'Personel',
  tcNo: '12345678901',
  birthdate: '1990-01-15',
  phoneNo: '+90 555 123 4567',
  address: 'Test Mahallesi, Test Sokak No:1 Ankara',
  iban: 'TR330006100519786457841326',
  status: 'aktif',
  isActive: true,
  nationId: 1, // Türkiye (eğer countries tablosunda varsa)
  birthplaceId: 1 // Ankara (eğer cities tablosunda varsa)
};

async function testPersonnelCreation() {
  console.log('🚀 SendPulse E-posta Testi Başlatılıyor...\n');
  
  try {
    console.log('📝 Test Personel Bilgileri:');
    console.log(`   👤 Ad Soyad: ${testPersonnel.name} ${testPersonnel.surname}`);
    console.log(`   🆔 TC No: ${testPersonnel.tcNo}`);
    console.log(`   📞 Telefon: ${testPersonnel.phoneNo}`);
    console.log(`   📧 Mail gönderilecek: info@ersaulasim.com\n`);

    console.log('⏳ API\'ye istek gönderiliyor...\n');

    const response = await fetch(`${API_BASE_URL}/api/secure/personnel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(testPersonnel)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ BAŞARILI! Personel kaydı oluşturuldu!\n');
      console.log('📊 Yanıt Detayları:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📧 E-posta Durumu:');
      console.log('   ℹ️  Mail gönderimi asenkron olarak gerçekleştirildi');
      console.log('   📬 Alıcı: info@ersaulasim.com');
      console.log('   📮 Gönderici: info@ersaulasim.com (ERSA Ulaşım)');
      console.log('\n💡 Sunucu konsol loglarını kontrol edin:');
      console.log('   ✅ SendPulse API initialized successfully');
      console.log('   ✅ Personnel creation email sent successfully: Test Personel');
      console.log('\n🎉 Test Tamamlandı! Mail kutunuzu kontrol edin.');
      
      // Oluşturulan personel ID'sini kaydet
      if (data.data && data.data.personnel && data.data.personnel.id) {
        console.log(`\n🗑️  Test personeli silmek için:\n   DELETE ${API_BASE_URL}/api/secure/personnel/${data.data.personnel.id}`);
      }
      
    } else {
      console.error('❌ HATA! Personel kaydı oluşturulamadı!\n');
      console.error('📊 Hata Detayları:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.error === 'DUPLICATE_TC_NO') {
        console.log('\n💡 Bu TC No daha önce kullanılmış. Test için farklı bir TC No deneyin.');
      }
      
      if (data.error === 'INVALID_NATION_ID' || data.error === 'INVALID_CITY_ID') {
        console.log('\n💡 nationId veya birthplaceId değerlerini veritabanınızdaki gerçek ID\'lerle değiştirin.');
      }
    }

  } catch (error) {
    console.error('❌ BAĞLANTI HATASI!\n');
    console.error('Hata:', error.message);
    console.log('\n💡 Sunucunun çalıştığından emin olun:');
    console.log('   npm run dev');
    console.log(`   Sunucu adresi: ${API_BASE_URL}`);
  }
}

async function checkServerHealth() {
  console.log('🔍 Sunucu durumu kontrol ediliyor...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    
    if (response.ok) {
      console.log('✅ Sunucu çalışıyor!\n');
      return true;
    } else {
      console.log('⚠️  Sunucu yanıt verdi ama bir sorun var.\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Sunucuya bağlanılamadı!\n');
    console.log('💡 Sunucuyu başlatın:');
    console.log('   cd /Users/acar/FiloAPIapp');
    console.log('   npm run dev\n');
    return false;
  }
}

// Ana test fonksiyonu
async function runTest() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  📧 SENDPULSE E-POSTA ENTEGRASYONu TEST          ');
  console.log('═══════════════════════════════════════════════════\n');

  const serverRunning = await checkServerHealth();
  
  if (!serverRunning) {
    console.log('❌ Test iptal edildi. Önce sunucuyu başlatın.\n');
    process.exit(1);
  }

  await testPersonnelCreation();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  📝 SONRAKI ADIMLAR                              ');
  console.log('═══════════════════════════════════════════════════');
  console.log('1. 📧 info@ersaulasim.com mail kutusunu kontrol edin');
  console.log('2. 📊 Sunucu konsol loglarını inceleyin');
  console.log('3. 🔍 SendPulse panelinde mail gönderim loglarını kontrol edin');
  console.log('   https://login.sendpulse.com/ru/email/statistics');
  console.log('═══════════════════════════════════════════════════\n');
}

// Testi başlat
runTest();
