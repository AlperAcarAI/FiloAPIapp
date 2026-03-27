import { db } from './db';
import { personnel, users, botSessions, companies } from '@shared/schema';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { loadUserContext, type UserContext } from './hierarchical-auth';
import { getTenantConfigs } from './tenant-context';

export interface BotSessionData {
  id: number;
  platform: string;
  platformUserId: string;
  userId: number;
  personnelId: number | null;
  companyId: number;
  tenantDomain: string;
  isActive: boolean;
}

/**
 * Telefon numarasını normalize eder.
 * Farklı formatları standart 10 haneli formata çevirir: 5XX XXX XX XX
 */
function normalizePhoneNumber(phone: string): string {
  // Boşluk, tire, parantez, + temizle
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // 90 ile başlıyorsa kaldır (ülke kodu)
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  // 0 ile başlıyorsa kaldır
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Telefon numarasının olası tüm formatlarını üretir.
 * DB'de hangi formatta kayıtlı olduğunu bilmediğimiz için hepsini deneriz.
 */
function generatePhoneVariants(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length !== 10) return [phone];

  return [
    normalized,                    // 5321234567
    `0${normalized}`,              // 05321234567
    `+90${normalized}`,            // +905321234567
    `90${normalized}`,             // 905321234567
    `0${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 8)} ${normalized.substring(8)}`, // 0532 123 45 67
  ];
}

/**
 * Telefon numarasıyla kullanıcı eşleştirmesi yapar.
 * personnel.phoneNo → users.personnelId ilişkisi üzerinden çalışır.
 */
export async function findUserByPhone(phone: string): Promise<{
  userId: number;
  personnelId: number;
  personnelName: string;
  personnelSurname: string;
  companyId: number;
} | null> {
  const variants = generatePhoneVariants(phone);

  // Tüm varyantlarla personnel tablosunda ara
  const results = await db
    .select({
      personnelId: personnel.id,
      name: personnel.name,
      surname: personnel.surname,
      phoneNo: personnel.phoneNo,
      companyId: personnel.companyId,
    })
    .from(personnel)
    .where(
      and(
        or(...variants.map(v => eq(personnel.phoneNo, v))),
        eq(personnel.isActive, true)
      )
    )
    .limit(1);

  if (!results.length) return null;

  const person = results[0];
  if (!person.companyId) return null;

  // Bu personnel'e bağlı aktif user'ı bul
  const userResults = await db
    .select({
      userId: users.id,
      isActive: users.isActive,
    })
    .from(users)
    .where(
      and(
        eq(users.personnelId, person.personnelId),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  if (!userResults.length) return null;

  return {
    userId: userResults[0].userId,
    personnelId: person.personnelId,
    personnelName: person.name,
    personnelSurname: person.surname,
    companyId: person.companyId,
  };
}

/**
 * companyId'den tenant domain'ini belirler.
 * Tenant config'lerindeki company eşleştirmesini kullanır.
 */
export function resolveTenantDomain(companyId: number): string {
  const configs = getTenantConfigs();

  // Wildcard varsa onu döndür (single-tenant mode)
  const wildcard = configs.find(c => c.domain === '*');
  if (wildcard) return wildcard.domain;

  // İlk tenant'ı varsayılan olarak kullan
  // TODO: Multi-tenant ortamda companyId -> domain eşleştirme yapılmalı
  if (configs.length > 0) return configs[0].domain;

  return '*';
}

/**
 * Yeni bot oturumu oluşturur veya mevcut oturumu günceller.
 */
export async function createOrUpdateSession(
  platform: string,
  platformUserId: string,
  userId: number,
  personnelId: number | null,
  companyId: number,
  tenantDomain: string
): Promise<BotSessionData> {
  // Mevcut oturum var mı kontrol et
  const existing = await db
    .select()
    .from(botSessions)
    .where(
      and(
        eq(botSessions.platform, platform),
        eq(botSessions.platformUserId, platformUserId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Oturumu güncelle
    await db
      .update(botSessions)
      .set({
        userId,
        personnelId,
        companyId,
        tenantDomain,
        isActive: true,
        lastActivityAt: new Date(),
      })
      .where(eq(botSessions.id, existing[0].id));

    return {
      ...existing[0],
      userId,
      personnelId,
      companyId,
      tenantDomain,
      isActive: true,
    };
  }

  // Yeni oturum oluştur
  const [session] = await db
    .insert(botSessions)
    .values({
      platform,
      platformUserId,
      userId,
      personnelId,
      companyId,
      tenantDomain,
      isActive: true,
    })
    .returning();

  return session;
}

/**
 * Platform ve platform user ID ile mevcut oturumu getirir.
 */
export async function getSession(
  platform: string,
  platformUserId: string
): Promise<BotSessionData | null> {
  const results = await db
    .select()
    .from(botSessions)
    .where(
      and(
        eq(botSessions.platform, platform),
        eq(botSessions.platformUserId, platformUserId),
        eq(botSessions.isActive, true)
      )
    )
    .limit(1);

  if (!results.length) return null;

  const session = results[0];

  // 24 saat inaktiflik kontrolü
  const inactiveThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (session.lastActivityAt < inactiveThreshold) {
    await deactivateSession(platform, platformUserId);
    return null;
  }

  // lastActivityAt güncelle
  await db
    .update(botSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(botSessions.id, session.id));

  return session;
}

/**
 * Oturumu pasif yapar.
 */
export async function deactivateSession(
  platform: string,
  platformUserId: string
): Promise<void> {
  await db
    .update(botSessions)
    .set({ isActive: false })
    .where(
      and(
        eq(botSessions.platform, platform),
        eq(botSessions.platformUserId, platformUserId)
      )
    );
}

/**
 * Bot kullanıcısı için UserContext yükler.
 * hierarchical-auth.ts'deki loadUserContext fonksiyonunu kullanır.
 */
export async function loadBotUserContext(userId: number): Promise<UserContext | null> {
  return loadUserContext(userId);
}
