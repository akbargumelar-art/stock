#!/bin/bash

# VPS Deployment Script
# Update variabel di bawah sesuai dengan konfigurasi VPS Anda

# ========== KONFIGURASI ==========
VPS_USER="root"                    # Username SSH VPS
VPS_HOST="your-vps-ip"             # IP address atau hostname VPS
VPS_PORT="22"                      # SSH port (default: 22)
APP_DIR="/var/www/stock"           # Path direktori aplikasi di VPS
PM2_APP_NAME="stock"               # Nama aplikasi di PM2

# ========== DEPLOYMENT ==========
echo "🚀 Starting deployment to VPS..."
echo "================================================"

# SSH ke VPS dan jalankan deployment commands
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
    set -e  # Exit on error

    echo "📂 Navigating to application directory..."
    cd $(echo $APP_DIR)

    echo "🔄 Pulling latest changes from GitHub..."
    git pull origin master

    echo "📦 Installing dependencies..."
    npm install

    echo "🗄️  Running Prisma migrations..."
    npx prisma generate
    npx prisma migrate deploy

    echo "🏗️  Building Next.js application..."
    npm run build

    echo "♻️  Restarting PM2 application..."
    pm2 restart $(echo $PM2_APP_NAME)

    echo "✅ Deployment completed successfully!"
    
    echo ""
    echo "📊 Application Status:"
    pm2 status $(echo $PM2_APP_NAME)
ENDSSH

echo "================================================"
echo "✅ Deployment script finished!"
echo ""
echo "Tip: Jika ada error, cek log dengan:"
echo "  ssh $VPS_USER@$VPS_HOST 'pm2 logs $PM2_APP_NAME'"
