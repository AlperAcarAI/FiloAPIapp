#!/bin/bash

# Create production .env file
cat > .env << 'EOF'
# Production Environment Configuration
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres:Archi2025!@localhost:5432/fleet_db

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
EOF

echo "✅ .env file created successfully!"
echo ""
echo "Please run this script on your production server:"
echo "1. SSH to your server: ssh deploy@fleet-prod-01"
echo "2. Go to app directory: cd ~/FiloAPIapp"
echo "3. Run this script: ./production-env-setup.sh"
echo "4. Restart the app: pm2 restart filoki-api"