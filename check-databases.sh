#!/bin/bash

echo "========================================="
echo "MEVCUT POSTGRESQL VERİTABANLARI"
echo "========================================="
echo ""
echo "PostgreSQL şifresini girin ve mevcut veritabanlarını görelim:"
echo ""

# Tüm veritabanlarını listele
psql -h localhost -p 5432 -U postgres -c "\l" | grep -E "Name|---|fleet|proje|filoki|List of databases" || echo "Veritabanları listelenemedi"

echo ""
echo "========================================="
echo "HIZLI KURULUM KOMUTLARI:"
echo "========================================="
echo ""
echo "1. Eğer 'proje_db' yoksa oluşturun:"
echo "   psql -h localhost -p 5432 -U postgres -c 'CREATE DATABASE proje_db;'"
echo ""
echo "2. SQL dosyasını çalıştırın:"
echo "   psql -h localhost -p 5432 -U postgres -d proje_db -f production-database-setup.sql"
echo ""
echo "3. VEYA mevcut bir veritabanı varsa (örn: fleet_db):"
echo "   psql -h localhost -p 5432 -U postgres -d fleet_db -f production-database-setup.sql"
echo ""