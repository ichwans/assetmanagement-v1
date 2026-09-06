module.exports = {
  apps: [
    {
      name: "minato",
      script: "./bin/app",
      cwd: "/home/adminuser/asset-hub/minato",
      env: {
        FABRIC_GATEWAY_URL: "http://localhost:3000",
        IPFS_API: "http://localhost:5001",
        SEED_ADMIN_EMAIL: "admin@assethub.com",
        SEED_ADMIN_PASSWORD: "Secret123",
        SEED_ADMIN_NAME: "Administrator",
        SEED_ADMIN_ROLE: "admin",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_USER: "asset@ipmi.ac.id",
        SMTP_PASS: "mjyh kjou bsvm srrh",
        SMTP_FROM: "asset@ipmi.ac.id",
        FRONTEND_URL: "http://asset.ipmi.ac.id",
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
