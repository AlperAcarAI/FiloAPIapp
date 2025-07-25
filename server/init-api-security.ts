import { db } from "./db";
import { 
  roles, 
  permissions, 
  rolePermissions,
  apiClients,
  companies,
  users
} from "@shared/schema";
import { createApiClient } from "./api-security";
import { eq } from "drizzle-orm";

// Temel güvenlik verilerini initialize et
export async function initializeApiSecurity() {
  try {
    console.log("API güvenlik sistemi başlatılıyor...");

    // 1. Temel izinleri oluştur
    const basicPermissions = [
      { name: 'data:read', description: 'Veri okuma izni - GET endpoint\'lerine erişim' },
      { name: 'data:write', description: 'Veri yazma izni - POST/PUT endpoint\'lerine erişim' },
      { name: 'data:delete', description: 'Veri silme izni - DELETE endpoint\'lerine erişim' },
      { name: 'admin:read', description: 'Admin veri okuma - Hassas verilere erişim' },
      { name: 'admin:write', description: 'Admin veri yazma - Sistem yönetim izni' },
      { name: 'api:manage', description: 'API yönetim izni - API client ve key yönetimi' },
      { name: 'user:manage', description: 'Kullanıcı yönetim izni' },
      { name: 'asset:read', description: 'Varlık okuma izni' },
      { name: 'asset:write', description: 'Varlık yazma izni' },
      { name: 'asset:manage', description: 'Varlık yönetim izni' },
      { name: 'fleet:read', description: 'Filo veri okuma izni' },
      { name: 'fleet:write', description: 'Filo veri yazma izni' },
      { name: 'analytics:read', description: 'Analitik veri okuma izni' },
      { name: 'reports:generate', description: 'Rapor oluşturma izni' }
    ];

    // Mevcut izinleri kontrol et ve yoksa ekle
    for (const perm of basicPermissions) {
      const [existing] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.name, perm.name));

      if (!existing) {
        await db.insert(permissions).values(perm);
        console.log(`✓ İzin oluşturuldu: ${perm.name}`);
      }
    }

    // 2. Temel rolleri oluştur
    const basicRoles = [
      { name: 'admin', description: 'Sistem yöneticisi - Tüm izinler' },
      { name: 'api_user', description: 'API kullanıcısı - Temel okuma/yazma izinleri' },
      { name: 'readonly', description: 'Sadece okuma yetkisi' },
      { name: 'fleet_manager', description: 'Filo yöneticisi - Varlık yönetim izinleri' },
      { name: 'analyst', description: 'Analiz uzmanı - Rapor ve analitik izinleri' }
    ];

    const createdRoles = [];
    for (const role of basicRoles) {
      const [existing] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, role.name));

      if (!existing) {
        const [newRole] = await db.insert(roles).values(role).returning();
        createdRoles.push(newRole);
        console.log(`✓ Rol oluşturuldu: ${role.name}`);
      } else {
        createdRoles.push(existing);
      }
    }

    // 3. Rol-İzin eşleşmelerini oluştur
    const rolePermissionMappings = {
      'admin': [
        'data:read', 'data:write', 'data:delete', 
        'admin:read', 'admin:write', 'api:manage', 
        'user:manage', 'asset:read', 'asset:write', 
        'asset:manage', 'fleet:read', 'fleet:write', 
        'analytics:read', 'reports:generate'
      ],
      'api_user': [
        'data:read', 'data:write', 'asset:read', 
        'asset:write', 'fleet:read', 'fleet:write'
      ],
      'readonly': [
        'data:read', 'asset:read', 'fleet:read', 'analytics:read'
      ],
      'fleet_manager': [
        'data:read', 'data:write', 'asset:read', 
        'asset:write', 'asset:manage', 'fleet:read', 
        'fleet:write', 'analytics:read', 'reports:generate'
      ],
      'analyst': [
        'data:read', 'asset:read', 'fleet:read', 
        'analytics:read', 'reports:generate'
      ]
    };

    // İzinleri ve rolleri eşleştir
    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      const [roleRecord] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleName));

      if (roleRecord) {
        for (const permName of permissionNames) {
          const [permRecord] = await db
            .select()
            .from(permissions)
            .where(eq(permissions.name, permName));

          if (permRecord) {
            // Mevcut bağlantıyı kontrol et
            const [existingMapping] = await db
              .select()
              .from(rolePermissions)
              .where(eq(rolePermissions.roleId, roleRecord.id) && 
                     eq(rolePermissions.permissionId, permRecord.id));

            if (!existingMapping) {
              await db.insert(rolePermissions).values({
                roleId: roleRecord.id,
                permissionId: permRecord.id
              });
            }
          }
        }
        console.log(`✓ Rol izinleri atandı: ${roleName}`);
      }
    }

    console.log("✅ API güvenlik sistemi başarıyla initialize edildi!");
    return true;
  } catch (error) {
    console.error("❌ API güvenlik sistemi başlatma hatası:", error);
    return false;
  }
}

// Demo API client oluşturma (development için)
export async function createDemoApiClient() {
  try {
    // İlk şirket kaydını al
    const [firstCompany] = await db
      .select()
      .from(companies)
      .limit(1);

    if (!firstCompany) {
      console.log("⚠️  Demo API client oluşturmak için önce bir şirket kaydı gerekli");
      return null;
    }

    // Demo client'ın varlığını kontrol et
    const [existingClient] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.name, "Demo API Client"));

    if (existingClient) {
      console.log("ℹ️  Demo API client zaten mevcut");
      return null;
    }

    // Demo client oluştur
    const result = await createApiClient(
      "Demo API Client",
      firstCompany.id,
      ['data:read', 'data:write', 'asset:read', 'asset:write', 'fleet:read']
    );

    console.log("🎯 Demo API Client oluşturuldu:");
    console.log(`   Client ID: ${result.client.id}`);
    console.log(`   API Key: ${result.apiKey}`);
    console.log("   Bu bilgileri güvenli yerde saklayın!");

    return result;
  } catch (error) {
    console.error("❌ Demo API client oluşturma hatası:", error);
    return null;
  }
}