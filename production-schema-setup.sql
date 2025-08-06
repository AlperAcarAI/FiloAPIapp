-- FiloAPI Production Database Schema Setup
-- Bu dosya tüm tabloları ve index'leri oluşturur

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[], -- Array of permissions
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Car Brands table
CREATE TABLE IF NOT EXISTS car_brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  country VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Car Models table
CREATE TABLE IF NOT EXISTS car_models (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES car_brands(id),
  name VARCHAR(100) NOT NULL,
  year_start INTEGER,
  year_end INTEGER,
  fuel_type VARCHAR(50),
  engine_size DECIMAL(3,1),
  capacity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(brand_id, name, year_start)
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

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  personnel_id INTEGER UNIQUE REFERENCES personnel(id),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  password_changed_at TIMESTAMP,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  account_locked_until TIMESTAMP,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Login Attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100),
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  device_fingerprint TEXT,
  location_info TEXT,
  attempt_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Devices table
CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  device_fingerprint TEXT NOT NULL,
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  browser_info TEXT,
  ip_address VARCHAR(45),
  last_used_at TIMESTAMP,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
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
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rate Limit Buckets table
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(100) NOT NULL,
  bucket_type VARCHAR(20) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP NOT NULL DEFAULT NOW(),
  window_end TIMESTAMP NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until TIMESTAMP
);

-- Password History table
CREATE TABLE IF NOT EXISTS password_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Access Levels table
CREATE TABLE IF NOT EXISTS access_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  hierarchy_level INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Access Rights table
CREATE TABLE IF NOT EXISTS user_access_rights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  access_level_id INTEGER NOT NULL REFERENCES access_levels(id),
  access_scope TEXT,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- API Clients table
CREATE TABLE IF NOT EXISTS api_clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  client_id VARCHAR(100) NOT NULL UNIQUE,
  client_secret TEXT,
  description TEXT,
  allowed_origins TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES api_clients(id),
  name VARCHAR(100) NOT NULL,
  key_hash TEXT NOT NULL,
  key TEXT,
  permissions TEXT[],
  allowed_domains TEXT[] NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API Tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES api_clients(id),
  user_id INTEGER REFERENCES users(id),
  token TEXT NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess TEXT NOT NULL,
  expire TIMESTAMP NOT NULL
);

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
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API Endpoints table
CREATE TABLE IF NOT EXISTS api_endpoints (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  rate_limit_per_minute INTEGER DEFAULT 60,
  required_permissions TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(path, method)
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
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API Client Permissions table
CREATE TABLE IF NOT EXISTS api_client_permissions (
  client_id INTEGER NOT NULL REFERENCES api_clients(id),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  granted_by INTEGER REFERENCES users(id),
  PRIMARY KEY (client_id, permission_id)
);

-- API Rate Limit table
CREATE TABLE IF NOT EXISTS api_rate_limit (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES api_clients(id),
  endpoint_id INTEGER REFERENCES api_endpoints(id),
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP NOT NULL DEFAULT NOW(),
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
  request_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
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
  total_data_transferred_bytes BIGINT DEFAULT 0
);

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

-- Documents table (polymorphic)
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Financial Current Accounts table
CREATE TABLE IF NOT EXISTS fin_current_accounts (
  id SERIAL PRIMARY KEY,
  account_type VARCHAR(20) NOT NULL,
  entity_type VARCHAR(20) NOT NULL,
  entity_id INTEGER NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
  metadata TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(20) NOT NULL UNIQUE,
  brand_id INTEGER REFERENCES car_brands(id),
  model_id INTEGER REFERENCES car_models(id),
  year INTEGER,
  color VARCHAR(50),
  chassis_no VARCHAR(50),
  engine_no VARCHAR(50),
  fuel_type VARCHAR(20),
  current_km INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  work_area_id INTEGER REFERENCES work_areas(id),
  assigned_personnel_id INTEGER REFERENCES personnel(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tax_no VARCHAR(20) UNIQUE,
  tax_office VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  contact_person VARCHAR(100),
  company_type VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);