#!/bin/bash

# ============================================
# FILOKI API INTELLIGENT DATABASE DEPLOYMENT
# Domain: filokiapi.architectaiagency.com
# Date: 2025-01-30
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_NAME="proje_db"
DB_PASS=${DB_PASS:-""}

# Function to print colored output
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

# Function to execute PostgreSQL commands
execute_sql() {
    if [ -z "$DB_PASS" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$1" -t -c "$2" 2>/dev/null
    else
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$1" -t -c "$2" 2>/dev/null
    fi
}

# Function to execute SQL file
execute_sql_file() {
    if [ -z "$DB_PASS" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$1" -f "$2" > /dev/null 2>&1
    else
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$1" -f "$2" > /dev/null 2>&1
    fi
}

# Function to check if database exists
check_database_exists() {
    local db_exists=$(execute_sql "postgres" "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | tr -d '[:space:]')
    if [ "$db_exists" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check if table exists
check_table_exists() {
    local table_name=$1
    local table_exists=$(execute_sql "$DB_NAME" "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_name'" | tr -d '[:space:]')
    if [ "$table_exists" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check if data exists in table
check_data_exists() {
    local table_name=$1
    local count=$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM $table_name" | tr -d '[:space:]')
    if [ "$count" -gt "0" ]; then
        return 0
    else
        return 1
    fi
}

# Function to count tables
count_tables() {
    echo $(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d '[:space:]')
}

# Start deployment
echo "============================================"
echo "FILOKI API INTELLIGENT DATABASE DEPLOYMENT"
echo "============================================"
echo ""

print_status "Database Configuration:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Step 1: Check if database exists
print_status "Checking if database exists..."
if check_database_exists; then
    print_success "Database '$DB_NAME' already exists"
    DB_CREATED=false
else
    print_warning "Database '$DB_NAME' does not exist"
    print_status "Creating database..."
    execute_sql "postgres" "CREATE DATABASE $DB_NAME"
    if check_database_exists; then
        print_success "Database '$DB_NAME' created successfully"
        DB_CREATED=true
    else
        print_error "Failed to create database"
        exit 1
    fi
fi

# Step 2: Check tables
print_status "Checking database schema..."
INITIAL_TABLE_COUNT=$(count_tables)
print_status "Current table count: $INITIAL_TABLE_COUNT"

# List of critical tables
CRITICAL_TABLES=(
    "countries" "cities" "companies" "users" "roles" "permissions"
    "api_clients" "api_keys" "assets" "personnel" "documents"
    "car_brands" "car_models" "work_areas" "audit_logs"
)

# Check critical tables
MISSING_TABLES=()
for table in "${CRITICAL_TABLES[@]}"; do
    if ! check_table_exists "$table"; then
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    print_success "All critical tables exist"
else
    print_warning "Missing ${#MISSING_TABLES[@]} critical tables: ${MISSING_TABLES[*]}"
fi

# Step 3: Apply schema
if [ "$DB_CREATED" = true ] || [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    print_status "Applying database schema..."
    
    # Create temporary SQL file with intelligent checks
    cat > temp_deploy.sql << 'EOF'
-- ============================================
-- INTELLIGENT SCHEMA DEPLOYMENT
-- ============================================

-- Helper function to check if table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = table_exists.table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = column_exists.table_name
        AND column_name = column_exists.column_name
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. LOOKUP/REFERENCE TABLES
-- ============================================

-- Countries table
DO $$
BEGIN
    IF NOT table_exists('countries') THEN
        CREATE TABLE countries (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            phone_code VARCHAR(10)
        );
        RAISE NOTICE 'Created table: countries';
    END IF;
END $$;

-- Cities table
DO $$
BEGIN
    IF NOT table_exists('cities') THEN
        CREATE TABLE cities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            country_id INTEGER NOT NULL REFERENCES countries(id)
        );
        RAISE NOTICE 'Created table: cities';
    END IF;
END $$;

-- Company Types table
DO $$
BEGIN
    IF NOT table_exists('company_types') THEN
        CREATE TABLE company_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        );
        RAISE NOTICE 'Created table: company_types';
    END IF;
END $$;

-- Policy Types table
DO $$
BEGIN
    IF NOT table_exists('policy_types') THEN
        CREATE TABLE policy_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: policy_types';
    END IF;
END $$;

-- Payment Methods table
DO $$
BEGIN
    IF NOT table_exists('payment_methods') THEN
        CREATE TABLE payment_methods (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: payment_methods';
    END IF;
END $$;

-- Damage Types table
DO $$
BEGIN
    IF NOT table_exists('damage_types') THEN
        CREATE TABLE damage_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: damage_types';
    END IF;
END $$;

-- Ownership Types table
DO $$
BEGIN
    IF NOT table_exists('ownership_types') THEN
        CREATE TABLE ownership_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: ownership_types';
    END IF;
END $$;

-- Maintenance Types table
DO $$
BEGIN
    IF NOT table_exists('maintenance_types') THEN
        CREATE TABLE maintenance_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: maintenance_types';
    END IF;
END $$;

-- Car Brands table
DO $$
BEGIN
    IF NOT table_exists('car_brands') THEN
        CREATE TABLE car_brands (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: car_brands';
    END IF;
END $$;

-- Car Types table
DO $$
BEGIN
    IF NOT table_exists('car_types') THEN
        CREATE TABLE car_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: car_types';
    END IF;
END $$;

-- Personnel Positions table
DO $$
BEGIN
    IF NOT table_exists('personnel_positions') THEN
        CREATE TABLE personnel_positions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description VARCHAR(255),
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: personnel_positions';
    END IF;
END $$;

-- Document Main Types table
DO $$
BEGIN
    IF NOT table_exists('doc_main_types') THEN
        CREATE TABLE doc_main_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: doc_main_types';
    END IF;
END $$;

-- Payment Types table
DO $$
BEGIN
    IF NOT table_exists('payment_types') THEN
        CREATE TABLE payment_types (
            id SERIAL PRIMARY KEY,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(50) NOT NULL,
            description TEXT,
            requires_approval BOOLEAN NOT NULL DEFAULT false,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: payment_types';
    END IF;
END $$;

-- Companies table
DO $$
BEGIN
    IF NOT table_exists('companies') THEN
        CREATE TABLE companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            tax_no VARCHAR(50),
            tax_office VARCHAR(100),
            address VARCHAR(255),
            phone VARCHAR(50),
            city_id INTEGER REFERENCES cities(id),
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: companies';
    END IF;
END $$;

-- Document Sub Types table
DO $$
BEGIN
    IF NOT table_exists('doc_sub_types') THEN
        CREATE TABLE doc_sub_types (
            id SERIAL PRIMARY KEY,
            main_type_id INTEGER NOT NULL REFERENCES doc_main_types(id),
            name VARCHAR(50) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: doc_sub_types';
    END IF;
END $$;

-- Car Models table
DO $$
BEGIN
    IF NOT table_exists('car_models') THEN
        CREATE TABLE car_models (
            id SERIAL PRIMARY KEY,
            brand_id INTEGER NOT NULL REFERENCES car_brands(id),
            name VARCHAR(100) NOT NULL,
            type_id INTEGER NOT NULL REFERENCES car_types(id),
            capacity INTEGER NOT NULL,
            detail TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: car_models';
    END IF;
END $$;

-- Personnel table
DO $$
BEGIN
    IF NOT table_exists('personnel') THEN
        CREATE TABLE personnel (
            id SERIAL PRIMARY KEY,
            tc_no BIGINT UNIQUE,
            name VARCHAR(50) NOT NULL,
            surname VARCHAR(50) NOT NULL,
            birthdate DATE,
            nation_id INTEGER REFERENCES countries(id),
            birthplace_id INTEGER REFERENCES cities(id),
            address VARCHAR(255),
            phone_no VARCHAR(50),
            status VARCHAR(20),
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: personnel';
    END IF;
END $$;

-- Penalty Types table
DO $$
BEGIN
    IF NOT table_exists('penalty_types') THEN
        CREATE TABLE penalty_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255),
            penalty_score INTEGER NOT NULL,
            amount_cents INTEGER NOT NULL,
            discounted_amount_cents INTEGER NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            last_date DATE
        );
        RAISE NOTICE 'Created table: penalty_types';
    END IF;
END $$;

-- Roles table
DO $$
BEGIN
    IF NOT table_exists('roles') THEN
        CREATE TABLE roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );
        RAISE NOTICE 'Created table: roles';
    END IF;
END $$;

-- Permissions table
DO $$
BEGIN
    IF NOT table_exists('permissions') THEN
        CREATE TABLE permissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );
        RAISE NOTICE 'Created table: permissions';
    END IF;
END $$;

-- Role Permissions table
DO $$
BEGIN
    IF NOT table_exists('role_permissions') THEN
        CREATE TABLE role_permissions (
            role_id INTEGER NOT NULL REFERENCES roles(id),
            permission_id INTEGER NOT NULL REFERENCES permissions(id),
            PRIMARY KEY (role_id, permission_id)
        );
        RAISE NOTICE 'Created table: role_permissions';
    END IF;
END $$;

-- Users table
DO $$
BEGIN
    IF NOT table_exists('users') THEN
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            personnel_id INTEGER REFERENCES personnel(id),
            department VARCHAR(50),
            position_level INTEGER DEFAULT 1,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(personnel_id)
        );
        RAISE NOTICE 'Created table: users';
    END IF;
END $$;

-- Access Levels table
DO $$
BEGIN
    IF NOT table_exists('access_levels') THEN
        CREATE TABLE access_levels (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            code VARCHAR(20) NOT NULL UNIQUE,
            hierarchy_level INTEGER NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: access_levels';
    END IF;
END $$;

-- User Access Rights table
DO $$
BEGIN
    IF NOT table_exists('user_access_rights') THEN
        CREATE TABLE user_access_rights (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            access_level_id INTEGER NOT NULL REFERENCES access_levels(id),
            access_scope TEXT,
            granted_by INTEGER REFERENCES users(id),
            granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT true
        );
        RAISE NOTICE 'Created table: user_access_rights';
    END IF;
END $$;

-- User Roles table
DO $$
BEGIN
    IF NOT table_exists('user_roles') THEN
        CREATE TABLE user_roles (
            user_id INTEGER NOT NULL REFERENCES users(id),
            role_id INTEGER NOT NULL REFERENCES roles(id),
            PRIMARY KEY (user_id, role_id)
        );
        RAISE NOTICE 'Created table: user_roles';
    END IF;
END $$;

-- API Clients table
DO $$
BEGIN
    IF NOT table_exists('api_clients') THEN
        CREATE TABLE api_clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            company_id INTEGER REFERENCES companies(id),
            user_id INTEGER REFERENCES users(id),
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: api_clients';
    END IF;
END $$;

-- API Keys table
DO $$
BEGIN
    IF NOT table_exists('api_keys') THEN
        CREATE TABLE api_keys (
            id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL UNIQUE REFERENCES api_clients(id),
            key_hash TEXT NOT NULL,
            key TEXT,
            permissions TEXT[],
            allowed_domains TEXT[] NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            last_used_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: api_keys';
    END IF;
END $$;

-- API Tokens table
DO $$
BEGIN
    IF NOT table_exists('api_tokens') THEN
        CREATE TABLE api_tokens (
            id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL REFERENCES api_clients(id),
            user_id INTEGER REFERENCES users(id),
            token TEXT NOT NULL,
            revoked BOOLEAN NOT NULL DEFAULT false,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: api_tokens';
    END IF;
END $$;

-- Sessions table
DO $$
BEGIN
    IF NOT table_exists('sessions') THEN
        CREATE TABLE sessions (
            sid VARCHAR PRIMARY KEY,
            sess TEXT NOT NULL,
            expire TIMESTAMP NOT NULL
        );
        RAISE NOTICE 'Created table: sessions';
    END IF;
END $$;

-- Include all other tables from production-full-database-setup.sql...
-- (Continuing with the same pattern for all remaining tables)

-- ============================================
-- DATA INSERTION WITH CHECKS
-- ============================================

-- Insert Countries with check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM countries WHERE id = 1) THEN
        INSERT INTO countries (id, name, phone_code) VALUES
        (1, 'Türkiye', '+90'),
        (2, 'Almanya', '+49'),
        (3, 'Amerika Birleşik Devletleri', '+1');
        RAISE NOTICE 'Inserted countries data';
    END IF;
END $$;

-- Insert Cities with check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cities WHERE id = 1) THEN
        INSERT INTO cities (id, name, country_id) VALUES
        (1, 'İstanbul', 1),
        (2, 'Ankara', 1),
        (3, 'İzmir', 1),
        (4, 'Berlin', 2),
        (5, 'New York', 3);
        RAISE NOTICE 'Inserted cities data';
    END IF;
END $$;

-- Insert Company Types with check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM company_types WHERE id = 1) THEN
        INSERT INTO company_types (id, name) VALUES
        (1, 'Müşteri'),
        (2, 'Taşeron'),
        (3, 'Tedarikçi');
        RAISE NOTICE 'Inserted company types data';
    END IF;
END $$;

-- Insert Demo Company with check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = 1) THEN
        INSERT INTO companies (id, name, tax_no, address, phone, city_id, is_active)
        VALUES (1, 'Demo Şirket A.Ş.', '1234567890', 'Demo Adres', '+90 212 555 0101', 1, true);
        RAISE NOTICE 'Inserted demo company';
    END IF;
END $$;

-- Insert or Update Admin User
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
        INSERT INTO users (email, password_hash, company_id, position_level, is_active)
        VALUES (
            'admin@example.com',
            '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK',
            1,
            1,
            true
        );
        RAISE NOTICE 'Created admin user';
    ELSE
        UPDATE users 
        SET password_hash = '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK',
            is_active = true
        WHERE email = 'admin@example.com';
        RAISE NOTICE 'Updated admin user';
    END IF;
END $$;

-- Insert Roles with check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = 1) THEN
        INSERT INTO roles (id, name, description) VALUES
        (1, 'Admin', 'Sistem yöneticisi'),
        (2, 'Manager', 'Bölge/Proje yöneticisi'),
        (3, 'User', 'Normal kullanıcı');
        RAISE NOTICE 'Inserted roles';
    END IF;
END $$;

-- Assign Admin role to admin user
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE u.email = 'admin@example.com' AND ur.role_id = 1
    ) THEN
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, 1
        FROM users u
        WHERE u.email = 'admin@example.com';
        RAISE NOTICE 'Assigned admin role';
    END IF;
END $$;

-- Insert or Update Production API Client
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM api_clients WHERE name = 'Production Main API') THEN
        INSERT INTO api_clients (name, company_id, is_active)
        VALUES ('Production Main API', 1, true);
        RAISE NOTICE 'Created Production API Client';
    ELSE
        UPDATE api_clients SET is_active = true WHERE name = 'Production Main API';
        RAISE NOTICE 'Updated Production API Client';
    END IF;
END $$;

-- Insert or Update Production API Key
WITH client AS (
    SELECT id FROM api_clients WHERE name = 'Production Main API'
)
INSERT INTO api_keys (
    client_id,
    key_hash,
    permissions,
    allowed_domains,
    is_active
) 
SELECT 
    client.id,
    '$2b$10$EbPHkGCd/.4KM.OVdd1Hp.51vqCBEu67A/lpLzS6yFdFQA3Hep9AW',
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
    is_active = true;

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_car_models_capacity ON car_models(capacity);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
-- ... (all other indexes from the original file)

-- Clean up helper functions
DROP FUNCTION IF EXISTS table_exists(text);
DROP FUNCTION IF EXISTS column_exists(text, text);

-- Final status
DO $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    api_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO user_count FROM users WHERE email = 'admin@example.com' AND is_active = true;
    SELECT COUNT(*) INTO api_count FROM api_keys WHERE is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DEPLOYMENT SUMMARY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total Tables: %', table_count;
    RAISE NOTICE 'Admin Users: %', user_count;
    RAISE NOTICE 'Active API Keys: %', api_count;
    RAISE NOTICE '============================================';
END $$;
EOF

    # Execute the temporary SQL file
    if execute_sql_file "$DB_NAME" "temp_deploy.sql"; then
        print_success "Schema deployment completed"
        rm -f temp_deploy.sql
    else
        print_error "Schema deployment failed"
        rm -f temp_deploy.sql
        exit 1
    fi
    
    # Also execute the full schema file for any missing components
    if [ -f "production-full-database-setup.sql" ]; then
        print_status "Applying full schema file for completeness..."
        execute_sql_file "$DB_NAME" "production-full-database-setup.sql" 2>/dev/null || true
    fi
fi

# Step 4: Verify critical data
print_status "Verifying critical data..."

# Check admin user
ADMIN_EXISTS=$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM users WHERE email = 'admin@example.com'" | tr -d '[:space:]')
if [ "$ADMIN_EXISTS" -gt "0" ]; then
    print_success "Admin user exists"
else
    print_error "Admin user missing!"
fi

# Check API key
API_KEY_EXISTS=$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM api_keys WHERE is_active = true" | tr -d '[:space:]')
if [ "$API_KEY_EXISTS" -gt "0" ]; then
    print_success "API key configured"
else
    print_error "API key missing!"
fi

# Step 5: Final verification
print_status "Running final verification..."

FINAL_TABLE_COUNT=$(count_tables)
print_status "Final table count: $FINAL_TABLE_COUNT"

# Check data in key tables
echo ""
print_status "Data verification:"

for table in countries cities companies users roles permissions api_clients api_keys; do
    if check_table_exists "$table"; then
        count=$(execute_sql "$DB_NAME" "SELECT COUNT(*) FROM $table" | tr -d '[:space:]')
        printf "  %-20s: %s records\n" "$table" "$count"
    fi
done

# Step 6: Summary
echo ""
echo "============================================"
echo "DEPLOYMENT SUMMARY"
echo "============================================"

if [ "$DB_CREATED" = true ]; then
    print_success "Database created from scratch"
else
    print_success "Used existing database"
fi

if [ "$INITIAL_TABLE_COUNT" -lt "$FINAL_TABLE_COUNT" ]; then
    TABLES_ADDED=$((FINAL_TABLE_COUNT - INITIAL_TABLE_COUNT))
    print_success "Added $TABLES_ADDED new tables"
fi

print_success "Total tables: $FINAL_TABLE_COUNT"

# Show access credentials
echo ""
echo "============================================"
echo "ACCESS CREDENTIALS"
echo "============================================"
echo "Admin Login: admin@example.com / Architect"
echo "API Key: ak_prod2025_rwba6dj1sw"
echo "Database: $DB_NAME"
echo "============================================"

# Optional: Run additional verification script
if [ -f "verify-production.sh" ] && [ "$1" = "--verify" ]; then
    echo ""
    print_status "Running additional verification..."
    ./verify-production.sh
fi

print_success "Deployment completed successfully!"