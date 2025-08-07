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
      DOMAIN: 'filokiapi.architectaiagency.com'
    },
    error_file: '/var/log/pm2/filokiapi-error.log',
    out_file: '/var/log/pm2/filokiapi-out.log',
    log_file: '/var/log/pm2/filokiapi.log',
    time: true
  }]
};
