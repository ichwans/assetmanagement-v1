module.exports = {
  apps: [
    {
      name: "orochimaru",
      script: "npx",
      args: "vite --host 0.0.0.0 --port 5173",
      cwd: "/home/adminuser/asset-hub/orochimaru",
      env: {
        VITE_PROXY_TARGET: "http://localhost:3001",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
