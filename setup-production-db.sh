#!/bin/bash

echo "========================================="
echo "PRODUCTION DATABASE KURULUM"
echo "========================================="
echo ""

# PostgreSQL bağlantı bilgileri
PGUSER="postgres"
PGHOST="localhost"
PGPORT="5432"

echo "1. Mevcut veritabanlarını kontrol ediyorum..."
echo ""
echo "Lütfen PostgreSQL şifresini girin:"
psql -h $PGHOST -p $PGPORT -U $PGUSER -l | grep -E "fleet|proje|filoki" || echo "İlgili veritabanı bulunamadı"

echo ""
echo "2. Veritabanı oluşturma seçenekleri:"
echo ""
echo "a) Yeni veritabanı oluştur (proje_db)"
echo "b) Mevcut bir veritabanını kullan"
echo ""
read -p "Seçiminiz (a/b): " choice

if [ "$choice" = "a" ]; then
    echo ""
    echo "proje_db veritabanını oluşturuyorum..."
    psql -h $PGHOST -p $PGPORT -U $PGUSER -c "CREATE DATABASE proje_db;"
    
    echo ""
    echo "SQL dosyasını çalıştırıyorum..."
    psql -h $PGHOST -p $PGPORT -U $PGUSER -d proje_db -f production-database-setup.sql
    
elif [ "$choice" = "b" ]; then
    echo ""
    read -p "Kullanmak istediğiniz veritabanı adı: " dbname
    
    echo ""
    echo "$dbname veritabanında SQL dosyasını çalıştırıyorum..."
    psql -h $PGHOST -p $PGPORT -U $PGUSER -d $dbname -f production-database-setup.sql
fi

echo ""
echo "========================================="
echo "KURULUM TAMAMLANDI"
echo "========================================="
echo ""
echo "Environment değişkenlerinizi güncellemeyi unutmayın:"
echo ""
echo "DATABASE_URL=postgresql://$PGUSER:[PASSWORD]@$PGHOST:$PGPORT/[DATABASE_NAME]"
echo "CORS_ORIGIN=https://filokiapi.architectaiagency.com"
echo ""
echo "PM2 veya servisinizi restart edin:"
echo "pm2 restart filoki-api"
echo ""