# StockFlow Application Documentation

## 📍 Server Information
- **Domain**: `stock.aarasa.click`
- **Port**: `3010`
- **VPS Directory**: `/var/www/stock`
- **PM2 Process Name**: `stockflow` (ID: 9)
- **Database Name**: `inventory_db` (MySQL)

## 🛠 Deployment Commands
Run these commands in order to update the application safely:

```bash
# 1. Navigate to directory
cd /var/www/stock

# 2. Pull latest code
git pull origin master

# 3. Install dependencies (IMPORTANT: Prisma downgraded to v5.22.0)
npm install

# 4. Database Migration (IMPORTANT if schema changes)
npx prisma migrate deploy
# If migration fails, check if manual fix is needed (see Troubleshooting)

# 5. Build Application
npm run build

# 6. Restart Service
pm2 restart stockflow

# 7. Check Logs
pm2 logs stockflow --lines 20
```

## 🗄️ Database Schema Notes
### Categories Table
The `categories` table MUST have the `prefix` column for Auto-SKU generation to work.

**Schema Definition:**
```sql
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    prefix VARCHAR(10),  -- Critical Requirement
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
);
```

**Manual Fix (if missing):**
```sql
ALTER TABLE categories ADD COLUMN prefix VARCHAR(10) NULL AFTER description;
```

## ⚙️ Environment Variables (.env)
Critical variables for production:

```ini
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/inventory_db"
NEXTAUTH_URL="http://stock.aarasa.click:3010"
NEXTAUTH_SECRET="your-secret-key"
# MOCK_DATA must be false for production
MOCK_DATA=false
NEXT_PUBLIC_MOCK_DATA=false
```

## 🚨 Troubleshooting
### 1. "Column prefix does not exist"
- **Cause**: Database migration didn't run.
- **Fix**: Run `npx prisma migrate deploy` OR execute the manual SQL fix above.

### 2. "500 Internal Server Error" on Login
- **Cause**: Database connection issue or NEXTAUTH_URL mismatch.
- **Fix**: Check `.env` and verify MySQL service is running (`systemctl status mysql`).

### 3. Application Not Updating
- **Cause**: Build command not run or PM2 not restarted.
- **Fix**: Always run `npm run build` AND `pm2 restart stockflow` after `git pull`.

### 4. Modal Cut Off on Mobile
- **Status**: Fixed (Feb 2026) using dynamic viewport units (`dvh`).
- **File**: `globals.css`
- **Note**: Do not revert CSS changes related to `.modal-content` or `@media (max-width: 640px)`.
