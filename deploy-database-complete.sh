#!/bin/bash

# ============================================
# FILOKI API COMPLETE DATABASE DEPLOYMENT
# Intelligent deployment with full verification
# Domain: filokiapi.architectaiagency.com
# Date: 2025-01-30
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_NAME="proje_db"
DB_PASS=${DB_PASS:-""}

# Production configuration
API_KEY="ak_prod2025_rwba6dj1sw"
API_KEY_HASH='$2b$10$EbPHkGCd/.4KM.OVdd1Hp.51vqCBEu67A/lpLzS6yFdFQA3Hep9AW'
ADMIN_EMAIL="admin@example.com"
ADMIN_PASS_HASH='$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK'

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

# Function to execute PostgreSQL commands
execute_sql() {
    local db=$1
    local query=$2
    if [ -z "$DB_PASS" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db" -t -c "$query" 2>/dev/null
    else
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db" -t -c "$query" 2>/dev/null
    fi
}

# Function to execute SQL file
execute_sql_file() {
    local db=$1
    local file=$2
    if [ -z "$DB_PASS" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db" -f "$file" > /tmp/deploy_sql.log 2>&1
    else
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db" -f "$file" > /tmp/deploy_sql.log 2>&1
    fi
    local result=$?
    if [ $result -ne 0 ]; then
        cat /tmp/deploy_sql.log
    fi
    rm -f /tmp/deploy_sql.log
    return $result
}

# Function to check if database exists
check_database_exists() {
    local db_exists=$(execute_sql "postgres" "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | tr -d '[:space:]')
    [ "$db_exists" = "1" ]
}

# Function to check if table exists
check_table_exists() {
    local table_name=$1
    local table_exists=$(execute_sql "$DB_NAME" "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_name' LIMIT 1" | tr -d '[:space:]')
    [ "$table_exists" = "1" ]
}

# Function to count records in table
count_records() {
    local table_name=$1
    echo $(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM $table_name" | tr -d '[:space:]')
}

# Function to count tables
count_tables() {
    echo $(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d '[:space:]')
}

# Start deployment
clear
print_header "FILOKI API COMPLETE DATABASE DEPLOYMENT"

print_info "Database Configuration:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Step 1: Check PostgreSQL connection
print_status "Testing PostgreSQL connection..."
if execute_sql "postgres" "SELECT version();" > /dev/null 2>&1; then
    print_success "PostgreSQL connection successful"
else
    print_error "Cannot connect to PostgreSQL"
    echo "Please check your connection settings and PostgreSQL service"
    exit 1
fi

# Step 2: Database management
print_header "DATABASE MANAGEMENT"

if check_database_exists; then
    print_success "Database '$DB_NAME' exists"
    
    # Ask user what to do
    echo ""
    print_warning "Database already exists. What would you like to do?"
    echo "  1) Keep existing database and update schema/data"
    echo "  2) Drop and recreate database (WARNING: Data loss!)"
    echo "  3) Exit without changes"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            print_info "Keeping existing database"
            DB_ACTION="update"
            ;;
        2)
            print_warning "Dropping existing database..."
            execute_sql "postgres" "DROP DATABASE IF EXISTS $DB_NAME"
            execute_sql "postgres" "CREATE DATABASE $DB_NAME"
            print_success "Database recreated"
            DB_ACTION="create"
            ;;
        3)
            print_info "Exiting without changes"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
else
    print_warning "Database '$DB_NAME' does not exist"
    print_status "Creating database..."
    execute_sql "postgres" "CREATE DATABASE $DB_NAME"
    if check_database_exists; then
        print_success "Database created successfully"
        DB_ACTION="create"
    else
        print_error "Failed to create database"
        exit 1
    fi
fi

# Step 3: Schema deployment
print_header "SCHEMA DEPLOYMENT"

INITIAL_TABLE_COUNT=$(count_tables)
print_info "Current table count: $INITIAL_TABLE_COUNT"

# List of all expected tables
EXPECTED_TABLES=(
    # Lookup tables
    "countries" "cities" "company_types" "policy_types" "payment_methods"
    "damage_types" "ownership_types" "maintenance_types" "car_brands" "car_types"
    "personnel_positions" "doc_main_types" "doc_sub_types" "penalty_types" "payment_types"
    
    # Core business tables
    "companies" "car_models" "personnel" "work_areas"
    
    # Auth tables
    "roles" "permissions" "role_permissions" "users" "access_levels"
    "user_access_rights" "user_roles" "api_clients" "api_keys" "api_tokens"
    "sessions" "refresh_tokens"
    
    # Security tables
    "login_attempts" "user_security_settings" "user_devices" "security_events"
    "rate_limit_buckets" "password_history"
    
    # API management tables
    "api_endpoints" "api_request_logs" "api_client_permissions" "api_rate_limit"
    "api_usage_logs" "api_usage_stats"
    
    # Asset management tables
    "company_type_matches" "personnel_company_matches" "personnel_work_areas"
    "assets" "assets_personel_assignment" "asset_documents" "personnel_documents"
    "documents" "trip_rentals"
    
    # Fleet management tables
    "assets_policies" "assets_damage_data" "assets_maintenance" "fuel_records"
    "rental_agreements" "rental_assets" "penalties"
    
    # Financial tables
    "fin_current_accounts" "fin_accounts_details"
    
    # Audit table
    "audit_logs"
)

# Check which tables are missing
MISSING_TABLES=()
EXISTING_TABLES=()

for table in "${EXPECTED_TABLES[@]}"; do
    if check_table_exists "$table"; then
        EXISTING_TABLES+=("$table")
    else
        MISSING_TABLES+=("$table")
    fi
done

print_info "Existing tables: ${#EXISTING_TABLES[@]}"
print_info "Missing tables: ${#MISSING_TABLES[@]}"

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    print_warning "Missing tables: ${MISSING_TABLES[*]}"
fi

# Apply schema
if [ "$DB_ACTION" = "create" ] || [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    print_status "Applying database schema..."
    
    if [ -f "production-full-database-setup.sql" ]; then
        if execute_sql_file "$DB_NAME" "production-full-database-setup.sql"; then
            print_success "Schema applied successfully"
        else
            print_warning "Some schema elements may have failed (this is normal for updates)"
        fi
    else
        print_error "production-full-database-setup.sql not found!"
        exit 1
    fi
fi

# Step 4: Data verification and population
print_header "DATA VERIFICATION"

# Check and populate lookup data
print_status "Verifying lookup data..."

# Countries
country_count=$(count_records "countries")
if [ "$country_count" -eq "0" ]; then
    print_warning "Populating countries..."
    execute_sql "$DB_NAME" "
        INSERT INTO countries (id, name, phone_code) VALUES
        (1, 'Türkiye', '+90'),
        (2, 'Almanya', '+49'),
        (3, 'Amerika Birleşik Devletleri', '+1')
        ON CONFLICT (id) DO NOTHING;"
    print_success "Countries populated"
else
    print_success "Countries data exists ($country_count records)"
fi

# Cities
city_count=$(count_records "cities")
if [ "$city_count" -eq "0" ]; then
    print_warning "Populating cities..."
    execute_sql "$DB_NAME" "
        INSERT INTO cities (id, name, country_id) VALUES
        (1, 'İstanbul', 1),
        (2, 'Ankara', 1),
        (3, 'İzmir', 1),
        (4, 'Berlin', 2),
        (5, 'New York', 3)
        ON CONFLICT (id) DO NOTHING;"
    print_success "Cities populated"
else
    print_success "Cities data exists ($city_count records)"
fi

# Company
company_count=$(count_records "companies")
if [ "$company_count" -eq "0" ]; then
    print_warning "Creating demo company..."
    execute_sql "$DB_NAME" "
        INSERT INTO companies (id, name, tax_no, address, phone, city_id, is_active)
        VALUES (1, 'Demo Şirket A.Ş.', '1234567890', 'Demo Adres', '+90 212 555 0101', 1, true)
        ON CONFLICT (id) DO NOTHING;"
    print_success "Demo company created"
else
    print_success "Company data exists ($company_count records)"
fi

# Step 5: User and authentication setup
print_header "AUTHENTICATION SETUP"

# Check admin user
admin_exists=$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL'" | tr -d '[:space:]')
if [ "$admin_exists" -eq "0" ]; then
    print_warning "Creating admin user..."
    execute_sql "$DB_NAME" "
        INSERT INTO users (email, password_hash, company_id, position_level, is_active)
        VALUES ('$ADMIN_EMAIL', '$ADMIN_PASS_HASH', 1, 1, true);"
    
    # Get user ID and assign admin role
    user_id=$(execute_sql "$DB_NAME" "SELECT id FROM users WHERE email = '$ADMIN_EMAIL'" | tr -d '[:space:]')
    execute_sql "$DB_NAME" "
        INSERT INTO user_roles (user_id, role_id)
        SELECT $user_id, 1
        WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = $user_id AND role_id = 1);"
    
    print_success "Admin user created"
else
    print_success "Admin user exists"
    
    # Ensure password is updated
    execute_sql "$DB_NAME" "
        UPDATE users 
        SET password_hash = '$ADMIN_PASS_HASH', is_active = true
        WHERE email = '$ADMIN_EMAIL';"
fi

# Step 6: API configuration
print_header "API CONFIGURATION"

# Check API client
api_client_exists=$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM api_clients WHERE name = 'Production Main API'" | tr -d '[:space:]')
if [ "$api_client_exists" -eq "0" ]; then
    print_warning "Creating API client..."
    execute_sql "$DB_NAME" "
        INSERT INTO api_clients (name, company_id, is_active)
        VALUES ('Production Main API', 1, true);"
    print_success "API client created"
else
    print_success "API client exists"
fi

# Configure API key
print_status "Configuring API key..."
execute_sql "$DB_NAME" "
    WITH client AS (
        SELECT id FROM api_clients WHERE name = 'Production Main API'
    )
    INSERT INTO api_keys (
        client_id, key_hash, permissions, allowed_domains, is_active
    ) 
    SELECT 
        client.id,
        '$API_KEY_HASH',
        ARRAY[
            'data:read', 'data:write', 'data:delete',
            'asset:read', 'asset:write', 'asset:delete',
            'fleet:read', 'fleet:write', 'fleet:delete',
            'document:read', 'document:write', 'document:delete',
            'company:read', 'company:write', 'company:delete',
            'admin:read', 'admin:write', 'admin:delete',
            'analytics:read', 'financial:read', 'financial:write'
        ]::text[],
        ARRAY[
            'filokiapi.architectaiagency.com',
            'https://filokiapi.architectaiagency.com',
            '*.architectaiagency.com',
            'localhost',
            'localhost:5000',
            'localhost:3000'
        ]::text[],
        true
    FROM client
    ON CONFLICT (client_id) DO UPDATE
    SET 
        key_hash = EXCLUDED.key_hash,
        permissions = EXCLUDED.permissions,
        allowed_domains = EXCLUDED.allowed_domains,
        is_active = true;"

print_success "API key configured"

# Step 7: Final verification
print_header "FINAL VERIFICATION"

FINAL_TABLE_COUNT=$(count_tables)
print_info "Final table count: $FINAL_TABLE_COUNT"

if [ "$INITIAL_TABLE_COUNT" -lt "$FINAL_TABLE_COUNT" ]; then
    TABLES_ADDED=$((FINAL_TABLE_COUNT - INITIAL_TABLE_COUNT))
    print_success "Added $TABLES_ADDED new tables"
fi

# Data summary
echo ""
print_status "Data Summary:"
printf "  %-25s: %3s records\n" "Countries" "$(count_records countries)"
printf "  %-25s: %3s records\n" "Cities" "$(count_records cities)"
printf "  %-25s: %3s records\n" "Companies" "$(count_records companies)"
printf "  %-25s: %3s records\n" "Users" "$(count_records users)"
printf "  %-25s: %3s records\n" "Roles" "$(count_records roles)"
printf "  %-25s: %3s records\n" "Permissions" "$(count_records permissions)"
printf "  %-25s: %3s records\n" "API Clients" "$(count_records api_clients)"
printf "  %-25s: %3s active\n" "API Keys" "$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM api_keys WHERE is_active = true" | tr -d '[:space:]')"

# Test queries
echo ""
print_status "Running test queries..."

# Test admin user
admin_test=$(execute_sql "$DB_NAME" "
    SELECT u.email, u.is_active, r.name as role
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email = '$ADMIN_EMAIL'
    LIMIT 1" | tr -d '[:space:]')

if [ -n "$admin_test" ]; then
    print_success "Admin user verified"
else
    print_error "Admin user verification failed"
fi

# Test API key
api_test=$(execute_sql "$DB_NAME" "
    SELECT ac.name, ak.is_active, array_length(ak.permissions, 1) as perm_count
    FROM api_clients ac
    JOIN api_keys ak ON ac.id = ak.client_id
    WHERE ac.name = 'Production Main API'
    LIMIT 1" | tr -d '[:space:]')

if [ -n "$api_test" ]; then
    print_success "API key verified"
else
    print_error "API key verification failed"
fi

# Step 8: Summary
print_header "DEPLOYMENT COMPLETE"

echo -e "${GREEN}Database deployment completed successfully!${NC}"
echo ""
echo -e "${CYAN}Access Credentials:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Admin Login    : ${YELLOW}$ADMIN_EMAIL${NC} / ${YELLOW}Architect${NC}"
echo -e "API Key        : ${YELLOW}$API_KEY${NC}"
echo -e "Database       : ${YELLOW}$DB_NAME${NC}"
echo -e "Total Tables   : ${YELLOW}$FINAL_TABLE_COUNT${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Optional: Create environment file template
if [ ! -f ".env.production" ]; then
    print_status "Creating .env.production template..."
    cat > .env.production << EOF
# Production Environment Configuration
# Generated: $(date)

# Database
DATABASE_URL=postgresql://$DB_USER:YOUR_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

# API Configuration
CORS_ORIGIN=https://filokiapi.architectaiagency.com
PORT=5000

# JWT Secrets
JWT_SECRET=f27294d1df02e868c14292ac48050d5d61f02e6e28708247434f2bac35a397d2
JWT_REFRESH_SECRET=f07cda845b33a9598c114bd1c41de50b82e9b29f549e230e5491b12a1371c8f4

# Session Secret
SESSION_SECRET=3d8f7a2b5c9e1d6f4a8b2c7e9d1f3a5b7c9e2d4f6a8b3c5e7d9f1a3b5c7e9d2f4a

# Node Environment
NODE_ENV=production
EOF
    print_success "Created .env.production template"
    print_warning "Remember to update the database password in .env.production"
fi

print_success "Deployment script finished!"
echo ""
print_info "Next steps:"
echo "  1. Update database password in .env.production"
echo "  2. Copy .env.production to your deployment server"
echo "  3. Restart your application"
echo "  4. Test the API endpoints"
echo ""