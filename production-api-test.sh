#!/bin/bash

# =====================================
# PRODUCTION API TEST VE KONTROL SCRIPT
# Domain: filokiapi.architectaiagency.com
# =====================================

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Production bilgileri
PRODUCTION_URL="https://filokiapi.architectaiagency.com"
API_KEY="ak_prod2025_rwba6dj1sw"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Architect"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}PRODUCTION API TEST VE KONTROL${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Domain: ${YELLOW}$PRODUCTION_URL${NC}"
echo -e "Tarih: $(date)"
echo ""

# 1. API Health Check
echo -e "\n${YELLOW}1. API HEALTH CHECK${NC}"
health_status=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health")
if [ "$health_status" = "200" ]; then
    echo -e "${GREEN}✓ API çalışıyor (HTTP 200)${NC}"
else
    echo -e "${RED}✗ API yanıt vermiyor (HTTP $health_status)${NC}"
    exit 1
fi

# 2. CORS Header Kontrolü
echo -e "\n${YELLOW}2. CORS HEADER KONTROLÜ${NC}"
cors_origin=$(curl -s -I "$PRODUCTION_URL/api/health" | grep -i "access-control-allow-origin" | cut -d' ' -f2 | tr -d '\r')
echo "Mevcut CORS Origin: $cors_origin"
if [[ "$cors_origin" == *"yourdomain.com"* ]]; then
    echo -e "${RED}✗ CORS ayarı yanlış! Production'da düzeltilmeli.${NC}"
    echo -e "${YELLOW}➜ Beklenen: https://filokiapi.architectaiagency.com${NC}"
    echo -e "${YELLOW}➜ Mevcut: $cors_origin${NC}"
else
    echo -e "${GREEN}✓ CORS ayarı doğru${NC}"
fi

# 3. Admin Login Testi
echo -e "\n${YELLOW}3. ADMIN LOGIN TESTİ${NC}"
login_response=$(curl -s -X POST "$PRODUCTION_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$ADMIN_EMAIL\",
        \"password\": \"$ADMIN_PASSWORD\"
    }")

login_success=$(echo "$login_response" | jq -r '.success // false')
if [ "$login_success" = "true" ]; then
    echo -e "${GREEN}✓ Admin login başarılı${NC}"
    access_token=$(echo "$login_response" | jq -r '.data.accessToken')
    echo "Token alındı: ${access_token:0:30}..."
else
    echo -e "${RED}✗ Admin login başarısız${NC}"
    error=$(echo "$login_response" | jq -r '.error // .message // "Bilinmeyen hata"')
    echo "Hata: $error"
fi

# 4. API Key ile Test
echo -e "\n${YELLOW}4. API KEY İLE TEST${NC}"
echo "API Key: ${API_KEY:0:20}..."

# Companies endpoint testi
companies_response=$(curl -s -X GET "$PRODUCTION_URL/api/secure/companies" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json")

companies_success=$(echo "$companies_response" | jq -r '.success // false')
if [ "$companies_success" = "true" ]; then
    echo -e "${GREEN}✓ API Key authentication başarılı${NC}"
    company_count=$(echo "$companies_response" | jq -r '.data.totalCount // 0')
    echo "Şirket sayısı: $company_count"
else
    echo -e "${RED}✗ API Key authentication başarısız${NC}"
    error=$(echo "$companies_response" | jq -r '.error // .message // "Bilinmeyen hata"')
    echo "Hata: $error"
    
    echo -e "\n${YELLOW}Olası Sebepler:${NC}"
    echo "1. API Key production veritabanında mevcut değil"
    echo "2. Domain kısıtlaması (allowed_domains) uyumsuz"
    echo "3. Veritabanı bağlantı hatası"
fi

# 5. Production Deployment Kontrol Listesi
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}PRODUCTION DEPLOYMENT KONTROL LİSTESİ${NC}"
echo -e "${BLUE}=====================================${NC}"

echo -e "\n${YELLOW}📋 Kontrol Edilmesi Gerekenler:${NC}"
echo ""
echo "1. ${YELLOW}Environment Variables:${NC}"
echo "   - DATABASE_URL (Production PostgreSQL)"
echo "   - JWT_SECRET: f27294d1df02e868c14292ac48050d5d61f02e6e28708247434f2bac35a397d2"
echo "   - JWT_REFRESH_SECRET: f07cda845b33a9598c114bd1c41de50b82e9b29f549e230e5491b12a1371c8f4"
echo "   - CORS_ORIGIN: https://filokiapi.architectaiagency.com"
echo "   - NODE_ENV: production"
echo ""
echo "2. ${YELLOW}Database Setup:${NC}"
echo "   - Database migration çalıştırıldı mı? (npm run db:push)"
echo "   - Admin user oluşturuldu mu? (admin@example.com)"
echo "   - API Key tablosu dolu mu?"
echo ""
echo "3. ${YELLOW}API Key Setup:${NC}"
echo "   - API Key: ak_prod2025_rwba6dj1sw"
echo "   - Allowed domains: filokiapi.architectaiagency.com"
echo "   - Permissions: Tüm yetkiler"
echo ""
echo "4. ${YELLOW}SSL ve Domain:${NC}"
echo "   - SSL sertifikası aktif mi?"
echo "   - Domain DNS kayıtları doğru mu?"
echo ""

# 6. Düzeltme SQL'leri
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}PRODUCTION'DA ÇALIŞTIRMAK İÇİN SQL'LER${NC}"
echo -e "${BLUE}=====================================${NC}"

cat << 'EOF'

-- 1. API Client oluştur
INSERT INTO api_clients (name, company_id, is_active, created_at)
VALUES ('Production Main API', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- 2. API Key oluştur (hash edilmiş)
INSERT INTO api_keys (
    client_id,
    key_hash,
    permissions,
    allowed_domains,
    is_active,
    created_at
) VALUES (
    (SELECT id FROM api_clients WHERE name = 'Production Main API'),
    '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK', -- Bu hash test için
    ARRAY[
        'data:read', 'data:write', 'data:delete',
        'asset:read', 'asset:write', 'asset:delete',
        'fleet:read', 'fleet:write', 'fleet:delete',
        'document:read', 'document:write', 'document:delete',
        'company:read', 'company:write', 'company:delete',
        'admin:read', 'admin:write', 'admin:delete',
        'analytics:read', 'financial:read', 'financial:write'
    ],
    ARRAY[
        'filokiapi.architectaiagency.com',
        'https://filokiapi.architectaiagency.com',
        '*.architectaiagency.com'
    ],
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- 3. Admin user kontrolü
SELECT id, email, password_hash FROM users WHERE email = 'admin@example.com';

EOF

echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}TEST TAMAMLANDI${NC}"
echo -e "${BLUE}=====================================${NC}"