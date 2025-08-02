#!/bin/bash

# ============================================
# FILOKI API PRODUCTION TEST SCRIPT
# Domain: filokiapi.architectaiagency.com
# Date: 2025-01-30
# ============================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE_URL="https://filokiapi.architectaiagency.com"
API_KEY="ak_prod2025_rwba6dj1sw"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Architect"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test results
print_test() {
    local test_name=$1
    local status=$2
    local response=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  ${YELLOW}Response:${NC} $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    local use_token=$6
    
    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    # Add API key header
    curl_cmd="$curl_cmd -H 'X-API-Key: $API_KEY'"
    
    # Add token if provided
    if [ -n "$use_token" ] && [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    # Add data if provided
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # Execute request
    local response=$(eval "$curl_cmd '$API_BASE_URL$endpoint'")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    # Check result
    if [ "$http_code" = "$expected_status" ]; then
        print_test "$test_name" "PASS" "$body"
        echo "$body" # Return response for further processing
    else
        print_test "$test_name" "FAIL" "Expected: $expected_status, Got: $http_code, Body: $body"
        echo ""
    fi
}

# Start testing
echo "============================================"
echo "FILOKI API PRODUCTION TEST"
echo "============================================"
echo "API URL: $API_BASE_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Health Check
echo -e "${BLUE}=== Health Check ===${NC}"
test_endpoint "GET" "/api/health" "" "200" "Health check"

# Test 2: Authentication
echo -e "\n${BLUE}=== Authentication Tests ===${NC}"

# Login
login_response=$(test_endpoint "POST" "/api/auth/login" '{"email":"'$ADMIN_EMAIL'","password":"'$ADMIN_PASSWORD'"}' "200" "Admin login")

# Extract token from response
if [ -n "$login_response" ]; then
    AUTH_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$AUTH_TOKEN" ]; then
        echo -e "${GREEN}Token obtained successfully${NC}"
    else
        echo -e "${RED}Failed to extract token${NC}"
    fi
fi

# Test current user
test_endpoint "GET" "/api/auth/me" "" "200" "Get current user" "true"

# Test 3: Companies API
echo -e "\n${BLUE}=== Companies API Tests ===${NC}"

# List companies
test_endpoint "GET" "/api/companies" "" "200" "List companies"

# Get specific company
test_endpoint "GET" "/api/companies/1" "" "200" "Get company by ID"

# Create company (should work with API key)
new_company=$(test_endpoint "POST" "/api/companies" '{"name":"Test Şirket A.Ş.","tax_no":"9876543210","address":"Test Adres","phone":"+90 212 555 0202","city_id":1}' "201" "Create company")

# Extract new company ID
if [ -n "$new_company" ]; then
    NEW_COMPANY_ID=$(echo "$new_company" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
fi

# Update company
if [ -n "$NEW_COMPANY_ID" ]; then
    test_endpoint "PUT" "/api/companies/$NEW_COMPANY_ID" '{"phone":"+90 212 555 0303"}' "200" "Update company"
fi

# Test 4: Personnel API
echo -e "\n${BLUE}=== Personnel API Tests ===${NC}"

# List personnel
test_endpoint "GET" "/api/personnel" "" "200" "List personnel"

# Create personnel
test_endpoint "POST" "/api/personnel" '{"name":"Test","surname":"Personel","tc_no":12345678901,"phone_no":"+90 555 123 4567","nation_id":1,"birthplace_id":1}' "201" "Create personnel"

# Test 5: Assets API
echo -e "\n${BLUE}=== Assets API Tests ===${NC}"

# List car brands
test_endpoint "GET" "/api/assets/car-brands" "" "200" "List car brands"

# List car models
test_endpoint "GET" "/api/assets/car-models" "" "200" "List car models"

# Test 6: Documents API
echo -e "\n${BLUE}=== Documents API Tests ===${NC}"

# List document types
test_endpoint "GET" "/api/documents/types" "" "200" "List document types"

# Test 7: Users API (requires auth)
echo -e "\n${BLUE}=== Users API Tests ===${NC}"

# List users
test_endpoint "GET" "/api/users" "" "200" "List users" "true"

# Test 8: API Analytics
echo -e "\n${BLUE}=== API Analytics Tests ===${NC}"

# Get API usage stats
test_endpoint "GET" "/api/analytics/usage" "" "200" "API usage statistics" "true"

# Get API performance
test_endpoint "GET" "/api/analytics/performance" "" "200" "API performance metrics" "true"

# Test 9: Search and Filtering
echo -e "\n${BLUE}=== Search and Filter Tests ===${NC}"

# Search companies
test_endpoint "GET" "/api/companies?search=Demo" "" "200" "Search companies"

# Pagination test
test_endpoint "GET" "/api/companies?limit=5&offset=0" "" "200" "Pagination test"

# Test 10: Error Handling
echo -e "\n${BLUE}=== Error Handling Tests ===${NC}"

# Invalid endpoint
test_endpoint "GET" "/api/invalid-endpoint" "" "404" "Invalid endpoint (404)"

# Missing required field
test_endpoint "POST" "/api/companies" '{"tax_no":"1234"}' "400" "Missing required field (400)"

# Invalid ID
test_endpoint "GET" "/api/companies/99999" "" "404" "Non-existent resource (404)"

# Test 11: API Key Validation
echo -e "\n${BLUE}=== API Key Validation Tests ===${NC}"

# Test with invalid API key
curl_response=$(curl -s -w '\n%{http_code}' -X GET \
    -H "X-API-Key: invalid_key_12345" \
    "$API_BASE_URL/api/companies")
http_code=$(echo "$curl_response" | tail -n1)

if [ "$http_code" = "401" ]; then
    print_test "Invalid API key rejection" "PASS" "Correctly rejected"
else
    print_test "Invalid API key rejection" "FAIL" "Expected: 401, Got: $http_code"
fi

# Test 12: CORS Headers
echo -e "\n${BLUE}=== CORS Headers Test ===${NC}"

cors_response=$(curl -s -I -X OPTIONS \
    -H "Origin: https://filokiapi.architectaiagency.com" \
    -H "Access-Control-Request-Method: GET" \
    "$API_BASE_URL/api/companies")

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    print_test "CORS headers present" "PASS" "CORS configured"
else
    print_test "CORS headers present" "FAIL" "CORS headers missing"
fi

# Test 13: Swagger Documentation
echo -e "\n${BLUE}=== API Documentation Test ===${NC}"

swagger_response=$(curl -s -w '\n%{http_code}' "$API_BASE_URL/api-docs/")
http_code=$(echo "$swagger_response" | tail -n1)

if [ "$http_code" = "200" ]; then
    print_test "Swagger documentation accessible" "PASS" "API docs available"
else
    print_test "Swagger documentation accessible" "FAIL" "Expected: 200, Got: $http_code"
fi

# Summary
echo ""
echo "============================================"
echo "TEST SUMMARY"
echo "============================================"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: ${YELLOW}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"
echo "============================================"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the results above.${NC}"
    exit 1
fi