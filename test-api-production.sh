#!/bin/bash

# ===================================
# FİLOKİ API PRODUCTION TEST SCRIPT
# Domain: filokiapi.architectaiagency.com
# ===================================

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Bilgileri
API_KEY="ak_prod2025_rwba6dj1sw"
BASE_URL="http://localhost:5000"
ORIGIN="https://filokiapi.architectaiagency.com"

# Test sayacı
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test fonksiyonu
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${YELLOW}[$TOTAL_TESTS] Test: $test_name${NC}"
    echo "Method: $method"
    echo "Endpoint: $endpoint"
    
    # Curl komutu
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -H "Origin: $ORIGIN")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -H "Origin: $ORIGIN" \
            -d "$data")
    fi
    
    # HTTP status kodu al
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d' | jq -r '.')
    
    # Başarı kontrolü
    success=$(echo "$body" | jq -r '.success // false')
    
    if [ "$success" = "true" ] && [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ BAŞARILI${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Veri özetini göster
        if [ "$method" = "GET" ]; then
            count=$(echo "$body" | jq -r '.data.totalCount // .data | length // 0')
            echo "Kayıt sayısı: $count"
        else
            message=$(echo "$body" | jq -r '.message // "Başarılı"')
            echo "Mesaj: $message"
        fi
    else
        echo -e "${RED}✗ BAŞARISIZ${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "HTTP Status: $http_code (Beklenen: $expected_status)"
        error=$(echo "$body" | jq -r '.error // .message // "Bilinmeyen hata"')
        echo "Hata: $error"
    fi
}

# ===================================
# 1. AUTHENTICATION TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== AUTHENTICATION TESTLERİ ===${NC}"

# Login testi
echo -e "\n${YELLOW}[AUTH] Admin Login Testi${NC}"
login_response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "Architect"
    }' | jq -r '.')

login_success=$(echo "$login_response" | jq -r '.success')
if [ "$login_success" = "true" ]; then
    echo -e "${GREEN}✓ Login başarılı${NC}"
    access_token=$(echo "$login_response" | jq -r '.data.accessToken')
    echo "Token alındı: ${access_token:0:50}..."
else
    echo -e "${RED}✗ Login başarısız${NC}"
fi

# ===================================
# 2. ŞİRKET YÖNETİMİ TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== ŞİRKET YÖNETİMİ TESTLERİ ===${NC}"

# Şirket listesi
run_test "Şirket Listesi" "GET" "/api/secure/companies" ""

# Tek şirket detayı
run_test "Şirket Detayı (ID:1)" "GET" "/api/secure/companies/1" ""

# Yeni şirket ekle
# run_test "Yeni Şirket Ekle" "POST" "/api/secure/companies" '{
#     "name": "Test Firma Ltd. Şti.",
#     "taxNo": "9876543210",
#     "taxOffice": "Kadıköy Vergi Dairesi",
#     "address": "Test Mahallesi, Test Sokak No:123",
#     "phone": "+90 216 555 4444",
#     "cityId": 34,
#     "isActive": true
# }' "201"

# ===================================
# 3. ARAÇ YÖNETİMİ TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== ARAÇ YÖNETİMİ TESTLERİ ===${NC}"

# Araç listesi
run_test "Araç Listesi" "GET" "/api/secure/assets" ""

# Aktif araçlar
run_test "Aktif Araçlar" "GET" "/api/secure/assets?active=true" ""

# Tek araç detayı
run_test "Araç Detayı (ID:18)" "GET" "/api/secure/assets/18" ""

# Plaka ile arama
run_test "Plaka ile Arama" "GET" "/api/secure/assets?search=34ABC" ""

# ===================================
# 4. DOKÜMAN YÖNETİMİ TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== DOKÜMAN YÖNETİMİ TESTLERİ ===${NC}"

# Doküman listesi
run_test "Doküman Listesi" "GET" "/api/secure/documents" ""

# Araç dokümanları
run_test "Araç Dokümanları" "GET" "/api/secure/documents?entityType=asset&entityId=18" ""

# ===================================
# 5. KİRALAMA YÖNETİMİ TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== KİRALAMA YÖNETİMİ TESTLERİ ===${NC}"

# Kiralama listesi
run_test "Kiralama Listesi" "GET" "/api/trip-rentals" ""

# Aktif kiralamalar
run_test "Aktif Kiralamalar" "GET" "/api/trip-rentals?status=active" ""

# ===================================
# 6. FİNANSAL YÖNETİM TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== FİNANSAL YÖNETİM TESTLERİ ===${NC}"

# Finansal hesaplar
run_test "Finansal Hesaplar" "GET" "/api/secure/financial/accounts" ""

# ===================================
# 7. API HEALTH CHECK
# ===================================
echo -e "\n${YELLOW}=== HEALTH CHECK ===${NC}"

health_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$health_response" = "200" ]; then
    echo -e "${GREEN}✓ API Health Check başarılı${NC}"
else
    echo -e "${RED}✗ API Health Check başarısız (HTTP $health_response)${NC}"
fi

# ===================================
# 8. API ANALYTİCS TESTLERİ
# ===================================
echo -e "\n${YELLOW}=== API ANALYTICS TESTLERİ ===${NC}"

# API kullanım istatistikleri
run_test "API İstatistikleri" "GET" "/api/analytics/stats" ""

# ===================================
# TEST SONUÇLARI
# ===================================
echo -e "\n${YELLOW}==============================${NC}"
echo -e "${YELLOW}TEST SONUÇLARI${NC}"
echo -e "${YELLOW}==============================${NC}"
echo "Toplam Test: $TOTAL_TESTS"
echo -e "${GREEN}Başarılı: $PASSED_TESTS${NC}"
echo -e "${RED}Başarısız: $FAILED_TESTS${NC}"

# Başarı oranı
if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "\nBaşarı Oranı: ${success_rate}%"
    
    if [ $success_rate -eq 100 ]; then
        echo -e "\n${GREEN}✅ TÜM TESTLER BAŞARILI!${NC}"
    elif [ $success_rate -ge 80 ]; then
        echo -e "\n${YELLOW}⚠️ Bazı testler başarısız, kontrol gerekli.${NC}"
    else
        echo -e "\n${RED}❌ Çoğu test başarısız, acil müdahale gerekli!${NC}"
    fi
fi

echo -e "\n${YELLOW}==============================${NC}"
echo "Test tamamlandı: $(date)"
echo -e "${YELLOW}==============================${NC}"

# ===================================
# PRODUCTION DEPLOYMENT İÇİN NOTLAR
# ===================================
echo -e "\n${YELLOW}📋 PRODUCTION DEPLOYMENT KONTROL LİSTESİ:${NC}"
echo "✓ Domain: filokiapi.architectaiagency.com"
echo "✓ API Key: ak_prod2025_rwba6dj1sw"
echo "✓ Admin: admin@example.com / Architect"
echo "✓ Database: fleetmanagement"
echo ""
echo "Production'da test için:"
echo "1. BASE_URL'yi https://filokiapi.architectaiagency.com olarak değiştir"
echo "2. ./test-api-production.sh komutunu çalıştır"
echo ""