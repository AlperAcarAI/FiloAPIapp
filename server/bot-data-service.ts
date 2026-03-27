import { db } from './db';
import {
  assets, carBrands, carModels, carTypes,
  assetsPersonelAssignment, personnel,
  assetsPolicies, policyTypes,
  assetsMaintenance, maintenanceTypes,
  fuelRecords,
  finCurrentAccounts, companies,
  workAreas,
} from '@shared/schema';
import { eq, and, desc, gte, lte, ilike, or, sql, count, isNull, gt } from 'drizzle-orm';
import type { UserContext } from './hierarchical-auth';
import { formatCurrency, formatDate, daysBetween } from './bot-message-formatter';

/** Work area filtresini sorguya uygular */
function applyWorkAreaFilter(userCtx: UserContext): boolean {
  // null = tüm erişim (CORPORATE veya global access)
  return userCtx.allowedWorkAreaIds !== null;
}

/** İzin kontrolü yapar */
function hasPermission(userCtx: UserContext, permission: string): boolean {
  if (userCtx.permissions.includes('*')) return true;
  return userCtx.permissions.includes(permission);
}

/**
 * Araç listesi — plaka, marka, model, yıl
 */
export async function listVehicles(
  userCtx: UserContext,
  search?: string,
  limit = 10
): Promise<string> {
  if (!hasPermission(userCtx, 'fleet:read')) {
    return 'Bu veriye erişim yetkiniz yok (fleet:read gerekli).';
  }

  let query = db
    .select({
      id: assets.id,
      plateNumber: assets.plateNumber,
      modelYear: assets.modelYear,
      brandName: carBrands.name,
      modelName: carModels.name,
      typeName: carTypes.name,
      isActive: assets.isActive,
    })
    .from(assets)
    .leftJoin(carModels, eq(assets.modelId, carModels.id))
    .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
    .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
    .where(eq(assets.isActive, true))
    .orderBy(assets.plateNumber)
    .limit(limit);

  const results = await query;

  if (!results.length) return 'Kayıtlı araç bulunamadı.';

  const lines = results.map((v, i) =>
    `${i + 1}. ${v.plateNumber} — ${v.brandName || '?'} ${v.modelName || '?'} (${v.modelYear}) [${v.typeName || ''}]`
  );

  return `Araç Listesi (${results.length} adet):\n\n${lines.join('\n')}`;
}

/**
 * Tekil araç detayı — plaka ile arama
 */
export async function getVehicleDetail(
  userCtx: UserContext,
  plate: string
): Promise<string> {
  if (!hasPermission(userCtx, 'fleet:read')) {
    return 'Bu veriye erişim yetkiniz yok (fleet:read gerekli).';
  }

  // Plakayı normalize et (boşluk kaldır, büyük harf)
  const normalizedPlate = plate.replace(/\s+/g, '').toUpperCase();

  const vehicleResults = await db
    .select({
      id: assets.id,
      plateNumber: assets.plateNumber,
      modelYear: assets.modelYear,
      chassisNo: assets.chassisNo,
      brandName: carBrands.name,
      modelName: carModels.name,
      typeName: carTypes.name,
    })
    .from(assets)
    .leftJoin(carModels, eq(assets.modelId, carModels.id))
    .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
    .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
    .where(
      and(
        eq(sql`REPLACE(${assets.plateNumber}, ' ', '')`, normalizedPlate),
        eq(assets.isActive, true)
      )
    )
    .limit(1);

  if (!vehicleResults.length) {
    return `"${plate}" plakalı araç bulunamadı.`;
  }

  const v = vehicleResults[0];

  // Sürücü ataması
  const driverResults = await db
    .select({
      driverName: personnel.name,
      driverSurname: personnel.surname,
      startDate: assetsPersonelAssignment.startDate,
    })
    .from(assetsPersonelAssignment)
    .leftJoin(personnel, eq(assetsPersonelAssignment.personnelId, personnel.id))
    .where(
      and(
        eq(assetsPersonelAssignment.assetId, v.id),
        eq(assetsPersonelAssignment.isActive, true)
      )
    )
    .limit(1);

  // Son bakım
  const lastMaintenance = await db
    .select({
      date: assetsMaintenance.maintenanceDate,
      typeName: maintenanceTypes.name,
      amountCents: assetsMaintenance.amountCents,
      km: assetsMaintenance.kmReading,
    })
    .from(assetsMaintenance)
    .leftJoin(maintenanceTypes, eq(assetsMaintenance.maintenanceTypeId, maintenanceTypes.id))
    .where(
      and(
        eq(assetsMaintenance.assetId, v.id),
        eq(assetsMaintenance.isActive, true)
      )
    )
    .orderBy(desc(assetsMaintenance.maintenanceDate))
    .limit(1);

  const driver = driverResults[0];
  const maint = lastMaintenance[0];

  let text = `Araç Detayı: ${v.plateNumber}\n\n`;
  text += `Marka/Model: ${v.brandName || '?'} ${v.modelName || '?'}\n`;
  text += `Tip: ${v.typeName || '-'}\n`;
  text += `Model Yılı: ${v.modelYear}\n`;
  text += `Şasi No: ${v.chassisNo || '-'}\n`;
  text += `\nSürücü: ${driver ? `${driver.driverName} ${driver.driverSurname} (${formatDate(driver.startDate)}'den beri)` : 'Atanmamış'}\n`;
  text += `\nSon Bakım: ${maint ? `${maint.typeName || 'Bakım'} — ${formatDate(maint.date)} — ${formatCurrency(maint.amountCents)} — ${maint.km ? maint.km + ' km' : ''}` : 'Bakım kaydı yok'}`;

  return text;
}

/**
 * Süresi dolacak poliçeler
 */
export async function listExpiringPolicies(
  userCtx: UserContext,
  daysAhead = 30
): Promise<string> {
  if (!hasPermission(userCtx, 'data:read')) {
    return 'Bu veriye erişim yetkiniz yok (data:read gerekli).';
  }

  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const results = await db
    .select({
      plateNumber: assets.plateNumber,
      policyType: policyTypes.name,
      policyNumber: assetsPolicies.policyNumber,
      endDate: assetsPolicies.endDate,
      amountCents: assetsPolicies.amountCents,
    })
    .from(assetsPolicies)
    .leftJoin(assets, eq(assetsPolicies.assetId, assets.id))
    .leftJoin(policyTypes, eq(assetsPolicies.policyTypeId, policyTypes.id))
    .where(
      and(
        eq(assetsPolicies.isActive, true),
        gte(assetsPolicies.endDate, today),
        lte(assetsPolicies.endDate, futureDate)
      )
    )
    .orderBy(assetsPolicies.endDate)
    .limit(20);

  if (!results.length) {
    return `Önümüzdeki ${daysAhead} gün içinde süresi dolacak poliçe bulunmuyor.`;
  }

  const lines = results.map((p, i) => {
    const days = p.endDate ? daysBetween(p.endDate) : 0;
    const urgency = days <= 7 ? '🔴' : days <= 15 ? '🟡' : '🟢';
    return `${urgency} ${p.plateNumber || '?'} — ${p.policyType || '?'} — ${formatDate(p.endDate)} (${days} gün) — ${formatCurrency(p.amountCents)}`;
  });

  return `Süresi Dolacak Poliçeler (${daysAhead} gün içinde, ${results.length} adet):\n\n${lines.join('\n')}`;
}

/**
 * Personel arama
 */
export async function searchPersonnel(
  userCtx: UserContext,
  search?: string,
  limit = 10
): Promise<string> {
  if (!hasPermission(userCtx, 'personnel:read')) {
    return 'Bu veriye erişim yetkiniz yok (personnel:read gerekli).';
  }

  const conditions = [eq(personnel.isActive, true)];

  if (search) {
    conditions.push(
      or(
        ilike(personnel.name, `%${search}%`),
        ilike(personnel.surname, `%${search}%`)
      )!
    );
  }

  const results = await db
    .select({
      id: personnel.id,
      name: personnel.name,
      surname: personnel.surname,
      phoneNo: personnel.phoneNo,
      status: personnel.status,
    })
    .from(personnel)
    .where(and(...conditions))
    .orderBy(personnel.name)
    .limit(limit);

  if (!results.length) {
    return search ? `"${search}" ile eşleşen personel bulunamadı.` : 'Kayıtlı personel bulunamadı.';
  }

  const lines = results.map((p, i) =>
    `${i + 1}. ${p.name} ${p.surname} — Tel: ${p.phoneNo || '-'} — Durum: ${p.status || 'Aktif'}`
  );

  return `Personel Listesi${search ? ` ("${search}")` : ''} (${results.length} adet):\n\n${lines.join('\n')}`;
}

/**
 * Yakıt kayıtları
 */
export async function getFuelRecords(
  userCtx: UserContext,
  plate?: string,
  limit = 10
): Promise<string> {
  if (!hasPermission(userCtx, 'fuel:read') && !hasPermission(userCtx, 'data:read')) {
    return 'Bu veriye erişim yetkiniz yok (fuel:read gerekli).';
  }

  const conditions = [eq(fuelRecords.isActive, true)];

  if (plate) {
    const normalizedPlate = plate.replace(/\s+/g, '').toUpperCase();
    // Alt sorgu ile assetId bul
    const assetResult = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(sql`REPLACE(${assets.plateNumber}, ' ', '')`, normalizedPlate))
      .limit(1);

    if (!assetResult.length) {
      return `"${plate}" plakalı araç bulunamadı.`;
    }
    conditions.push(eq(fuelRecords.assetId, assetResult[0].id));
  }

  const results = await db
    .select({
      plateNumber: assets.plateNumber,
      recordDate: fuelRecords.recordDate,
      fuelAmount: fuelRecords.fuelAmount,
      fuelCostCents: fuelRecords.fuelCostCents,
      currentKilometers: fuelRecords.currentKilometers,
      gasStationName: fuelRecords.gasStationName,
    })
    .from(fuelRecords)
    .leftJoin(assets, eq(fuelRecords.assetId, assets.id))
    .where(and(...conditions))
    .orderBy(desc(fuelRecords.recordDate))
    .limit(limit);

  if (!results.length) {
    return plate ? `"${plate}" için yakıt kaydı bulunamadı.` : 'Yakıt kaydı bulunamadı.';
  }

  const lines = results.map((f, i) =>
    `${i + 1}. ${f.plateNumber || '?'} — ${formatDate(f.recordDate)} — ${f.fuelAmount}L — ${formatCurrency(f.fuelCostCents)} — ${f.currentKilometers} km — ${f.gasStationName || ''}`
  );

  return `Yakıt Kayıtları${plate ? ` (${plate})` : ''} (${results.length} adet):\n\n${lines.join('\n')}`;
}

/**
 * Bakım kayıtları
 */
export async function getMaintenanceRecords(
  userCtx: UserContext,
  plate?: string,
  limit = 10
): Promise<string> {
  if (!hasPermission(userCtx, 'fleet:read')) {
    return 'Bu veriye erişim yetkiniz yok (fleet:read gerekli).';
  }

  const conditions = [eq(assetsMaintenance.isActive, true)];

  if (plate) {
    const normalizedPlate = plate.replace(/\s+/g, '').toUpperCase();
    const assetResult = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(sql`REPLACE(${assets.plateNumber}, ' ', '')`, normalizedPlate))
      .limit(1);

    if (!assetResult.length) {
      return `"${plate}" plakalı araç bulunamadı.`;
    }
    conditions.push(eq(assetsMaintenance.assetId, assetResult[0].id));
  }

  const results = await db
    .select({
      plateNumber: assets.plateNumber,
      maintenanceDate: assetsMaintenance.maintenanceDate,
      typeName: maintenanceTypes.name,
      amountCents: assetsMaintenance.amountCents,
      kmReading: assetsMaintenance.kmReading,
      description: assetsMaintenance.description,
      serviceProvider: assetsMaintenance.serviceProvider,
    })
    .from(assetsMaintenance)
    .leftJoin(assets, eq(assetsMaintenance.assetId, assets.id))
    .leftJoin(maintenanceTypes, eq(assetsMaintenance.maintenanceTypeId, maintenanceTypes.id))
    .where(and(...conditions))
    .orderBy(desc(assetsMaintenance.maintenanceDate))
    .limit(limit);

  if (!results.length) {
    return plate ? `"${plate}" için bakım kaydı bulunamadı.` : 'Bakım kaydı bulunamadı.';
  }

  const lines = results.map((m, i) =>
    `${i + 1}. ${m.plateNumber || '?'} — ${formatDate(m.maintenanceDate)} — ${m.typeName || '?'} — ${formatCurrency(m.amountCents)} — ${m.kmReading ? m.kmReading + ' km' : ''} — ${m.serviceProvider || ''}`
  );

  return `Bakım Kayıtları${plate ? ` (${plate})` : ''} (${results.length} adet):\n\n${lines.join('\n')}`;
}

/**
 * Dashboard özeti — sayısal veriler
 */
export async function getDashboardSummary(
  userCtx: UserContext
): Promise<string> {
  if (!hasPermission(userCtx, 'data:read')) {
    return 'Bu veriye erişim yetkiniz yok (data:read gerekli).';
  }

  const [vehicleCount] = await db
    .select({ count: count() })
    .from(assets)
    .where(eq(assets.isActive, true));

  const [personnelCount] = await db
    .select({ count: count() })
    .from(personnel)
    .where(eq(personnel.isActive, true));

  // Süresi 30 gün içinde dolacak poliçeler
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [expiringPolicies] = await db
    .select({ count: count() })
    .from(assetsPolicies)
    .where(
      and(
        eq(assetsPolicies.isActive, true),
        gte(assetsPolicies.endDate, today),
        lte(assetsPolicies.endDate, thirtyDaysLater)
      )
    );

  // Aktif şantiye sayısı
  const [workAreaCount] = await db
    .select({ count: count() })
    .from(workAreas)
    .where(eq(workAreas.isActive, true));

  let text = `Dashboard Özeti\n\n`;
  text += `Araç: ${vehicleCount.count} adet\n`;
  text += `Personel: ${personnelCount.count} adet\n`;
  text += `Aktif Şantiye: ${workAreaCount.count} adet\n`;
  text += `30 gün içinde dolacak poliçe: ${expiringPolicies.count} adet`;

  return text;
}

/**
 * Cari hesap özeti
 */
export async function getCurrentAccounts(
  userCtx: UserContext,
  companyName?: string
): Promise<string> {
  if (!hasPermission(userCtx, 'data:read') && !hasPermission(userCtx, 'finance:read')) {
    return 'Bu veriye erişim yetkiniz yok (finance:read gerekli).';
  }

  const conditions = [eq(finCurrentAccounts.isActive, true)];

  const results = await db
    .select({
      description: finCurrentAccounts.description,
      payerCompany: sql<string>`payer.name`,
      payeeCompany: sql<string>`payee.name`,
      amountCents: finCurrentAccounts.amountCents,
      transactionDate: finCurrentAccounts.transactionDate,
      paymentStatus: finCurrentAccounts.paymentStatus,
      isDebit: finCurrentAccounts.isDebit,
    })
    .from(finCurrentAccounts)
    .leftJoin(sql`${companies} AS payer`, eq(finCurrentAccounts.payerCompanyId, sql`payer.id`))
    .leftJoin(sql`${companies} AS payee`, eq(finCurrentAccounts.payeeCompanyId, sql`payee.id`))
    .where(and(...conditions))
    .orderBy(desc(finCurrentAccounts.transactionDate))
    .limit(10);

  if (!results.length) {
    return 'Cari hesap kaydı bulunamadı.';
  }

  const lines = results.map((c, i) => {
    const type = c.isDebit ? 'Borç' : 'Alacak';
    return `${i + 1}. ${type} — ${c.payerCompany || '?'} → ${c.payeeCompany || '?'} — ${formatCurrency(c.amountCents)} — ${formatDate(c.transactionDate)} — ${c.paymentStatus || 'Beklemede'}`;
  });

  return `Cari Hesap Özeti (son 10 işlem):\n\n${lines.join('\n')}`;
}
