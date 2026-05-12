#!/bin/bash

echo "Starting AsisGrab update process..."

# 1. Pull latest changes
echo "Pulling latest code from Git..."
git pull

# 2. Update Frontend
echo "Updating Frontend dependencies and building..."
npm install
npm run build

# 3. Update Backend
echo "Updating Backend dependencies..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
else
    echo "Warning: Python venv not found. Skipping pip install."
fi
cd ..

# 4. Restart Services
echo "Restarting PM2 processes..."
pm2 restart all

echo "Update process completed successfully!"
