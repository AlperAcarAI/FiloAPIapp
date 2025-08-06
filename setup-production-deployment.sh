#!/bin/bash

echo "🚀 Production Deployment System Setup"
echo "======================================"

# Production server bilgileri
PRODUCTION_SERVER="root@filokiapi.architectaiagency.com"
PRODUCTION_PATH="/var/www/filokiapi/FiloAPIapp"
BACKUP_PATH="/var/www/filokiapi/backups"

# 1. Production'da backup sistemi kur
echo "📦 Setting up backup system..."
ssh $PRODUCTION_SERVER << 'EOF'
mkdir -p /var/www/filokiapi/backups
cd /var/www/filokiapi/FiloAPIapp

# Current backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r . ../backups/backup_$TIMESTAMP

echo "✅ Backup created: backup_$TIMESTAMP"
EOF

# 2. Production'da Git repository düzelt
echo "🔧 Setting up Git repository..."
ssh $PRODUCTION_SERVER << 'EOF'
cd /var/www/filokiapi/FiloAPIapp

# Git durumunu temizle
git reset --hard HEAD
git clean -fd
git fetch origin main
git reset --hard origin/main

echo "✅ Git repository cleaned and updated"
EOF

# 3. Database driver'ı düzelt
echo "🗄️ Fixing database driver..."
ssh $PRODUCTION_SERVER << 'EOF'
cd /var/www/filokiapi/FiloAPIapp

# PostgreSQL driver için db.ts güncelle
cat > server/db.ts << 'DBEOF'
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Local PostgreSQL için SSL kapalı
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
DBEOF

echo "✅ Database driver updated to PostgreSQL"
EOF

# 4. Vehicles endpoint'ini ekle
echo "🚗 Adding vehicles endpoint..."
ssh $PRODUCTION_SERVER << 'EOF'
cd /var/www/filokiapi/FiloAPIapp

# Vehicles endpoint'ini routes.ts'e ekle
cp server/routes.ts server/routes.ts.backup

# Vehicles endpoint kodunu ekle (Ülke listesi endpoint'inden önce)
sed -i '/\/\/ Ülke listesini getir (Public API)/i \
\
  // Vehicles API - Public endpoint (Protected with API Key)\
  app.get("/api/vehicles", async (req, res) => {\
    try {\
      const { search, limit = 10, offset = 0 } = req.query;\
      \
      let query = db.select({\
        id: assets.id,\
        plateNumber: assets.plateNumber,\
        modelYear: assets.modelYear,\
        chassisNo: assets.chassisNo,\
        isActive: assets.isActive,\
        createdAt: assets.createdAt\
      }).from(assets);\
\
      // Search filtering\
      if (search) {\
        query = query.where(ilike(assets.plateNumber, `%${search}%`));\
      }\
\
      // Pagination\
      query = query.limit(Number(limit)).offset(Number(offset));\
\
      const vehicles = await query;\
      \
      res.json({\
        success: true,\
        message: "Vehicles başarıyla getirildi",\
        data: {\
          vehicles,\
          totalCount: vehicles.length,\
          pagination: {\
            limit: Number(limit),\
            offset: Number(offset)\
          }\
        }\
      });\
    } catch (error) {\
      console.error("Vehicles getirme hatası:", error);\
      res.status(500).json({ \
        success: false,\
        error: "VEHICLES_FETCH_ERROR",\
        message: "Vehicles listesi alınırken bir hata oluştu" \
      });\
    }\
  });\
' server/routes.ts

echo "✅ Vehicles endpoint added"
EOF

# 5. Dependencies'i kur ve build yap
echo "📦 Installing dependencies and building..."
ssh $PRODUCTION_SERVER << 'EOF'
cd /var/www/filokiapi/FiloAPIapp

# Development dependencies dahil tüm packages'i kur
npm install --include=dev

# pg package'ın kurulu olduğunu kontrol et
npm list pg || npm install pg @types/pg

# Build yap
npm run build

echo "✅ Build completed"
EOF

# 6. PM2'yi restart et
echo "🔄 Restarting PM2..."
ssh $PRODUCTION_SERVER << 'EOF'
cd /var/www/filokiapi/FiloAPIapp

# PM2 restart
pm2 restart filokiapi

# Status kontrol et
sleep 3
pm2 status

echo "✅ PM2 restarted"
EOF

# 7. API test et
echo "🧪 Testing APIs..."
sleep 5

# getCities test
echo "Testing getCities endpoint..."
CITIES_RESULT=$(curl -s https://filokiapi.architectaiagency.com/api/getCities -H "X-API-Key: filoki-api-master-key-2025")
echo "Cities: $CITIES_RESULT" | head -200

# Vehicles test
echo "Testing vehicles endpoint..."
VEHICLES_RESULT=$(curl -s https://filokiapi.architectaiagency.com/api/vehicles -H "X-API-Key: filoki-api-master-key-2025")
echo "Vehicles: $VEHICLES_RESULT" | head -200

# Login test
echo "Testing login endpoint..."
LOGIN_RESULT=$(curl -s -X POST https://filokiapi.architectaiagency.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alper.acar@architectaiagency.com","password":"Acar"}')
echo "Login: $LOGIN_RESULT" | head -200

# 8. Automated deployment script oluştur
echo "📝 Creating automated deployment script..."
ssh $PRODUCTION_SERVER << 'EOF'
cd /var/www/filokiapi

cat > deploy.sh << 'DEPLOYEOF'
#!/bin/bash

echo "🚀 FiloAPI Deployment Starting..."

cd /var/www/filokiapi/FiloAPIapp

# Backup current version
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r . ../backups/backup_$TIMESTAMP
echo "✅ Backup created: backup_$TIMESTAMP"

# Git update
git fetch origin main
git reset --hard origin/main
echo "✅ Code updated from Git"

# Install dependencies
npm install --include=dev
echo "✅ Dependencies updated"

# Build
npm run build
echo "✅ Build completed"

# Restart PM2
pm2 restart filokiapi
echo "✅ Application restarted"

# Test basic endpoints
sleep 3
echo "🧪 Testing endpoints..."

HEALTH_TEST=$(curl -s https://filokiapi.architectaiagency.com/api/health)
if [[ $HEALTH_TEST == *"healthy"* ]]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
fi

CITIES_TEST=$(curl -s https://filokiapi.architectaiagency.com/api/getCities -H "X-API-Key: filoki-api-master-key-2025")
if [[ $CITIES_TEST == *"success"* ]]; then
  echo "✅ Cities endpoint working"
else
  echo "❌ Cities endpoint failed"
fi

echo "🎯 Deployment completed!"
DEPLOYEOF

chmod +x deploy.sh
echo "✅ Automated deployment script created at /var/www/filokiapi/deploy.sh"
EOF

echo ""
echo "🎉 Production Deployment System Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Summary:"
echo "  ✅ Backup system established"
echo "  ✅ Git repository cleaned and updated"
echo "  ✅ Database driver fixed (PostgreSQL)"
echo "  ✅ Vehicles endpoint added"
echo "  ✅ Dependencies updated"
echo "  ✅ Application built and restarted"
echo "  ✅ Automated deployment script created"
echo ""
echo "🔧 Future deployments:"
echo "  ssh $PRODUCTION_SERVER"
echo "  cd /var/www/filokiapi && ./deploy.sh"
echo ""
echo "🧪 Test the APIs now!"