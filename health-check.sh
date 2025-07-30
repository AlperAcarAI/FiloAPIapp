#!/bin/bash

# Fleet Management API Health Check Script
# Can be used with monitoring services or cron jobs

API_URL="${1:-http://localhost:5000}"
API_KEY="${2:-ak_prod2025_rwba6dj1sw}"
TIMEOUT=10

echo "🏥 Fleet Management API Health Check"
echo "=================================="
echo "URL: $API_URL"
echo "Time: $(date)"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT \
            -H "X-API-Key: $API_KEY" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT \
            -X "$method" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FAIL ($response)"
        return 1
    fi
}

# Test basic connectivity
echo "🔌 Basic Connectivity Tests:"
test_endpoint "/api/health" "GET" "Health endpoint"
test_endpoint "/api/docs" "GET" "API documentation"

echo ""
echo "🔐 Authentication Tests:"
test_endpoint "/api/secure/getCities" "GET" "Cities endpoint (auth required)"
test_endpoint "/api/secure/getCountries" "GET" "Countries endpoint (auth required)"

echo ""
echo "📊 Core API Tests:"
test_endpoint "/api/secure/assets" "GET" "Assets endpoint"
test_endpoint "/api/secure/companies" "GET" "Companies endpoint"
test_endpoint "/api/secure/getPersonnel" "GET" "Personnel endpoint"

echo ""
echo "🛠️ System Resource Check:"

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✅ Disk space: ${DISK_USAGE}% used"
else
    echo "⚠️  Disk space: ${DISK_USAGE}% used (WARNING: >80%)"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -lt 80 ]; then
    echo "✅ Memory usage: ${MEM_USAGE}%"
else
    echo "⚠️  Memory usage: ${MEM_USAGE}% (WARNING: >80%)"
fi

# Check PM2 status
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null)
    if [ "$PM2_STATUS" = "online" ]; then
        echo "✅ PM2 status: online"
    else
        echo "❌ PM2 status: $PM2_STATUS"
    fi
else
    echo "⚠️  PM2 not found"
fi

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL: running"
else
    echo "❌ PostgreSQL: not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: running"
else
    echo "❌ Nginx: not running"
fi

echo ""
echo "📈 Performance Metrics:"

# Response time test
START_TIME=$(date +%s%N)
curl -s -o /dev/null -H "X-API-Key: $API_KEY" "$API_URL/api/health"
END_TIME=$(date +%s%N)
RESPONSE_TIME=$((($END_TIME - $START_TIME) / 1000000))

if [ "$RESPONSE_TIME" -lt 1000 ]; then
    echo "✅ API response time: ${RESPONSE_TIME}ms"
else
    echo "⚠️  API response time: ${RESPONSE_TIME}ms (slow)"
fi

echo ""
echo "🏥 Health Check completed at $(date)"