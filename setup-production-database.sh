#!/bin/bash

# FiloAPI Production Database Setup Script
# Bu script tüm veritabanı kurulumunu otomatik yapar

echo "🚀 FiloAPI Production Database Setup başlatılıyor..."

# Database connection details
DB_USER="filoki_user"
DB_NAME="filoki_db"
DB_PASSWORD="FilokiDB2025"
DB_HOST="localhost"
DB_PORT="5432"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "📊 Veritabanı bağlantısı test ediliyor..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Veritabanı bağlantısı başarısız!"
    echo "Lütfen PostgreSQL'in çalıştığından ve bağlantı bilgilerinin doğru olduğundan emin olun."
    exit 1
fi

echo "✅ Veritabanı bağlantısı başarılı!"

echo "🏗️  Tabloları oluşturuluyor..."
if psql "$DATABASE_URL" -f production-schema-setup.sql; then
    echo "✅ Tablolar başarıyla oluşturuldu!"
else
    echo "❌ Tablo oluşturma hatası!"
    exit 1
fi

echo "⚡ Index'ler oluşturuluyor..."
if psql "$DATABASE_URL" -f production-indexes-setup.sql; then
    echo "✅ Index'ler başarıyla oluşturuldu!"
else
    echo "❌ Index oluşturma hatası!"
    exit 1
fi

echo "🌱 Temel veriler ekleniyor..."
if psql "$DATABASE_URL" -f production-seed-data.sql; then
    echo "✅ Temel veriler başarıyla eklendi!"
else
    echo "❌ Temel veri ekleme hatası!"
    exit 1
fi

echo "🔍 Oluşturulan tabloları kontrol ediliyor..."
psql "$DATABASE_URL" -c "\dt" 

echo "📈 Tablo sayılarını kontrol ediliyor..."
psql "$DATABASE_URL" -c "
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;
"

echo "🎯 Admin kullanıcısı oluşturuluyor..."
psql "$DATABASE_URL" << 'EOSQL'
-- Admin personeli oluştur
INSERT INTO personnel (name, surname, tc_no, phone_no, status, is_active) 
VALUES ('Alper', 'Acar', 12345678901, '+905551234567', 'active', true)
ON CONFLICT (tc_no) DO NOTHING;

-- Admin kullanıcısı oluştur
INSERT INTO users (
    personnel_id, 
    username, 
    email, 
    password_hash, 
    role_id, 
    is_active, 
    email_verified
) 
VALUES (
    (SELECT id FROM personnel WHERE tc_no = 12345678901),
    'admin',
    'alper.acar@architectaiagency.com',
    '$2b$10$8K3H2KqG5Ub7RjN4Lp9fNeQVWx1YzA6Bc2Md3Ef8Gh4Ij5Kl0Mn7', -- "Acar" hash'i
    (SELECT id FROM roles WHERE name = 'admin'),
    true,
    true
)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    is_active = true;

-- Admin kullanıcısına tam yetki ver
INSERT INTO user_access_rights (
    user_id,
    access_level_id,
    access_scope,
    granted_by,
    is_active
)
VALUES (
    (SELECT id FROM users WHERE email = 'alper.acar@architectaiagency.com'),
    (SELECT id FROM access_levels WHERE code = 'HQ'),
    '{"scope": "global", "permissions": ["*"]}',
    (SELECT id FROM users WHERE email = 'alper.acar@architectaiagency.com'),
    true
)
ON CONFLICT DO NOTHING;
EOSQL

echo "🏁 Kurulum tamamlandı!"
echo ""
echo "📋 Kurulum Özeti:"
echo "   • Veritabanı: $DB_NAME"
echo "   • Kullanıcı: $DB_USER" 
echo "   • Host: $DB_HOST:$DB_PORT"
echo ""
echo "🔐 Admin Bilgileri:"
echo "   • Email: alper.acar@architectaiagency.com"
echo "   • Şifre: Acar"
echo "   • API Key: filoki-api-master-key-2025"
echo ""
echo "🧪 Test komutu:"
echo "curl -H 'X-API-Key: filoki-api-master-key-2025' http://localhost:5000/api/vehicles"
echo ""
echo "📚 API Docs: http://localhost:5000/api/docs"