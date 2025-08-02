#!/bin/bash

# =====================================
# PRODUCTION KURULUM DOĞRULAMA
# =====================================

echo "========================================="
echo "FILOKI API PRODUCTION DOĞRULAMA"
echo "========================================="
echo ""

# Test bilgileri
PROD_URL="https://filokiapi.architectaiagency.com"
API_KEY="ak_prod2025_rwba6dj1sw"

# 1. Health Check
echo "1. Health Check..."
health=$(curl -s -o /dev/null -w "%{http_code}" $PROD_URL/api/health)
if [ "$health" = "200" ]; then
    echo "✓ API çalışıyor"
else
    echo "✗ API çalışmıyor (HTTP $health)"
fi

# 2. Admin Login
echo -e "\n2. Admin Login Test..."
login=$(curl -s -X POST $PROD_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Architect"}' \
    | jq -r '.success')

if [ "$login" = "true" ]; then
    echo "✓ Admin login başarılı"
else
    echo "✗ Admin login başarısız"
    echo "   SQL dosyasındaki admin user bölümünü çalıştırdınız mı?"
fi

# 3. API Key Test
echo -e "\n3. API Key Test..."
companies=$(curl -s -X GET $PROD_URL/api/secure/companies \
    -H "X-API-Key: $API_KEY" \
    | jq -r '.success')

if [ "$companies" = "true" ]; then
    echo "✓ API Key authentication başarılı"
else
    echo "✗ API Key authentication başarısız"
    echo "   SQL dosyasındaki API key bölümünü çalıştırdınız mı?"
fi

# 4. CORS Kontrolü
echo -e "\n4. CORS Kontrolü..."
cors=$(curl -s -I $PROD_URL/api/health | grep -i "access-control-allow-origin" | cut -d' ' -f2 | tr -d '\r')
if [[ "$cors" == *"filokiapi"* ]]; then
    echo "✓ CORS doğru ayarlanmış: $cors"
else
    echo "✗ CORS yanlış: $cors"
    echo "   Environment'ta CORS_ORIGIN=https://filokiapi.architectaiagency.com olmalı"
fi

echo -e "\n========================================="
echo "ÖZET:"
echo "========================================="
echo ""
echo "Eğer testlerden herhangi biri başarısız olduysa:"
echo ""
echo "1. production-database-setup.sql dosyasındaki SQL'leri çalıştırın"
echo "2. Environment değişkenlerini kontrol edin:"
echo "   - CORS_ORIGIN=https://filokiapi.architectaiagency.com"
echo "   - JWT_SECRET ve JWT_REFRESH_SECRET"
echo "   - DATABASE_URL"
echo "3. PM2 veya deployment servisinizi restart edin"
echo ""
echo "Test API Key: $API_KEY"
echo "Admin Login: admin@example.com / Architect"
echo ""