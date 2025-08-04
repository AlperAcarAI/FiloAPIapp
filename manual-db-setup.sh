#!/bin/bash
# Manuel Veritabanı Kurulum Script'i

# Renk tanımlamaları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Manuel Veritabanı Kurulumu${NC}"
echo "=========================="

# Bilgileri topla
echo "PostgreSQL bilgilerini girin:"
read -p "Host (localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port (5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Kullanıcı (postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Şifre: " DB_PASS
echo ""

read -p "Veritabanı adı (filoki_db): " DB_NAME
DB_NAME=${DB_NAME:-filoki_db}

echo ""
echo "Admin bilgileri:"
read -p "Admin email: " ADMIN_EMAIL
read -p "API Key: " API_KEY

# Veritabanı oluştur
echo "Veritabanı oluşturuluyor..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Veritabanı zaten mevcut"

# SQL dosyasını hazırla
if [ -f "production-full-database-setup.sql" ]; then
    echo "SQL dosyası güncelleniyor..."
    
    # Python script oluştur (sed yerine)
    cat > update_sql.py << 'EOF'
import sys

if len(sys.argv) != 5:
    print("Usage: python update_sql.py <admin_email> <admin_hash> <api_key> <api_hash>")
    sys.exit(1)

admin_email = sys.argv[1]
admin_hash = sys.argv[2]
api_key = sys.argv[3]
api_hash = sys.argv[4]

# SQL dosyasını oku
with open('production-full-database-setup.sql', 'r') as f:
    content = f.read()

# Değerleri güncelle
content = content.replace('admin@example.com', admin_email)
content = content.replace('$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK', admin_hash)
content = content.replace('ak_prod2025_rwba6dj1sw', api_key)
content = content.replace('$2b$10$EbPHkGCd/.4KM.OVdd1Hp.51vqCBEu67A/lpLzS6yFdFQA3Hep9AW', api_hash)

# Yeni dosyaya yaz
with open('temp_setup.sql', 'w') as f:
    f.write(content)

print("SQL dosyası güncellendi")
EOF

    # Hash'leri al (eğer yoksa)
    echo ""
    echo "Hash değerleri gerekiyor. .env dosyasından veya aşağıdaki komutlarla oluşturabilirsiniz:"
    echo ""
    echo -e "${YELLOW}Admin şifre hash'i için:${NC}"
    echo "node -e \"import('bcryptjs').then(b => b.hash('ŞİFRENİZ', 10).then(console.log))\""
    echo ""
    echo -e "${YELLOW}API key hash'i için:${NC}"
    echo "node -e \"import('bcryptjs').then(b => b.hash('$API_KEY', 10).then(console.log))\""
    echo ""
    
    read -p "Admin password hash: " ADMIN_HASH
    read -p "API key hash: " API_HASH
    
    # Python ile güncelle
    python3 update_sql.py "$ADMIN_EMAIL" "$ADMIN_HASH" "$API_KEY" "$API_HASH"
    
    # Veritabanına uygula
    echo "Veritabanı şeması uygulanıyor..."
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f temp_setup.sql
    
    # Temizlik
    rm update_sql.py temp_setup.sql
    
    echo -e "${GREEN}Veritabanı kurulumu tamamlandı!${NC}"
else
    echo "production-full-database-setup.sql bulunamadı!"
    echo "Drizzle kullanarak şema oluşturun:"
    echo "npm run db:push"
fi

echo ""
echo -e "${GREEN}Kurulum bilgileri:${NC}"
echo "Database: $DB_NAME"
echo "Admin: $ADMIN_EMAIL"
echo "API Key: $API_KEY"