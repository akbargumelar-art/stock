#!/bin/bash

# Update Script for Stock App
# Run this on your VPS to pull latest changes and restart the app

set -e # Stop on error

echo "🚀 Starting update process..."

# 1. Pull latest changes
echo "📥 Pulling from git..."
git pull origin master

# 2. Install dependencies (in case package.json changed)
echo "📦 Installing dependencies..."
npm install

# 3. Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# 4. Push Database Changes (Optional but recommended if schema changed)
# Uncomment if you want to auto-push schema changes
# echo "🗄️  Pushing DB schema..."
# npx prisma db push

# 5. Build
echo "🏗️  Building..."
npm run build

# 6. Restart PM2
echo "🔄 Restarting application..."
pm2 restart stockflow

echo "✅ Update complete!"
