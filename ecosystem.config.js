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
      script: "main.py", // The actual python file
      interpreter: "venv/bin/python", // Explicitly use virtual environment Python
      cwd: "./backend", // Backend directory
      env: {
        PYTHONUNBUFFERED: "1", // Forces python to flush output to PM2 logs immediately
      },
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
