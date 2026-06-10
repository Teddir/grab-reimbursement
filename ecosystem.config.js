const path = require('path');

module.exports = {
  apps: [
    {
      name: "asisgrab-frontend",
      script: "npm",
      args: "start",
      cwd: "./", // Root directory where Next.js is located
      env: {
        NODE_ENV: "production",
      },
      watch: false, // Disabled for production to prevent memory leaks
      max_memory_restart: "1G", // Auto-restart if memory exceeds 1GB
    },
    {
      name: "asisgrab-backend",
      script: "main.py", 
      interpreter: "python3", // Simplified per user request
      cwd: "./backend",
      env: {
        PYTHONUNBUFFERED: "1", // Forces python to flush output to PM2 logs immediately
      },
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
