#!/bin/bash
# =============================================================================
# FilokiAPI Komple Kurulum Script'i
# =============================================================================
# Bu script tüm sistem bağımlılıklarını, konfigürasyonları ve kurulumu yapar
# Her adımda kontrol eder ve hata durumunda müdahale imkanı sunar
# =============================================================================

set -e  # Hata durumunda script'i durdur

# Renk tanımlamaları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Başlık fonksiyonu
print_header() {
    echo ""
    echo -e "${PURPLE}=================================================================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}=================================================================================${NC}"
    echo ""
}

# Bilgi mesajı
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Başarı mesajı
print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Uyarı mesajı
print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Hata mesajı
print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Devam etmek için onay al
ask_continue() {
    echo ""
    echo -e "${YELLOW}Devam etmek istiyor musunuz? (e/E/h/H)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[eE]$ ]]; then
        print_warning "Kurulum iptal edildi"
        exit 0
    fi
}

# Hata yakalama
handle_error() {
    print_error "Hata oluştu: $1"
    echo ""
    echo -e "${YELLOW}Ne yapmak istersiniz?${NC}"
    echo "1) Tekrar dene"
    echo "2) Bu adımı atla"
    echo "3) Kurulumu iptal et"
    echo "4) Manuel düzeltme yap ve devam et"
    read -r choice
    
    case $choice in
        1) return 1 ;;  # Tekrar dene
        2) return 0 ;;  # Atla
        3) exit 1 ;;    # İptal
        4) 
            print_info "Manuel düzeltme yapın. Hazır olduğunuzda Enter'a basın..."
            read -r
            return 0 ;;
        *) handle_error "$1" ;;
    esac
}

# Komut çalıştır ve hata kontrolü yap
run_command() {
    local description="$1"
    local command="$2"
    
    print_info "$description"
    
    while true; do
        if eval "$command"; then
            print_success "$description - Başarılı"
            return 0
        else
            if handle_error "$description başarısız oldu"; then
                break
            fi
        fi
    done
}

# Root kontrolü
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Bu script root yetkisi gerektirir"
        print_info "Lütfen 'sudo ./complete-setup.sh' şeklinde çalıştırın"
        exit 1
    fi
}

# =============================================================================
# KURULUM BAŞLANGIÇ
# =============================================================================

clear
print_header "FilokiAPI Komple Kurulum Script'i"

print_info "Bu script şunları yapacak:"
echo "  • Sistem bağımlılıklarını kuracak (Node.js, PostgreSQL, Nginx, vb.)"
echo "  • Uygulama kodunu GitHub'dan çekecek"
echo "  • Veritabanını oluşturup yapılandıracak"
echo "  • SSL sertifikası kuracak"
echo "  • PM2 ile uygulamayı başlatacak"
echo ""
print_warning "Her adımda onayınız alınacak ve hata durumunda müdahale edebileceksiniz"

ask_continue

# Root kontrolü
check_root

# =============================================================================
# ADIM 1: KULLANICI BİLGİLERİNİ TOPLA
# =============================================================================

print_header "ADIM 1: Konfigürasyon Bilgileri"

# Kurulum kullanıcısı
print_info "Kurulum hangi kullanıcı altında yapılsın? (varsayılan: $SUDO_USER)"
read -r INSTALL_USER
INSTALL_USER=${INSTALL_USER:-$SUDO_USER}

# Domain
print_info "Domain adı (örn: filokiapi.architectaiagency.com):"
read -r DOMAIN_NAME
while [[ -z "$DOMAIN_NAME" ]]; do
    print_error "Domain adı boş olamaz!"
    read -r DOMAIN_NAME
done

# PostgreSQL bilgileri
print_info "PostgreSQL Host (varsayılan: localhost):"
read -r DB_HOST
DB_HOST=${DB_HOST:-localhost}

print_info "PostgreSQL Port (varsayılan: 5432):"
read -r DB_PORT
DB_PORT=${DB_PORT:-5432}

print_info "PostgreSQL Kullanıcı (varsayılan: postgres):"
read -r DB_USER
DB_USER=${DB_USER:-postgres}

print_info "PostgreSQL Şifre:"
read -rs DB_PASS
echo ""
while [[ -z "$DB_PASS" ]]; do
    print_error "Şifre boş olamaz!"
    read -rs DB_PASS
    echo ""
done

print_info "Veritabanı adı (varsayılan: filoki_db):"
read -r DB_NAME
DB_NAME=${DB_NAME:-filoki_db}

# Uygulama ayarları
print_info "Uygulama portu (varsayılan: 5000):"
read -r APP_PORT
APP_PORT=${APP_PORT:-5000}

print_info "PM2 uygulama adı (varsayılan: filoki-api):"
read -r PM2_APP_NAME
PM2_APP_NAME=${PM2_APP_NAME:-filoki-api}

# Admin kullanıcısı
print_info "Admin email adresi:"
read -r ADMIN_EMAIL
while [[ -z "$ADMIN_EMAIL" ]]; do
    print_error "Email adresi boş olamaz!"
    read -r ADMIN_EMAIL
done

print_info "Admin şifresi:"
read -rs ADMIN_PASS
echo ""
while [[ -z "$ADMIN_PASS" ]]; do
    print_error "Şifre boş olamaz!"
    read -rs ADMIN_PASS
    echo ""
done

print_info "Admin şifresi (tekrar):"
read -rs ADMIN_PASS_CONFIRM
echo ""
while [[ "$ADMIN_PASS" != "$ADMIN_PASS_CONFIRM" ]]; do
    print_error "Şifreler eşleşmiyor!"
    print_info "Admin şifresi:"
    read -rs ADMIN_PASS
    echo ""
    print_info "Admin şifresi (tekrar):"
    read -rs ADMIN_PASS_CONFIRM
    echo ""
done

# API Key
print_info "API Key (boş bırakırsanız otomatik oluşturulur):"
read -r API_KEY
if [[ -z "$API_KEY" ]]; then
    API_KEY="ak_prod$(date +%Y)_$(openssl rand -hex 5)"
    print_success "API Key otomatik oluşturuldu: $API_KEY"
fi

# SSL email
print_info "SSL sertifikası için email adresi:"
read -r SSL_EMAIL
while [[ -z "$SSL_EMAIL" ]]; do
    print_error "Email adresi boş olamaz!"
    read -r SSL_EMAIL
done

# JWT ve Session secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Özet göster
print_header "Konfigürasyon Özeti"
echo "Domain: $DOMAIN_NAME"
echo "PostgreSQL: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "Uygulama: Port $APP_PORT, PM2: $PM2_APP_NAME"
echo "Admin: $ADMIN_EMAIL"
echo "SSL Email: $SSL_EMAIL"
echo "Kurulum Kullanıcısı: $INSTALL_USER"

ask_continue

# =============================================================================
# ADIM 2: SİSTEM BAĞIMLILIKLARI
# =============================================================================

print_header "ADIM 2: Sistem Bağımlılıkları"

# Sistem güncelleme
run_command "Sistem paketlerini güncelleme" "apt-get update"

# Temel araçlar
run_command "Temel araçları kurma" "apt-get install -y curl wget git build-essential software-properties-common"

# Node.js kurulumu
if ! command -v node &> /dev/null; then
    run_command "Node.js repository ekleme" "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    run_command "Node.js kurulumu" "apt-get install -y nodejs"
else
    print_success "Node.js zaten kurulu: $(node --version)"
fi

# PostgreSQL kurulumu
if ! command -v psql &> /dev/null; then
    run_command "PostgreSQL kurulumu" "apt-get install -y postgresql postgresql-contrib"
    run_command "PostgreSQL servisini başlatma" "systemctl start postgresql"
    run_command "PostgreSQL servisini etkinleştirme" "systemctl enable postgresql"
else
    print_success "PostgreSQL zaten kurulu"
fi

# Nginx kurulumu
if ! command -v nginx &> /dev/null; then
    run_command "Nginx kurulumu" "apt-get install -y nginx"
    run_command "Nginx servisini başlatma" "systemctl start nginx"
    run_command "Nginx servisini etkinleştirme" "systemctl enable nginx"
else
    print_success "Nginx zaten kurulu"
fi

# Certbot kurulumu
if ! command -v certbot &> /dev/null; then
    run_command "Certbot kurulumu" "apt-get install -y certbot python3-certbot-nginx"
else
    print_success "Certbot zaten kurulu"
fi

# PM2 kurulumu
if ! command -v pm2 &> /dev/null; then
    run_command "PM2 global kurulumu" "npm install -g pm2"
else
    print_success "PM2 zaten kurulu"
fi

# Diğer araçlar
run_command "Ek araçları kurma" "apt-get install -y jq htop net-tools"

print_success "Tüm sistem bağımlılıkları kuruldu"
ask_continue

# =============================================================================
# ADIM 3: UYGULAMA KURULUMU
# =============================================================================

print_header "ADIM 3: Uygulama Kurulumu"

# Kurulum dizini
INSTALL_DIR="/home/$INSTALL_USER/FiloAPIapp"
print_info "Kurulum dizini: $INSTALL_DIR"

# Varolan dizini yedekle
if [ -d "$INSTALL_DIR" ]; then
    BACKUP_DIR="${INSTALL_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    run_command "Mevcut dizini yedekleme" "mv $INSTALL_DIR $BACKUP_DIR"
    print_success "Mevcut dizin yedeklendi: $BACKUP_DIR"
fi

# Dizin oluştur
run_command "Kurulum dizini oluşturma" "mkdir -p $INSTALL_DIR"
run_command "Dizin sahipliğini ayarlama" "chown -R $INSTALL_USER:$INSTALL_USER $INSTALL_DIR"

# GitHub'dan kodu çek
cd "$INSTALL_DIR"
run_command "GitHub'dan kod çekme" "sudo -u $INSTALL_USER git clone https://github.com/AlperAcarAI/FiloAPIapp.git ."

# Node.js bağımlılıkları
run_command "NPM bağımlılıklarını kurma" "sudo -u $INSTALL_USER npm install"

print_success "Uygulama kurulumu tamamlandı"
ask_continue

# =============================================================================
# ADIM 4: ŞIFRE HASH'LEME
# =============================================================================

print_header "ADIM 4: Şifre Hash'leme"

# Hash oluşturma script'i
cat > generate-hashes.mjs << 'EOF'
import bcrypt from 'bcryptjs';

const adminPass = process.argv[2];
const apiKey = process.argv[3];

async function generateHashes() {
    try {
        const adminHash = await bcrypt.hash(adminPass, 10);
        const apiKeyHash = await bcrypt.hash(apiKey, 10);
        
        console.log('ADMIN_PASS_HASH=' + adminHash);
        console.log('API_KEY_HASH=' + apiKeyHash);
    } catch (error) {
        console.error('Hash oluşturma hatası:', error);
        process.exit(1);
    }
}

generateHashes();
EOF

# Hash'leri oluştur
print_info "Şifre hash'leri oluşturuluyor..."
HASH_OUTPUT=$(sudo -u $INSTALL_USER node generate-hashes.mjs "$ADMIN_PASS" "$API_KEY")
ADMIN_PASS_HASH=$(echo "$HASH_OUTPUT" | grep ADMIN_PASS_HASH | cut -d'=' -f2)
API_KEY_HASH=$(echo "$HASH_OUTPUT" | grep API_KEY_HASH | cut -d'=' -f2)
rm generate-hashes.mjs

if [[ -z "$ADMIN_PASS_HASH" ]] || [[ -z "$API_KEY_HASH" ]]; then
    print_error "Hash oluşturma başarısız!"
    print_info "Manuel hash oluşturmak için:"
    echo "node -e \"const bcrypt = require('bcryptjs'); bcrypt.hash('$ADMIN_PASS', 10).then(console.log)\""
    echo "node -e \"const bcrypt = require('bcryptjs'); bcrypt.hash('$API_KEY', 10).then(console.log)\""
    
    print_info "Admin şifre hash'ini girin:"
    read -r ADMIN_PASS_HASH
    
    print_info "API key hash'ini girin:"
    read -r API_KEY_HASH
fi

print_success "Şifre hash'leri oluşturuldu"

# =============================================================================
# ADIM 5: ENVIRONMENT DOSYASI
# =============================================================================

print_header "ADIM 5: Environment Dosyası"

# .env dosyası oluştur
print_info ".env dosyası oluşturuluyor..."

cat > .env << EOF
# Production Environment Configuration
# Generated: $(date)
NODE_ENV=production

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME

# Application
PORT=$APP_PORT
DOMAIN=$DOMAIN_NAME

# API Configuration
CORS_ORIGIN=https://$DOMAIN_NAME

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Session Secret
SESSION_SECRET=$SESSION_SECRET

# API Documentation
SWAGGER_ENABLED=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10

# Session Store
SESSION_STORE=memory

# Generated Credentials (DO NOT COMMIT)
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASS_HASH=$ADMIN_PASS_HASH
API_KEY=$API_KEY
API_KEY_HASH=$API_KEY_HASH
EOF

run_command "Dosya sahipliğini ayarlama" "chown $INSTALL_USER:$INSTALL_USER .env"
run_command "Dosya izinlerini ayarlama" "chmod 600 .env"

print_success ".env dosyası oluşturuldu"

# Upload dizinleri
run_command "Upload dizinlerini oluşturma" "sudo -u $INSTALL_USER mkdir -p uploads/{temp,assets,personnel,thumbnails}"

ask_continue

# =============================================================================
# ADIM 6: UYGULAMA DERLEME
# =============================================================================

print_header "ADIM 6: Uygulama Derleme"

# TypeScript derleme
if npm run build 2>/dev/null | grep -q "build"; then
    run_command "TypeScript derleme" "sudo -u $INSTALL_USER npm run build"
else
    print_warning "Build script bulunamadı, atlanıyor..."
fi

# =============================================================================
# ADIM 7: VERİTABANI KURULUMU
# =============================================================================

print_header "ADIM 7: Veritabanı Kurulumu"

# PostgreSQL kullanıcı şifresi ayarla (eğer localhost ise)
if [[ "$DB_HOST" == "localhost" ]]; then
    print_info "PostgreSQL kullanıcı şifresi ayarlanıyor..."
    sudo -u postgres psql -c "ALTER USER $DB_USER PASSWORD '$DB_PASS';" 2>/dev/null || true
fi

# Veritabanı oluştur
print_info "Veritabanı oluşturuluyor..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_info "Veritabanı zaten mevcut olabilir"

# Schema dosyası var mı kontrol et
if [ -f "production-full-database-setup.sql" ]; then
    print_info "Veritabanı şeması uygulanıyor..."
    
    # SQL dosyasını güncelle
    cp production-full-database-setup.sql temp_setup.sql
    sed -i "s/admin@example.com/$ADMIN_EMAIL/g" temp_setup.sql
    sed -i "s/\$2b\$10\$Em9d/.mW\/ruoBLXiul6Tq.mACIqmDMIY7p\/C9dA4\/xtAKW4FD5jGK/$ADMIN_PASS_HASH/g" temp_setup.sql
    sed -i "s/ak_prod2025_rwba6dj1sw/$API_KEY/g" temp_setup.sql
    sed -i "s/\$2b\$10\$EbPHkGCd\/.4KM.OVdd1Hp.51vqCBEu67A\/lpLzS6yFdFQA3Hep9AW/$API_KEY_HASH/g" temp_setup.sql
    
    # Schema uygula
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f temp_setup.sql || handle_error "Veritabanı şeması uygulama"
    
    rm temp_setup.sql
    print_success "Veritabanı şeması uygulandı"
else
    print_warning "production-full-database-setup.sql bulunamadı"
    print_info "Drizzle push kullanarak şema uygulanacak..."
    
    if npm run db:push 2>/dev/null | grep -q "db:push"; then
        run_command "Drizzle schema push" "sudo -u $INSTALL_USER npm run db:push"
    else
        print_warning "db:push script bulunamadı"
    fi
fi

ask_continue

# =============================================================================
# ADIM 8: PM2 YAPILANDIRMASI
# =============================================================================

print_header "ADIM 8: PM2 Yapılandırması"

# ecosystem.config.js oluştur
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './dist/server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

run_command "PM2 config sahipliğini ayarlama" "chown $INSTALL_USER:$INSTALL_USER ecosystem.config.js"
run_command "Log dizini oluşturma" "sudo -u $INSTALL_USER mkdir -p logs"

# PM2 başlat
print_info "PM2 ile uygulama başlatılıyor..."
sudo -u $INSTALL_USER pm2 start ecosystem.config.js || handle_error "PM2 başlatma"
sudo -u $INSTALL_USER pm2 save
sudo -u $INSTALL_USER pm2 startup systemd -u $INSTALL_USER --hp /home/$INSTALL_USER

print_success "PM2 yapılandırıldı ve uygulama başlatıldı"

# PM2 durumu göster
sudo -u $INSTALL_USER pm2 status

ask_continue

# =============================================================================
# ADIM 9: NGINX YAPILANDIRMASI
# =============================================================================

print_header "ADIM 9: Nginx Yapılandırması"

# Nginx config
cat > /etc/nginx/sites-available/$DOMAIN_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API endpoints
    location /api {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Static files
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Site etkinleştir
run_command "Nginx site etkinleştirme" "ln -sf /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/"
run_command "Default site kaldırma" "rm -f /etc/nginx/sites-enabled/default"
run_command "Nginx yapılandırması test" "nginx -t"
run_command "Nginx yeniden yükleme" "systemctl reload nginx"

print_success "Nginx yapılandırıldı"

# =============================================================================
# ADIM 10: SSL SERTİFİKASI
# =============================================================================

print_header "ADIM 10: SSL Sertifikası"

print_info "SSL sertifikası alınıyor..."
print_warning "Domain'in bu sunucuya yönlendirilmiş olması gerekiyor!"

# SSL kurulumu
certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $SSL_EMAIL || handle_error "SSL sertifikası kurulumu"

print_success "SSL sertifikası kuruldu"

# =============================================================================
# ADIM 11: GÜVENLİK AYARLARI
# =============================================================================

print_header "ADIM 11: Güvenlik Ayarları"

# Firewall ayarları
if command -v ufw &> /dev/null; then
    print_info "Firewall ayarları yapılıyor..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow $APP_PORT/tcp
    echo "y" | ufw enable || true
    print_success "Firewall ayarları yapıldı"
else
    print_warning "UFW bulunamadı, firewall ayarları atlanıyor"
fi

# =============================================================================
# ADIM 12: TEST VE DOĞRULAMA
# =============================================================================

print_header "ADIM 12: Test ve Doğrulama"

# Test script oluştur
cat > test-api.sh << 'EOF'
#!/bin/bash

DOMAIN="'$DOMAIN_NAME'"
API_KEY="'$API_KEY'"

echo "API Testi Başlıyor..."
echo "==================="

# Health check
echo -n "Health check: "
curl -s https://$DOMAIN/api/health | jq . || echo "BAŞARISIZ"

# Auth test
echo -n "Auth sistemi: "
curl -s -X POST https://$DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'$ADMIN_EMAIL'","password":"'$ADMIN_PASS'"}' | jq . || echo "BAŞARISIZ"

# API key test
echo -n "API key testi: "
curl -s https://$DOMAIN/api/users \
  -H "X-API-Key: $API_KEY" | jq . || echo "BAŞARISIZ"

echo ""
echo "Test tamamlandı!"
EOF

chmod +x test-api.sh
chown $INSTALL_USER:$INSTALL_USER test-api.sh

# Testleri çalıştır
print_info "API testleri çalıştırılıyor..."
./test-api.sh || print_warning "Bazı testler başarısız oldu"

# =============================================================================
# KURULUM TAMAMLANDI
# =============================================================================

print_header "KURULUM TAMAMLANDI!"

# Kimlik bilgilerini kaydet
cat > /home/$INSTALL_USER/credentials.txt << EOF
FilokiAPI Kurulum Bilgileri
==========================
Tarih: $(date)

DOMAIN
------
URL: https://$DOMAIN_NAME
API URL: https://$DOMAIN_NAME/api
Swagger: https://$DOMAIN_NAME/api-docs

ADMIN BİLGİLERİ
---------------
Email: $ADMIN_EMAIL
Şifre: $ADMIN_PASS

API ERİŞİM
----------
API Key: $API_KEY
Header: X-API-Key

VERİTABANI
----------
Host: $DB_HOST
Port: $DB_PORT
Database: $DB_NAME
User: $DB_USER
Password: $DB_PASS

SUNUCU
------
App Port: $APP_PORT
PM2 App: $PM2_APP_NAME

KOMUTLAR
--------
Logları görüntüle: pm2 logs $PM2_APP_NAME
Uygulamayı yeniden başlat: pm2 restart $PM2_APP_NAME
Durumu kontrol et: pm2 status
API testi: ./test-api.sh
EOF

chown $INSTALL_USER:$INSTALL_USER /home/$INSTALL_USER/credentials.txt
chmod 600 /home/$INSTALL_USER/credentials.txt

# Özet göster
print_success "Kurulum başarıyla tamamlandı!"
echo ""
echo -e "${GREEN}Erişim Bilgileri:${NC}"
echo "URL: https://$DOMAIN_NAME"
echo "API: https://$DOMAIN_NAME/api"
echo "Swagger: https://$DOMAIN_NAME/api-docs"
echo ""
echo -e "${GREEN}Admin Girişi:${NC}"
echo "Email: $ADMIN_EMAIL"
echo "Şifre: $ADMIN_PASS"
echo ""
echo -e "${GREEN}API Erişimi:${NC}"
echo "API Key: $API_KEY"
echo ""
echo -e "${YELLOW}Tüm bilgiler şuraya kaydedildi:${NC}"
echo "/home/$INSTALL_USER/credentials.txt"
echo ""
echo -e "${CYAN}Faydalı Komutlar:${NC}"
echo "pm2 logs $PM2_APP_NAME    # Logları görüntüle"
echo "pm2 restart $PM2_APP_NAME # Uygulamayı yeniden başlat"
echo "pm2 status               # Durum kontrolü"
echo "./test-api.sh           # API testi"

print_success "Kurulum tamamlandı. İyi kullanımlar!"