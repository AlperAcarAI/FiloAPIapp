module.exports = {
  apps: [{
    name: 'filokiapi',
    script: 'dist/index.js',
    cwd: '/var/www/filokiapi/FiloAPIapp',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://filoki_user:FilokiDB2025@localhost:5432/filoki_db',
      JWT_SECRET: 'filoki-jwt-secret-2025-prod-key-very-secure',
      JWT_REFRESH_SECRET: 'filoki-refresh-secret-2025-prod-key-very-secure',
      SESSION_SECRET: 'filoki-session-secret-2025-prod-key-very-secure',
      LOG_FILE_PATH: '/var/www/filokiapi/FiloAPIapp/logs',

      // Tenant 1: ERSA (mevcut)
      TENANT_1_DOMAIN: 'filokiapi.architectaiagency.com',
      TENANT_1_DB_URL: 'postgresql://filoki_user:FilokiDB2025@localhost:5432/filoki_db',
      TENANT_1_NAME: 'ERSA',

      // Tenant 2: Demo (DijiMinds)
      TENANT_2_DOMAIN: 'filodemoapi.dijiminds.com',
      TENANT_2_DB_URL: 'postgresql://demouser:DemoFilo5425@localhost:5432/demo_db',
      TENANT_2_NAME: 'DijiMinds Demo',

      // Localhost fallback (development)
      TENANT_3_DOMAIN: 'localhost',
      TENANT_3_DB_URL: 'postgresql://filoki_user:FilokiDB2025@localhost:5432/filoki_db',
      TENANT_3_NAME: 'Localhost Dev',
    },
    error_file: '/var/log/pm2/filokiapi-error.log',
    out_file: '/var/log/pm2/filokiapi-out.log',
    log_file: '/var/log/pm2/filokiapi.log',
    time: true
  }]
};
