#!/bin/bash

# Deployment Script for StockFlow

# Stop execution on any error
set -e

echo "🚀 Starting deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin master

# 2. Install dependencies
echo "📦 Installing dependencies..."
# Use 'npm ci' for a clean, deterministic install if package-lock.json exists
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Ensure upload directory exists
mkdir -p public/uploads

# 3. Update Database Schema
echo "🗄️  Updating database schema..."
npx prisma db push

# 4. Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# 5. Build Application
echo "🏗️  Building application..."
npm run build

# 6. Restart Application
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    # Modify 'stock-app' to your actual PM2 process name if different
    pm2 restart all
    echo "✅ PM2 processes restarted."
else
    echo "⚠️  PM2 not found. Please restart your node process manually."
fi

echo "✨ Deployment completed successfully!"
