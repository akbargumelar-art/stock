# Deployment Guide

## Quick Deployment to VPS

Gunakan skrip deployment yang sudah disediakan untuk deploy changes ke VPS.

### Setup (Lakukan sekali saja)

1. **Edit konfigurasi deployment script:**

   **Untuk Linux/Mac** (`deploy.sh`):
   ```bash
   nano deploy.sh
   ```

   **Untuk Windows** (`deploy.ps1`):
   ```powershell
   notepad deploy.ps1
   ```

2. **Update variabel berikut:**
   ```bash
   VPS_USER="root"              # Ganti dengan username VPS
   VPS_HOST="123.45.67.89"      # Ganti dengan IP VPS
   VPS_PORT="22"                # Port SSH (default: 22)
   APP_DIR="/var/www/stock"     # Path aplikasi di VPS
   PM2_APP_NAME="stock"         # Nama app di PM2
   ```

3. **Set permission (Linux/Mac only):**
   ```bash
   chmod +x deploy.sh
   ```

### Cara Deploy

#### Option 1: Menggunakan Bash Script (Recommended)
```bash
# Linux/Mac/Git Bash
./deploy.sh
```

#### Option 2: Menggunakan PowerShell (Windows)
```powershell
# PowerShell
.\deploy.ps1
```

#### Option 3: Manual SSH Commands
```bash
# 1. SSH ke VPS
ssh user@vps-ip

# 2. Navigate ke direktori aplikasi
cd /var/www/stock

# 3. Pull latest changes
git pull origin master

# 4. Install dependencies
npm install

# 5. Run Prisma migrations
npx prisma generate
npx prisma migrate deploy

# 6. Build aplikasi
npm run build

# 7. Restart PM2
pm2 restart stock

# 8. Cek status
pm2 status stock
```

## Deployment Process

Script akan melakukan hal berikut secara otomatis:
1. ✅ Connect ke VPS via SSH
2. ✅ Navigate ke direktori aplikasi
3. ✅ Pull changes dari GitHub
4. ✅ Install npm dependencies
5. ✅ Generate Prisma client
6. ✅ Run database migrations
7. ✅ Build Next.js application
8. ✅ Restart PM2 application
9. ✅ Show application status

## Troubleshooting

### SSH Connection Failed
```bash
# Test SSH connection
ssh user@vps-ip

# Jika pakai SSH key
ssh -i ~/.ssh/id_rsa user@vps-ip
```

### Permission Denied
```bash
# Cek permission file
ls -la deploy.sh

# Set executable permission
chmod +x deploy.sh
```

### PM2 Not Found
```bash
# SSH ke VPS dan install PM2
ssh user@vps-ip
npm install -g pm2
```

### Build Failed
```bash
# SSH ke VPS dan cek logs
ssh user@vps-ip
cd /var/www/stock
npm run build

# Cek disk space
df -h

# Cek memory
free -h
```

### Migration Failed
```bash
# SSH ke VPS
ssh user@vps-ip
cd /var/www/stock

# Reset database (HATI-HATI!)
npx prisma migrate reset

# Run migration manual
npx prisma migrate deploy
```

## Post-Deployment

### Cek Application Logs
```bash
# Via SSH
ssh user@vps-ip 'pm2 logs stock'

# Atau SSH dulu lalu cek logs
ssh user@vps-ip
pm2 logs stock --lines 50
```

### Cek Application Status
```bash
ssh user@vps-ip 'pm2 status'
```

### Restart Jika Diperlukan
```bash
ssh user@vps-ip 'pm2 restart stock'
```

## Tips

- **Selalu test di local dulu** sebelum deploy ke VPS
- **Commit changes** sebelum deploy
- **Backup database** sebelum run migration di production
- **Monitor logs** setelah deployment
- **Cek application** di browser setelah deploy

## Common Workflow

```bash
# 1. Local development
npm run dev

# 2. Test changes
# ... testing ...

# 3. Commit changes
git add .
git commit -m "feat: description"

# 4. Push to GitHub
git push

# 5. Deploy to VPS
./deploy.sh

# 6. Verify deployment
# Buka https://your-vps-domain.com
```
