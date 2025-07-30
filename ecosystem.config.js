module.exports = {
  apps: [
    {
      name: "fleet-management-api",
      script: "npm",
      args: "start",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false
    }
  ]
};