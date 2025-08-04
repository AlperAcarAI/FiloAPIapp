#!/bin/bash
# PM2 için wrapper script

# .env dosyasını yükle
set -a
source /home/root/FiloAPIapp/.env
set +a

# Uygulamayı başlat
exec node /home/root/FiloAPIapp/dist/index.js