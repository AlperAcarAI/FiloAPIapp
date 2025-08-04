#!/bin/bash
# Detaylı Login Debug Script

cd /home/root/FiloAPIapp
source .env

echo "=== Login Debug Detaylı ==="
echo ""

# 1. Kullanıcı kontrolü
echo "1. Veritabanındaki kullanıcı:"
PGPASSWORD="$DB_PASS" psql -h localhost -U postgres -d filoki_db -c "SELECT id, email, password_hash, role, is_active FROM users WHERE email='alper.acar@architectaiagency.com';"

echo ""
echo "2. Şifre hash kontrolü:"
# Test hash oluştur
node -e "
import('bcryptjs').then(async (bcrypt) => {
  const testHash = await bcrypt.hash('Acar', 10);
  console.log('Test hash: ' + testHash);
  
  // Veritabanındaki hash'i kontrol et
  const dbHash = process.argv[1];
  const isValid = await bcrypt.compare('Acar', dbHash);
  console.log('Hash doğrulama: ' + isValid);
});" "$DB_HASH"

echo ""
echo "3. PM2 error logları (son hatalar):"
pm2 logs filoki-api --err --lines 30 | grep -v "TLS_CERT" | grep -v "WebSocket"

echo ""
echo "4. Auth route kontrolü:"
# Auth dosyasını kontrol et
if [ -f "server/routes.ts" ]; then
    echo "routes.ts auth/login bölümü:"
    grep -A 20 -B 5 "auth/login" server/routes.ts || echo "auth/login route bulunamadı"
fi

echo ""
echo "5. Doğrudan bcrypt testi:"
# Manuel bcrypt test
cat > test-bcrypt.js << 'EOF'
import bcrypt from 'bcryptjs';

async function test() {
    const password = 'Acar';
    const hash = '$2b$10$MdD.2fLKJf2PqYLrbPfBIe/klxCnqGxPQMqo1Gtr8H2XEt9q6bREW'; // örnek hash
    
    console.log('Şifre:', password);
    console.log('Hash:', hash);
    
    try {
        const result = await bcrypt.compare(password, hash);
        console.log('Doğrulama sonucu:', result);
    } catch (error) {
        console.error('Bcrypt hatası:', error);
    }
}

test();
EOF

echo "Bcrypt testi:"
node test-bcrypt.js
rm test-bcrypt.js

echo ""
echo "=== Debug Tamamlandı ==="