#!/usr/bin/env node

/**
 * Yeni tenant oluşturma script'i
 * Kullanım: node scripts/create-tenant.js <subdomain> <name> [databaseUrl]
 */

// CLI script is disabled due to module path issues
// Use Web Admin Panel instead: http://localhost:5000/admin/tenants
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTenant() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🏢 Yeni Tenant Oluşturma Aracı

Kullanım: node scripts/create-tenant.js <subdomain> <name> [databaseUrl]

Örnekler:
  node scripts/create-tenant.js abc "ABC Şirketi"
  node scripts/create-tenant.js xyz "XYZ Holding" postgres://custom-db-url

Parametreler:
  subdomain    - Şirketin subdomain'i (abc.yourdomain.com)
  name         - Şirketin görünen adı
  databaseUrl  - (Opsiyonel) Özel database URL, yoksa varsayılan kullanılır
    `);
    process.exit(1);
  }

  const [subdomain, name, customDbUrl] = args;
  const databaseUrl = customDbUrl || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable bulunamadı.');
    process.exit(1);
  }

  try {
    console.log(`🔧 Yeni tenant oluşturuluyor...`);
    console.log(`   Subdomain: ${subdomain}`);
    console.log(`   Name: ${name}`);
    console.log(`   Database: ${databaseUrl.split('@')[1] || 'local'}`);

    // Mevcut tenant kontrolü
    const existing = tenantManager.getTenantFromSubdomain(subdomain);
    if (existing) {
      console.error(`❌ Bu subdomain zaten kullanımda: ${subdomain}`);
      process.exit(1);
    }

    // Yeni tenant oluştur
    await tenantManager.createTenant({
      id: subdomain,
      name,
      subdomain,
      databaseUrl,
      isActive: true
    });

    // Database bağlantısını test et
    console.log(`🔍 Database bağlantısı test ediliyor...`);
    const isHealthy = await tenantManager.healthCheck(subdomain);
    
    if (isHealthy) {
      console.log(`✅ Tenant başarıyla oluşturuldu!`);
      console.log(`
📋 Tenant Bilgileri:
   ID: ${subdomain}
   Name: ${name}
   Subdomain: ${subdomain}
   Access URL: https://${subdomain}.yourdomain.com
   Status: Active
   Database: Healthy

📌 Test için:
   curl -H "Host: ${subdomain}.localhost:5000" http://localhost:5000/api/tenant/info
      `);
    } else {
      console.log(`⚠️  Tenant oluşturuldu ancak database bağlantısında sorun var.`);
    }

  } catch (error) {
    console.error(`❌ Tenant oluşturulamadı:`, error.message);
    process.exit(1);
  }
}

// Script'i çalıştır
createTenant();