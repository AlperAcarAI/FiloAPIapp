#!/bin/bash
# Password Fix Script

cd /home/root/FiloAPIapp

# .env dosyasından bilgileri al
source .env

echo "=== Şifre Düzeltme ==="

# 1. Yeni hash oluştur
echo "1. 'Acar' şifresi için hash oluşturuluyor..."
NEW_HASH=$(node -e "
import('bcryptjs').then(bcrypt => {
  bcrypt.hash('Acar', 10).then(hash => console.log(hash));
});
" 2>/dev/null)

echo "Yeni hash: $NEW_HASH"

# 2. Veritabanında güncelle
echo ""
echo "2. Veritabanında güncelleniyor..."
PGPASSWORD="$DB_PASS" psql -h localhost -U postgres -d "$DB_NAME" << EOF
UPDATE users 
SET password_hash = '$NEW_HASH'
WHERE email = 'alper.acar@architectaiagency.com';

-- Güncellemeyi kontrol et
SELECT email, password_hash 
FROM users 
WHERE email = 'alper.acar@architectaiagency.com';
EOF

# 3. Login testi
echo ""
echo "3. Login testi yapılıyor..."
sleep 1

RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alper.acar@architectaiagency.com","password":"Acar"}')

echo "Login yanıtı:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Token'ı kontrol et
if echo "$RESPONSE" | grep -q "token"; then
    echo ""
    echo "✓ Login başarılı!"
    TOKEN=$(echo "$RESPONSE" | jq -r '.token // .access_token // empty')
    echo "Token alındı: ${TOKEN:0:30}..."
else
    echo ""
    echo "✗ Login hala başarısız. PM2 loglarını kontrol edin:"
    echo "pm2 logs filoki-api --err --lines 20"
fi