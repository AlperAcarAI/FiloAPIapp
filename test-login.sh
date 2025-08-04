#!/bin/bash
# Login Test Script

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# API URL'leri
LOCAL_URL="http://localhost:5000"
DOMAIN_URL="https://filokiapi.architectaiagency.com"

# Login bilgileri
EMAIL="alper.acar@architectaiagency.com"
PASSWORD="Acar"

echo -e "${YELLOW}=== FilokiAPI Login Testi ===${NC}"
echo ""

# 1. Local test
echo -e "${YELLOW}1. Local Login Testi (localhost:5000):${NC}"
RESPONSE=$(curl -s -X POST $LOCAL_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "\n\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# Token'ı al (eğer başarılıysa)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    TOKEN=$(echo "$BODY" | jq -r '.token // .access_token // .accessToken // empty' 2>/dev/null)
    if [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}✓ Login başarılı! Token alındı.${NC}"
        echo "Token: ${TOKEN:0:20}..."
        
        # Token ile test API çağrısı
        echo ""
        echo -e "${YELLOW}2. Token ile API Testi:${NC}"
        curl -s $LOCAL_URL/api/users \
          -H "Authorization: Bearer $TOKEN" | jq . || echo "API çağrısı başarısız"
    fi
else
    echo -e "${RED}✗ Login başarısız!${NC}"
fi

echo ""
echo -e "${YELLOW}3. Domain Üzerinden Login Testi:${NC}"

# Domain testi
DOMAIN_RESPONSE=$(curl -s -X POST $DOMAIN_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "\n\nHTTP_STATUS:%{http_code}")

DOMAIN_HTTP_STATUS=$(echo "$DOMAIN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
DOMAIN_BODY=$(echo "$DOMAIN_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $DOMAIN_HTTP_STATUS"
echo "Response:"
echo "$DOMAIN_BODY" | jq . 2>/dev/null || echo "$DOMAIN_BODY"

# Özet
echo ""
echo -e "${YELLOW}=== TEST ÖZETİ ===${NC}"
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✓ Local login çalışıyor${NC}"
else
    echo -e "${RED}✗ Local login çalışmıyor${NC}"
fi

if [ "$DOMAIN_HTTP_STATUS" = "200" ] || [ "$DOMAIN_HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✓ Domain login çalışıyor${NC}"
else
    echo -e "${RED}✗ Domain login çalışmıyor${NC}"
fi