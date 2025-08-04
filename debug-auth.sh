#!/bin/bash
# Auth Debug Script

cd /home/root/FiloAPIapp

# .env dosyasından bilgileri al
source .env

echo "=== Auth Debug ==="
echo ""

# 1. Veritabanı bağlantısını test et
echo "1. Veritabanı Bağlantı Testi:"
PGPASSWORD="$DB_PASS" psql -h localhost -U postgres -d "$DB_NAME" -c "SELECT version();" || echo "DB bağlantısı başarısız!"

echo ""
echo "2. Users tablosu kontrolü:"
PGPASSWORD="$DB_PASS" psql -h localhost -U postgres -d "$DB_NAME" -c "SELECT COUNT(*) as user_count FROM users;"

echo ""
echo "3. Admin kullanıcı kontrolü:"
PGPASSWORD="$DB_PASS" psql -h localhost -U postgres -d "$DB_NAME" -c "SELECT id, email, name, role FROM users WHERE email='alper.acar@architectaiagency.com';"

echo ""
echo "4. Password hash kontrolü:"
# Admin user hash'ini kontrol et
ADMIN_HASH=$(grep ADMIN_PASS_HASH .env | cut -d'=' -f2)
echo "ENV'deki admin hash: ${ADMIN_HASH:0:20}..."

echo ""
echo "5. Yeni kullanıcı ekleme (eğer yoksa):"
cat > add-user.sql << EOF
-- Kullanıcı yoksa ekle
INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES (
    'alper.acar@architectaiagency.com',
    '$ADMIN_HASH',
    'Alper Acar',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    updated_at = NOW();
EOF

echo "Kullanıcı ekleniyor/güncelleniyor..."
PGPASSWORD="$DB_PASS" psql -h localhost -U postgres -d "$DB_NAME" -f add-user.sql

echo ""
echo "6. Test login:"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alper.acar@architectaiagency.com","password":"Acar"}' | jq .

echo ""
echo "=== Debug Tamamlandı ==="