# VPS Deployment Script (PowerShell)
# Update variabel di bawah sesuai dengan konfigurasi VPS Anda

# ========== KONFIGURASI ==========
$VPS_USER = "root"                    # Username SSH VPS
$VPS_HOST = "your-vps-ip"             # IP address atau hostname VPS
$VPS_PORT = "22"                      # SSH port (default: 22)
$APP_DIR = "/var/www/stock"           # Path direktori aplikasi di VPS
$PM2_APP_NAME = "stock"               # Nama aplikasi di PM2

# ========== DEPLOYMENT ==========
Write-Host "🚀 Starting deployment to VPS..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Cek apakah ssh tersedia
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH client tidak ditemukan!" -ForegroundColor Red
    Write-Host "Install OpenSSH atau gunakan Git Bash untuk menjalankan deploy.sh" -ForegroundColor Yellow
    exit 1
}

# Deployment commands yang akan dijalankan di VPS
$deployCommands = @"
set -e
echo '📂 Navigating to application directory...'
cd $APP_DIR

echo '🔄 Pulling latest changes from GitHub...'
git pull origin master

echo '📦 Installing dependencies...'
npm install

echo '🗄️  Running Prisma migrations...'
npx prisma generate
npx prisma migrate deploy

echo '🏗️  Building Next.js application...'
npm run build

echo '♻️  Restarting PM2 application...'
pm2 restart $PM2_APP_NAME

echo '✅ Deployment completed successfully!'
echo ''
echo '📊 Application Status:'
pm2 status $PM2_APP_NAME
"@

# Jalankan SSH command
try {
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" $deployCommands
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "✅ Deployment script finished!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tip: Jika ada error, cek log dengan:" -ForegroundColor Yellow
    Write-Host "  ssh $VPS_USER@$VPS_HOST 'pm2 logs $PM2_APP_NAME'" -ForegroundColor Gray
} catch {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
