#!/bin/bash

# ============================================
# FILOKI API FRESH PRODUCTION INSTALLATION
# Interactive setup script with user inputs
# GitHub: https://github.com/AlperAcarAI/FiloAPIapp
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Function to print colored output
print_header() {
    echo ""
    echo -e "${MAGENTA}============================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}============================================${NC}"
}

print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Function to validate input
validate_input() {
    local input=$1
    local type=$2
    
    case $type in
        "email")
            if [[ "$input" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
        "domain")
            if [[ "$input" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
        "port")
            if [[ "$input" =~ ^[0-9]+$ ]] && [ "$input" -ge 1 ] && [ "$input" -le 65535 ]; then
                return 0
            else
                return 1
            fi
            ;;
        *)
            return 0
            ;;
    esac
}

# Start installation
clear
print_header "FILOKI API FRESH PRODUCTION INSTALLATION"
echo -e "${CYAN}This script will help you set up a fresh production deployment${NC}"
echo -e "${CYAN}GitHub Repository: https://github.com/AlperAcarAI/FiloAPIapp${NC}"
echo ""

# Collect user inputs
print_header "STEP 1: COLLECT CONFIGURATION"

# Domain configuration
while true; do
    read -p "Enter your domain name (e.g., filokiapi.architectaiagency.com): " DOMAIN_NAME
    if validate_input "$DOMAIN_NAME" "domain"; then
        break
    else
        print_error "Invalid domain format. Please try again."
    fi
done

# Database configuration
echo ""
print_info "Database Configuration"
read -p "PostgreSQL host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "PostgreSQL port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "PostgreSQL user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -s -p "PostgreSQL password: " DB_PASS
echo ""

read -p "Database name [filoki_db]: " DB_NAME
DB_NAME=${DB_NAME:-filoki_db}

# Application configuration
echo ""
print_info "Application Configuration"
read -p "Application port [5000]: " APP_PORT
APP_PORT=${APP_PORT:-5000}

read -p "PM2 app name [filoki-api]: " PM2_APP_NAME
PM2_APP_NAME=${PM2_APP_NAME:-filoki-api}

# Admin user configuration
echo ""
print_info "Admin User Configuration"
while true; do
    read -p "Admin email: " ADMIN_EMAIL
    if validate_input "$ADMIN_EMAIL" "email"; then
        break
    else
        print_error "Invalid email format. Please try again."
    fi
done

read -s -p "Admin password: " ADMIN_PASS
echo ""
read -s -p "Confirm admin password: " ADMIN_PASS_CONFIRM
echo ""

if [ "$ADMIN_PASS" != "$ADMIN_PASS_CONFIRM" ]; then
    print_error "Passwords do not match!"
    exit 1
fi

# API configuration
echo ""
print_info "API Configuration"
print_warning "API Key will be auto-generated, but you can provide your own"
read -p "API Key (press Enter to auto-generate): " API_KEY
if [ -z "$API_KEY" ]; then
    API_KEY="ak_prod$(date +%Y)_$(openssl rand -hex 5)"
    print_success "Generated API Key: $API_KEY"
fi

# SSL configuration
echo ""
print_info "SSL Configuration"
read -p "Your email for Let's Encrypt SSL [admin@$DOMAIN_NAME]: " SSL_EMAIL
SSL_EMAIL=${SSL_EMAIL:-admin@$DOMAIN_NAME}

# Generate secure secrets
print_status "Generating secure secrets..."
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# Show configuration summary
print_header "CONFIGURATION SUMMARY"
echo "Domain: $DOMAIN_NAME"
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "App Port: $APP_PORT"
echo "PM2 Name: $PM2_APP_NAME"
echo "Admin: $ADMIN_EMAIL"
echo "API Key: $API_KEY"
echo "SSL Email: $SSL_EMAIL"
echo ""

read -p "Is this configuration correct? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    print_warning "Installation cancelled"
    exit 0
fi

# Create installation directory
print_header "STEP 2: PREPARE INSTALLATION"
INSTALL_DIR="$HOME/FiloAPIapp"
print_status "Creating installation directory: $INSTALL_DIR"

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory already exists. Backing up..."
    mv "$INSTALL_DIR" "${INSTALL_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone repository
print_header "STEP 3: CLONE REPOSITORY"
print_status "Cloning from GitHub..."
git clone https://github.com/AlperAcarAI/FiloAPIapp.git .
print_success "Repository cloned successfully"

# Install dependencies
print_header "STEP 4: INSTALL DEPENDENCIES"
print_status "Installing Node.js dependencies..."
npm install
print_success "Dependencies installed"

# Create .env file
print_header "STEP 5: CREATE ENVIRONMENT FILE"
print_status "Creating .env file..."

# Generate password hashes
print_status "Generating password hashes..."
cat > generate-hashes.js << EOF
const bcrypt = require('bcryptjs');

const adminPass = '$ADMIN_PASS';
const apiKey = '$API_KEY';

async function generateHashes() {
    const adminHash = await bcrypt.hash(adminPass, 10);
    const apiKeyHash = await bcrypt.hash(apiKey, 10);
    
    console.log('ADMIN_PASS_HASH=' + adminHash);
    console.log('API_KEY_HASH=' + apiKeyHash);
}

generateHashes();
EOF

HASH_OUTPUT=$(node generate-hashes.js)
ADMIN_PASS_HASH=$(echo "$HASH_OUTPUT" | grep ADMIN_PASS_HASH | cut -d'=' -f2)
API_KEY_HASH=$(echo "$HASH_OUTPUT" | grep API_KEY_HASH | cut -d'=' -f2)
rm generate-hashes.js

# Create .env file
cat > .env << EOF
# Production Environment Configuration
# Generated: $(date)
NODE_ENV=production

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME

# Application
PORT=$APP_PORT
DOMAIN=$DOMAIN_NAME

# API Configuration
CORS_ORIGIN=https://$DOMAIN_NAME

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Session Secret
SESSION_SECRET=$SESSION_SECRET

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

# Generated Credentials (DO NOT COMMIT)
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASS_HASH=$ADMIN_PASS_HASH
API_KEY=$API_KEY
API_KEY_HASH=$API_KEY_HASH
EOF

print_success ".env file created"

# Create uploads directory
print_status "Creating uploads directory structure..."
mkdir -p uploads/{temp,assets,personnel,thumbnails}
print_success "Upload directories created"

# Build application
print_header "STEP 6: BUILD APPLICATION"
print_status "Building production bundle..."
npm run build || print_warning "Build failed, continuing..."

# Setup database
print_header "STEP 7: DATABASE SETUP"
print_status "Setting up database..."

# Create database if not exists
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_info "Database might already exist"

# Apply schema
if [ -f "production-full-database-setup.sql" ]; then
    print_status "Applying database schema..."
    # Update the SQL file with our credentials
    sed -i "s/admin@example.com/$ADMIN_EMAIL/g" production-full-database-setup.sql
    sed -i "s/\$2b\$10\$Em9d/.mW\/ruoBLXiul6Tq.mACIqmDMIY7p\/C9dA4\/xtAKW4FD5jGK/$ADMIN_PASS_HASH/g" production-full-database-setup.sql
    sed -i "s/ak_prod2025_rwba6dj1sw/$API_KEY/g" production-full-database-setup.sql
    sed -i "s/\$2b\$10\$EbPHkGCd\/.4KM.OVdd1Hp.51vqCBEu67A\/lpLzS6yFdFQA3Hep9AW/$API_KEY_HASH/g" production-full-database-setup.sql
    
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f production-full-database-setup.sql
    print_success "Database schema applied"
else
    print_warning "Database setup file not found, skipping..."
fi

# Setup PM2
print_header "STEP 8: SETUP PM2"
print_status "Configuring PM2..."

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './dist/server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp $HOME

print_success "PM2 configured and application started"

# Setup Nginx
print_header "STEP 9: NGINX CONFIGURATION"
print_status "Creating Nginx configuration..."

# Create nginx config
sudo tee /etc/nginx/sites-available/$PM2_APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API specific settings
    location /api {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase limits for file uploads
        client_max_body_size 50M;
        client_body_buffer_size 128k;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$PM2_APP_NAME /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

print_success "Nginx configured"

# Setup SSL
print_header "STEP 10: SSL CERTIFICATE"
print_status "Setting up Let's Encrypt SSL certificate..."

sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $SSL_EMAIL

print_success "SSL certificate installed"

# Create test script
print_header "STEP 11: CREATE TEST SCRIPT"
cat > test-api.sh << 'EOF'
#!/bin/bash

# API Test Script
API_URL="https://$DOMAIN_NAME"
API_KEY="$API_KEY"

echo "Testing API Health..."
curl -s "$API_URL/api/health" | jq .

echo -e "\n\nTesting API with Key..."
curl -s -H "X-API-Key: $API_KEY" "$API_URL/api/companies" | jq .
EOF

chmod +x test-api.sh

# Final summary
print_header "INSTALLATION COMPLETE!"

echo -e "${GREEN}✅ Installation completed successfully!${NC}"
echo ""
echo "📋 Configuration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain       : https://$DOMAIN_NAME"
echo "API Base URL : https://$DOMAIN_NAME/api"
echo "Swagger Docs : https://$DOMAIN_NAME/api-docs"
echo ""
echo "Admin Login  : $ADMIN_EMAIL"
echo "Admin Pass   : [your password]"
echo ""
echo "API Key      : $API_KEY"
echo ""
echo "Database     : $DB_NAME"
echo "PM2 App      : $PM2_APP_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo "1. Test the API: ./test-api.sh"
echo "2. Check PM2 status: pm2 status"
echo "3. View logs: pm2 logs $PM2_APP_NAME"
echo "4. Monitor: pm2 monit"
echo ""
echo "🔒 Security Notes:"
echo "- Keep your .env file secure"
echo "- Never commit credentials to Git"
echo "- Regularly update dependencies"
echo "- Monitor logs for suspicious activity"
echo ""

# Save credentials to secure file
cat > credentials.txt << EOF
FILOKI API PRODUCTION CREDENTIALS
Generated: $(date)
================================

Domain: https://$DOMAIN_NAME
Admin Email: $ADMIN_EMAIL
Admin Password: [SET BY USER]
API Key: $API_KEY
Database: $DB_NAME

KEEP THIS FILE SECURE!
EOF

chmod 600 credentials.txt
print_success "Credentials saved to: $INSTALL_DIR/credentials.txt"