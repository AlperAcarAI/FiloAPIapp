#!/bin/bash

echo "=== API Endpoint Test ==="
echo ""

# 1. Health check
echo "1. Health Check:"
curl -s https://filokiapi.architectaiagency.com/api/health | jq . || echo "HATA: JSON dönmüyor"

echo ""
echo "2. Login Test:"
LOGIN_RESPONSE=$(curl -s -X POST https://filokiapi.architectaiagency.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alper.acar@architectaiagency.com","password":"Acar"}')

echo "$LOGIN_RESPONSE" | jq . || echo "HATA: Login HTML dönüyor"

echo ""
echo "3. Local API Test:"
curl -s http://localhost:5000/api/health | jq .

echo ""
echo "4. Nginx Config Check:"
grep -A 10 "location /api" /etc/nginx/sites-available/filokiapi || echo "API location bulunamadı"

echo ""
echo "5. PM2 Status:"
pm2 status filoki-api

echo ""
echo "=== Test Tamamlandı ==="