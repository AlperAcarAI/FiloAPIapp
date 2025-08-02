#!/bin/bash

# ============================================
# FILOKI API PRODUCTION FIX SCRIPT
# This script fixes the production deployment
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "============================================"
echo "FILOKI API PRODUCTION FIX"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in the FiloAPI app directory!${NC}"
    echo "Please cd to ~/FiloAPIapp and run this script again"
    exit 1
fi

# Step 1: Create .env file
echo -e "${BLUE}Step 1: Creating .env file...${NC}"

cat > .env << 'EOF'
# Production Environment Configuration
NODE_ENV=production

# Database - Using the correct database name
DATABASE_URL=postgresql://postgres:Archi2025!@localhost:5432/proje_db

# API Configuration
CORS_ORIGIN=https://filokiapi.architectaiagency.com
PORT=5000

# JWT Secrets
JWT_SECRET=f27294d1df02e868c14292ac48050d5d61f02e6e28708247434f2bac35a397d2
JWT_REFRESH_SECRET=f07cda845b33a9598c114bd1c41de50b82e9b29f549e230e5491b12a1371c8f4

# Session Secret
SESSION_SECRET=3d8f7a2b5c9e1d6f4a8b2c7e9d1f3a5b7c9e2d4f6a8b3c5e7d9f1a3b5c7e9d2f4a

# API Documentation
SWAGGER_ENABLED=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10

# Session Store
SESSION_STORE=memory
EOF

echo -e "${GREEN}✓ .env file created${NC}"

# Step 2: Check database connection
echo -e "\n${BLUE}Step 2: Checking database connection...${NC}"

if PGPASSWORD="Archi2025!" psql -h localhost -U postgres -d proje_db -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check your database settings"
fi

# Step 3: Create uploads directory if it doesn't exist
echo -e "\n${BLUE}Step 3: Creating uploads directory...${NC}"
mkdir -p uploads/temp uploads/assets uploads/personnel uploads/thumbnails
echo -e "${GREEN}✓ Uploads directory created${NC}"

# Step 4: Build the application
echo -e "\n${BLUE}Step 4: Building application...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Application built successfully${NC}"
else
    echo -e "${YELLOW}⚠ Build failed, but continuing...${NC}"
fi

# Step 5: Restart PM2
echo -e "\n${BLUE}Step 5: Restarting application...${NC}"
pm2 restart filoki-api
pm2 save
echo -e "${GREEN}✓ Application restarted${NC}"

# Step 6: Show PM2 status
echo -e "\n${BLUE}Step 6: Current PM2 status:${NC}"
pm2 status

# Step 7: Check logs
echo -e "\n${BLUE}Step 7: Recent application logs:${NC}"
pm2 logs filoki-api --lines 10 --nostream

# Step 8: Test the API
echo -e "\n${BLUE}Step 8: Testing API health endpoint...${NC}"
sleep 3  # Wait for app to fully start

response=$(curl -s -w '\n%{http_code}' https://filokiapi.architectaiagency.com/api/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ API is working!${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ API health check failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

echo ""
echo "============================================"
echo "FIX SCRIPT COMPLETED"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Check if the API is working: curl https://filokiapi.architectaiagency.com/api/health"
echo "2. Run the full test script: ./test-api-production.sh"
echo "3. Check logs if issues persist: pm2 logs filoki-api"
echo ""
echo "API Credentials:"
echo "- Admin: admin@example.com / Architect"
echo "- API Key: ak_prod2025_rwba6dj1sw"
echo ""