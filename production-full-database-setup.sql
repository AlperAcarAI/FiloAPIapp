-- ============================================
-- FILOKI API PRODUCTION DATABASE FULL SETUP
-- Domain: filokiapi.architectaiagency.com
-- Date: 2025-01-30
-- ============================================

-- Drop existing database and recreate (optional - comment out if not needed)
-- DROP DATABASE IF EXISTS proje_db;
-- CREATE DATABASE proje_db;

-- ============================================
-- 1. LOOKUP/REFERENCE TABLES (No dependencies)
-- ============================================

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    phone_code VARCHAR(10)
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id INTEGER NOT NULL REFERENCES countries(id)
);

-- Company Types table
CREATE TABLE IF NOT EXISTS company_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Policy Types table
CREATE TABLE IF NOT EXISTS policy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Damage Types table
CREATE TABLE IF NOT EXISTS damage_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Ownership Types table
CREATE TABLE IF NOT EXISTS ownership_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Maintenance Types table
CREATE TABLE IF NOT EXISTS maintenance_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Car Brands table
CREATE TABLE IF NOT EXISTS car_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Car Types table
CREATE TABLE IF NOT EXISTS car_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Personnel Positions table
CREATE TABLE IF NOT EXISTS personnel_positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Document Main Types table
CREATE TABLE IF NOT EXISTS doc_main_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Payment Types table
CREATE TABLE IF NOT EXISTS payment_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CORE BUSINESS TABLES
-- ============================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
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

-- Document Sub Types table
CREATE TABLE IF NOT EXISTS doc_sub_types (
    id SERIAL PRIMARY KEY,
    main_type_id INTEGER NOT NULL REFERENCES doc_main_types(id),
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Car Models table
CREATE TABLE IF NOT EXISTS car_models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES car_brands(id),
    name VARCHAR(100) NOT NULL,
    type_id INTEGER NOT NULL REFERENCES car_types(id),
    capacity INTEGER NOT NULL,
    detail TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Personnel table
CREATE TABLE IF NOT EXISTS personnel (
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

-- Penalty Types table
CREATE TABLE IF NOT EXISTS penalty_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    penalty_score INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    discounted_amount_cents INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_date DATE
);

-- ============================================
-- 3. AUTHENTICATION & AUTHORIZATION TABLES
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Role Permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id),
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Access Levels table
CREATE TABLE IF NOT EXISTS access_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    hierarchy_level INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Access Rights table
CREATE TABLE IF NOT EXISTS user_access_rights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    access_level_id INTEGER NOT NULL REFERENCES access_levels(id),
    access_scope TEXT, -- JSON format
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- User Roles table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- API Clients table
CREATE TABLE IF NOT EXISTS api_clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    company_id INTEGER REFERENCES companies(id),
    user_id INTEGER REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL UNIQUE REFERENCES api_clients(id),
    key_hash TEXT NOT NULL,
    key TEXT, -- Plain text key (optional)
    permissions TEXT[], -- Array of permissions
    allowed_domains TEXT[] NOT NULL, -- Domain restrictions
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES api_clients(id),
    user_id INTEGER REFERENCES users(id),
    token TEXT NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess TEXT NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- ============================================
-- 4. SECURITY TABLES
-- ============================================

-- Login Attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    failure_reason VARCHAR(50)
);

-- User Security Settings table
CREATE TABLE IF NOT EXISTS user_security_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    is_account_locked BOOLEAN NOT NULL DEFAULT false,
    lock_reason VARCHAR(100),
    locked_at TIMESTAMP,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verify_token TEXT,
    email_verify_expires TIMESTAMP,
    max_concurrent_sessions INTEGER DEFAULT 5,
    require_password_change BOOLEAN NOT NULL DEFAULT false,
    last_password_check TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_fingerprint TEXT NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(20),
    browser_info TEXT,
    os_info VARCHAR(100),
    screen_resolution VARCHAR(20),
    timezone VARCHAR(50),
    language VARCHAR(10),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_trusted BOOLEAN NOT NULL DEFAULT false,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    times_used INTEGER DEFAULT 1,
    UNIQUE(user_id, device_fingerprint)
);

-- Security Events table
CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint TEXT,
    location TEXT,
    metadata TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limit Buckets table
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL,
    bucket_type VARCHAR(20) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    blocked_until TIMESTAMP,
    UNIQUE(identifier, bucket_type)
);

-- Password History table
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. API MANAGEMENT TABLES
-- ============================================

-- API Endpoints table
CREATE TABLE IF NOT EXISTS api_endpoints (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    endpoint VARCHAR(255) NOT NULL UNIQUE,
    method VARCHAR(10) NOT NULL,
    description TEXT,
    required_permissions TEXT[],
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Request Logs table
CREATE TABLE IF NOT EXISTS api_request_logs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES api_clients(id),
    api_key_id INTEGER REFERENCES api_keys(id),
    user_id INTEGER REFERENCES users(id),
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_body TEXT,
    response_status INTEGER,
    response_time INTEGER,
    error_message TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Client Permissions table
CREATE TABLE IF NOT EXISTS api_client_permissions (
    client_id INTEGER NOT NULL REFERENCES api_clients(id),
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    PRIMARY KEY (client_id, permission_id)
);

-- API Rate Limit table
CREATE TABLE IF NOT EXISTS api_rate_limit (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES api_clients(id),
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP NOT NULL
);

-- API Usage Logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id SERIAL PRIMARY KEY,
    api_client_id INTEGER REFERENCES api_clients(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    request_size_bytes INTEGER DEFAULT 0,
    response_size_bytes INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    request_body_hash VARCHAR(64)
);

-- API Usage Stats table
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id SERIAL PRIMARY KEY,
    api_client_id INTEGER NOT NULL REFERENCES api_clients(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    usage_date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    success_requests INTEGER DEFAULT 0,
    error_requests INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(8,2) DEFAULT 0,
    min_response_time_ms INTEGER DEFAULT 0,
    max_response_time_ms INTEGER DEFAULT 0,
    total_data_transferred_bytes BIGINT DEFAULT 0,
    UNIQUE(api_client_id, endpoint, method, usage_date)
);

-- ============================================
-- 6. ASSET MANAGEMENT TABLES
-- ============================================

-- Work Areas table
CREATE TABLE IF NOT EXISTS work_areas (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    manager_id INTEGER REFERENCES personnel(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Company Type Matches table
CREATE TABLE IF NOT EXISTS company_type_matches (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    type_id INTEGER NOT NULL REFERENCES company_types(id),
    UNIQUE(company_id, type_id)
);

-- Personnel Company Matches table
CREATE TABLE IF NOT EXISTS personnel_company_matches (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL REFERENCES personnel(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    position_id INTEGER NOT NULL REFERENCES personnel_positions(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(personnel_id, company_id, is_active)
);

-- Personnel Work Areas table
CREATE TABLE IF NOT EXISTS personnel_work_areas (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL REFERENCES personnel(id),
    work_area_id INTEGER NOT NULL REFERENCES work_areas(id),
    position_id INTEGER NOT NULL REFERENCES personnel_positions(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES car_models(id),
    model_year INTEGER NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    chassis_no VARCHAR(50),
    engine_no VARCHAR(50),
    ownership_type_id INTEGER NOT NULL REFERENCES ownership_types(id),
    owner_company_id INTEGER REFERENCES companies(id),
    register_no VARCHAR(50),
    register_date DATE,
    purchase_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES personnel(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES personnel(id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Assets Personnel Assignment table
CREATE TABLE IF NOT EXISTS assets_personel_assignment (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    personnel_id INTEGER NOT NULL REFERENCES personnel(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Asset Documents table
CREATE TABLE IF NOT EXISTS asset_documents (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    personnel_id INTEGER REFERENCES personnel(id),
    doc_type_id INTEGER NOT NULL REFERENCES doc_sub_types(id),
    description VARCHAR(255),
    doc_link TEXT,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES personnel(id),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64)
);

-- Personnel Documents table
CREATE TABLE IF NOT EXISTS personnel_documents (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL REFERENCES personnel(id),
    doc_type_id INTEGER NOT NULL REFERENCES doc_sub_types(id),
    description VARCHAR(255),
    doc_link TEXT,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES personnel(id),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64)
);

-- Unified Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('personnel', 'asset', 'company', 'work_area')),
    entity_id INTEGER NOT NULL,
    doc_type_id INTEGER NOT NULL REFERENCES doc_sub_types(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validity_start_date DATE,
    validity_end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trip Rentals table
CREATE TABLE IF NOT EXISTS trip_rentals (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    rental_company_id INTEGER NOT NULL REFERENCES companies(id),
    driver_id INTEGER REFERENCES personnel(id),
    trip_date DATE NOT NULL,
    trip_start_time VARCHAR(5),
    trip_end_time VARCHAR(5),
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    route_description TEXT,
    distance_km DECIMAL(10,2),
    price_per_trip_cents INTEGER NOT NULL,
    additional_costs_cents INTEGER DEFAULT 0,
    total_amount_cents INTEGER NOT NULL,
    trip_status VARCHAR(20) NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- ============================================
-- 7. FLEET MANAGEMENT TABLES
-- ============================================

-- Assets Policies table
CREATE TABLE IF NOT EXISTS assets_policies (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    policy_type_id INTEGER NOT NULL REFERENCES policy_types(id),
    seller_company_id INTEGER NOT NULL REFERENCES companies(id),
    insurance_company_id INTEGER NOT NULL REFERENCES companies(id),
    start_date DATE NOT NULL,
    end_date DATE,
    policy_number VARCHAR(100) NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    pid INTEGER,
    UNIQUE(asset_id, policy_number)
);

-- Assets Damage Data table
CREATE TABLE IF NOT EXISTS assets_damage_data (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    personnel_id INTEGER REFERENCES personnel(id),
    damage_type_id INTEGER NOT NULL REFERENCES damage_types(id),
    start_date DATE NOT NULL,
    end_date DATE,
    event_date DATE NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    documents TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    policy_id INTEGER REFERENCES assets_policies(id)
);

-- Assets Maintenance table
CREATE TABLE IF NOT EXISTS assets_maintenance (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    maintenance_type_id INTEGER NOT NULL REFERENCES maintenance_types(id),
    maintenance_date DATE NOT NULL,
    due_by_date DATE,
    km_reading INTEGER,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)
);

-- Fuel Records table
CREATE TABLE IF NOT EXISTS fuel_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    record_date DATE NOT NULL,
    current_kilometers INTEGER NOT NULL CHECK (current_kilometers >= 0),
    fuel_amount DECIMAL(8,2) NOT NULL CHECK (fuel_amount > 0),
    fuel_cost_cents INTEGER NOT NULL CHECK (fuel_cost_cents >= 0),
    gas_station_name VARCHAR(100),
    driver_id INTEGER REFERENCES personnel(id),
    notes TEXT,
    receipt_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES personnel(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES personnel(id)
);

-- Rental Agreements table
CREATE TABLE IF NOT EXISTS rental_agreements (
    id SERIAL PRIMARY KEY,
    agreement_number VARCHAR(50) NOT NULL UNIQUE,
    rental_company_id INTEGER NOT NULL REFERENCES companies(id),
    tenant_company_id INTEGER NOT NULL REFERENCES companies(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_short_term BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Rental Assets table
CREATE TABLE IF NOT EXISTS rental_assets (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES rental_agreements(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    mount_cents INTEGER NOT NULL,
    vat_percent DECIMAL(5,2) NOT NULL,
    km_hour_limit INTEGER NOT NULL,
    km_total_limit INTEGER NOT NULL
);

-- Penalties table
CREATE TABLE IF NOT EXISTS penalties (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    driver_id INTEGER REFERENCES personnel(id),
    penalty_type_id INTEGER NOT NULL REFERENCES penalty_types(id),
    amount_cents INTEGER NOT NULL,
    discounted_amount_cents INTEGER NOT NULL,
    penalty_date DATE NOT NULL,
    last_date DATE,
    status VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES personnel(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES personnel(id)
);

-- ============================================
-- 8. FINANCIAL MANAGEMENT TABLES
-- ============================================

-- Financial Current Accounts table
CREATE TABLE IF NOT EXISTS fin_current_accounts (
    id SERIAL PRIMARY KEY,
    is_debit BOOLEAN NOT NULL,
    description VARCHAR(255),
    payer_company_id INTEGER NOT NULL REFERENCES companies(id),
    payee_company_id INTEGER NOT NULL REFERENCES companies(id),
    amount_cents INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    payment_status VARCHAR(20) DEFAULT 'beklemede',
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Accounts Details table
CREATE TABLE IF NOT EXISTS fin_accounts_details (
    id SERIAL PRIMARY KEY,
    fin_cur_ac_id INTEGER NOT NULL REFERENCES fin_current_accounts(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    date DATE NOT NULL,
    payment_type_id INTEGER NOT NULL REFERENCES payment_types(id),
    is_done BOOLEAN NOT NULL DEFAULT false,
    done_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. AUDIT TRAIL TABLE
-- ============================================

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    record_id INTEGER NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values TEXT,
    new_values TEXT,
    changed_fields TEXT[],
    user_id INTEGER REFERENCES users(id),
    api_client_id INTEGER REFERENCES api_clients(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. INDEXES
-- ============================================

-- Car Models indexes
CREATE INDEX IF NOT EXISTS idx_car_models_capacity ON car_models(capacity);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Refresh Tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Login Attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempt_time);

-- User Devices indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);

-- Security Events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_time ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);

-- Rate Limit indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_bucket ON rate_limit_buckets(identifier, bucket_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_buckets(window_end);

-- Password History indexes
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_time ON password_history(created_at);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- API Request Logs indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_client_endpoint ON api_request_logs(client_id, endpoint_id);

-- API Rate Limit indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_client_endpoint ON api_rate_limit(client_id, endpoint_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_range ON api_rate_limit(window_start, window_end);

-- API Usage Logs indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_client_id ON api_usage_logs(api_client_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage_logs(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage_logs(status_code);

-- API Usage Stats indexes
CREATE INDEX IF NOT EXISTS idx_api_stats_client_date ON api_usage_stats(api_client_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_api_stats_endpoint_date ON api_usage_stats(endpoint, usage_date);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);

-- Trip Rentals indexes
CREATE INDEX IF NOT EXISTS idx_trip_rentals_asset_date ON trip_rentals(asset_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_trip_rentals_company_date ON trip_rentals(rental_company_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_trip_rentals_status ON trip_rentals(trip_status);

-- Fuel Records indexes
CREATE INDEX IF NOT EXISTS idx_fuel_records_asset_date ON fuel_records(asset_id, record_date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_kilometers ON fuel_records(current_kilometers);

-- Rental Assets indexes
CREATE INDEX IF NOT EXISTS idx_rental_assets_vat_kmh ON rental_assets(vat_percent, km_hour_limit);

-- ============================================
-- 11. INITIAL DATA
-- ============================================

-- Insert Countries
INSERT INTO countries (id, name, phone_code) VALUES
(1, 'Türkiye', '+90'),
(2, 'Almanya', '+49'),
(3, 'Amerika Birleşik Devletleri', '+1')
ON CONFLICT (id) DO NOTHING;

-- Insert Cities
INSERT INTO cities (id, name, country_id) VALUES
(1, 'İstanbul', 1),
(2, 'Ankara', 1),
(3, 'İzmir', 1),
(4, 'Berlin', 2),
(5, 'New York', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert Company Types
INSERT INTO company_types (id, name) VALUES
(1, 'Müşteri'),
(2, 'Taşeron'),
(3, 'Tedarikçi')
ON CONFLICT (id) DO NOTHING;

-- Insert Policy Types
INSERT INTO policy_types (id, name, is_active) VALUES
(1, 'Kasko', true),
(2, 'Trafik Sigortası', true),
(3, 'Kapsamlı Sigorta', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Payment Methods
INSERT INTO payment_methods (id, name, is_active) VALUES
(1, 'Nakit', true),
(2, 'Kredi Kartı', true),
(3, 'Havale/EFT', true),
(4, 'Çek', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Damage Types
INSERT INTO damage_types (id, name, is_active) VALUES
(1, 'Kaza', true),
(2, 'Çalıntı', true),
(3, 'Doğal Afet', true),
(4, 'Diğer', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Ownership Types
INSERT INTO ownership_types (id, name, is_active) VALUES
(1, 'Şirket Mülkiyeti', true),
(2, 'Kiralık', true),
(3, 'Operasyonel Kiralama', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Maintenance Types
INSERT INTO maintenance_types (id, name, is_active) VALUES
(1, 'Periyodik Bakım', true),
(2, 'Arıza Bakımı', true),
(3, 'Kaza Onarımı', true),
(4, 'Lastik Değişimi', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Car Types
INSERT INTO car_types (id, name, is_active) VALUES
(1, 'Otomobil', true),
(2, 'Kamyonet', true),
(3, 'Kamyon', true),
(4, 'Otobüs', true),
(5, 'Motosiklet', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Personnel Positions
INSERT INTO personnel_positions (id, name, description, is_active) VALUES
(1, 'Sürücü', 'Araç sürücüsü', true),
(2, 'Yönetici', 'Bölge/Proje yöneticisi', true),
(3, 'Teknisyen', 'Bakım teknisyeni', true),
(4, 'İdari Personel', 'Ofis çalışanı', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Document Main Types
INSERT INTO doc_main_types (id, name, is_active) VALUES
(1, 'Kimlik Belgeleri', true),
(2, 'Sözleşmeler', true),
(3, 'Ruhsat/İzin Belgeleri', true),
(4, 'Mali Belgeler', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Document Sub Types
INSERT INTO doc_sub_types (id, main_type_id, name, is_active) VALUES
(1, 1, 'TC Kimlik', true),
(2, 1, 'Ehliyet', true),
(3, 2, 'İş Sözleşmesi', true),
(4, 2, 'Kira Sözleşmesi', true),
(5, 3, 'Araç Ruhsatı', true),
(6, 4, 'Fatura', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Payment Types
INSERT INTO payment_types (id, code, name, description, requires_approval, is_active) VALUES
(1, 'DAMAGE', 'Hasar Ödemesi', 'Araç hasar ödemeleri', false, true),
(2, 'POLICY', 'Poliçe Ödemesi', 'Sigorta poliçe ödemeleri', false, true),
(3, 'MAINTENANCE', 'Bakım Ödemesi', 'Araç bakım ödemeleri', false, true),
(4, 'GENERAL', 'Genel Ödeme', 'Diğer ödemeler', false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'Admin', 'Sistem yöneticisi'),
(2, 'Manager', 'Bölge/Proje yöneticisi'),
(3, 'User', 'Normal kullanıcı')
ON CONFLICT (id) DO NOTHING;

-- Insert Permissions
INSERT INTO permissions (id, name, description) VALUES
(1, 'users.create', 'Kullanıcı oluşturma'),
(2, 'users.read', 'Kullanıcı görüntüleme'),
(3, 'users.update', 'Kullanıcı güncelleme'),
(4, 'users.delete', 'Kullanıcı silme'),
(5, 'assets.create', 'Araç oluşturma'),
(6, 'assets.read', 'Araç görüntüleme'),
(7, 'assets.update', 'Araç güncelleme'),
(8, 'assets.delete', 'Araç silme')
ON CONFLICT (id) DO NOTHING;

-- Assign all permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- Insert Access Levels
INSERT INTO access_levels (id, name, code, hierarchy_level, description, is_active) VALUES
(1, 'Şantiye', 'SITE', 1, 'Şantiye seviyesi erişim', true),
(2, 'Bölge', 'REGION', 2, 'Bölge seviyesi erişim', true),
(3, 'Genel Merkez', 'HQ', 3, 'Genel merkez erişimi', true),
(4, 'Departman', 'DEPT', 1, 'Departman seviyesi erişim', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 12. PRODUCTION DATA
-- ============================================

-- Insert Demo Company
INSERT INTO companies (id, name, tax_no, address, phone, city_id, is_active)
VALUES (1, 'Demo Şirket A.Ş.', '1234567890', 'Demo Adres', '+90 212 555 0101', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Admin User
-- Password: Architect
INSERT INTO users (email, password_hash, company_id, position_level, is_active)
VALUES (
    'admin@example.com',
    '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK',
    1,
    1,
    true
)
ON CONFLICT (email) DO UPDATE
SET password_hash = '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK',
    is_active = true;

-- Assign Admin role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1
FROM users u
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;

-- Insert Production API Client
INSERT INTO api_clients (name, company_id, is_active)
VALUES ('Production Main API', 1, true)
ON CONFLICT (name) DO UPDATE
SET is_active = true;

-- Insert Production API Key
-- API Key: ak_prod2025_rwba6dj1sw
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

-- ============================================
-- 13. RESET SEQUENCES
-- ============================================

-- Reset all sequences to proper values
SELECT setval('countries_id_seq', COALESCE((SELECT MAX(id) FROM countries), 1));
SELECT setval('cities_id_seq', COALESCE((SELECT MAX(id) FROM cities), 1));
SELECT setval('companies_id_seq', COALESCE((SELECT MAX(id) FROM companies), 1));
SELECT setval('company_types_id_seq', COALESCE((SELECT MAX(id) FROM company_types), 1));
SELECT setval('policy_types_id_seq', COALESCE((SELECT MAX(id) FROM policy_types), 1));
SELECT setval('payment_methods_id_seq', COALESCE((SELECT MAX(id) FROM payment_methods), 1));
SELECT setval('damage_types_id_seq', COALESCE((SELECT MAX(id) FROM damage_types), 1));
SELECT setval('ownership_types_id_seq', COALESCE((SELECT MAX(id) FROM ownership_types), 1));
SELECT setval('maintenance_types_id_seq', COALESCE((SELECT MAX(id) FROM maintenance_types), 1));
SELECT setval('car_types_id_seq', COALESCE((SELECT MAX(id) FROM car_types), 1));
SELECT setval('personnel_positions_id_seq', COALESCE((SELECT MAX(id) FROM personnel_positions), 1));
SELECT setval('doc_main_types_id_seq', COALESCE((SELECT MAX(id) FROM doc_main_types), 1));
SELECT setval('doc_sub_types_id_seq', COALESCE((SELECT MAX(id) FROM doc_sub_types), 1));
SELECT setval('payment_types_id_seq', COALESCE((SELECT MAX(id) FROM payment_types), 1));
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));
SELECT setval('permissions_id_seq', COALESCE((SELECT MAX(id) FROM permissions), 1));
SELECT setval('access_levels_id_seq', COALESCE((SELECT MAX(id) FROM access_levels), 1));

-- ============================================
-- 14. VERIFICATION QUERIES
-- ============================================

-- Verify installation
SELECT 'Tables Created' as status, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';

-- Verify admin user
SELECT 'Admin User' as type, email, is_active FROM users WHERE email = 'admin@example.com';

-- Verify API client and key
SELECT 'API Setup' as type, ac.name, ak.is_active, array_length(ak.permissions, 1) as permissions_count
FROM api_clients ac
JOIN api_keys ak ON ac.id = ak.client_id
WHERE ac.name = 'Production Main API';

-- ============================================
-- SETUP COMPLETE!
-- 
-- Admin Login: admin@example.com / Architect
-- API Key: ak_prod2025_rwba6dj1sw
-- ============================================