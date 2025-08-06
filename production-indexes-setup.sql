-- FiloAPI Production Database Indexes Setup
-- Bu dosya tüm performans index'lerini oluşturur

-- Car Models indexes
CREATE INDEX IF NOT EXISTS idx_car_models_capacity ON car_models(capacity);

-- Users indexes  
CREATE INDEX IF NOT EXISTS idx_users_personnel_id ON users(personnel_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

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

-- Rate Limit Buckets indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_bucket ON rate_limit_buckets(identifier, bucket_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_buckets(window_end);

-- Password History indexes
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_time ON password_history(created_at);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- API Request Logs indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_client_endpoint ON api_request_logs(client_id, endpoint_id);

-- API Rate Limit indexes (fixed duplicate name)
CREATE INDEX IF NOT EXISTS idx_api_rate_limit_client_endpoint ON api_rate_limit(client_id, endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limit_window ON api_rate_limit(window_start, window_end);

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
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- Financial Current Accounts indexes
CREATE INDEX IF NOT EXISTS idx_fin_accounts_entity ON fin_current_accounts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_type ON fin_current_accounts(account_type);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand_id, model_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_work_area ON vehicles(work_area_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_personnel ON vehicles(assigned_personnel_id);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_tax_no ON companies(tax_no);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);