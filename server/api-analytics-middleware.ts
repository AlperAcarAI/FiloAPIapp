import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { apiUsageLogs, apiUsageStats, apiClients, apiKeys } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface RequestWithApiTracking extends Request {
  apiStartTime?: number;
  apiClientId?: number;
  requestSize?: number;
}

// API çağrılarını takip eden middleware
export const apiAnalyticsMiddleware = (req: RequestWithApiTracking, res: Response, next: NextFunction) => {
  // Sadece /api/secure/ endpoint'lerini takip et
  if (!req.path.startsWith('/api/secure/')) {
    return next();
  }

  // Request başlangıç zamanını kaydet
  req.apiStartTime = Date.now();
  
  // Request boyutunu hesapla
  req.requestSize = JSON.stringify(req.body || {}).length;

  // API Client ID'yi header'dan al
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    // API Client ID'yi bulup req'e ekle (bu daha sonra doldurulacak)
    findApiClientId(apiKey).then(clientId => {
      req.apiClientId = clientId;
    });
  }

  // Response bittiğinde log kaydı oluştur
  const originalSend = res.send;
  res.send = function(body: any) {
    const endTime = Date.now();
    const responseTime = req.apiStartTime ? endTime - req.apiStartTime : 0;
    const responseSize = typeof body === 'string' ? body.length : JSON.stringify(body || {}).length;

    // Asenkron olarak log kaydet
    logApiUsage({
      apiClientId: req.apiClientId,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      requestSize: req.requestSize || 0,
      responseSize,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      errorMessage: res.statusCode >= 400 ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
    }).catch(err => {
      console.error('API usage log error:', err);
    });

    return originalSend.call(this, body);
  };

  next();
};

// API Client ID'yi bul
async function findApiClientId(apiKey: string): Promise<number | undefined> {
  try {
    // API Key hash'ini hesapla
    const bcrypt = (await import('bcryptjs')).default;
    
    // Tüm aktif API key'leri al
    const activeApiKeys = await db.select({
      id: apiKeys.id,
      clientId: apiKeys.clientId,
      keyHash: apiKeys.keyHash
    })
    .from(apiKeys)
    .innerJoin(apiClients, eq(apiKeys.clientId, apiClients.id))
    .where(and(
      eq(apiKeys.isActive, true),
      eq(apiClients.isActive, true)
    ));

    // API anahtarını doğrula
    for (const keyRecord of activeApiKeys) {
      const isMatch = await bcrypt.compare(apiKey, keyRecord.keyHash);
      if (isMatch) {
        return keyRecord.clientId;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('API client lookup error:', error);
    return undefined;
  }
}

// API kullanım verilerini kaydet
async function logApiUsage(logData: {
  apiClientId?: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string | null;
}) {
  try {
    // Detaylı log kaydet
    await db.insert(apiUsageLogs).values({
      apiClientId: logData.apiClientId,
      endpoint: logData.endpoint,
      method: logData.method,
      statusCode: logData.statusCode,
      responseTimeMs: logData.responseTime,
      requestSizeBytes: logData.requestSize,
      responseSizeBytes: logData.responseSize,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      errorMessage: logData.errorMessage,
      requestTimestamp: new Date()
    });

    // Günlük istatistikleri güncelle (sadece client ID varsa)
    if (logData.apiClientId) {
      await updateDailyStats({
        apiClientId: logData.apiClientId,
        endpoint: logData.endpoint,
        method: logData.method,
        statusCode: logData.statusCode,
        responseTime: logData.responseTime,
        requestSize: logData.requestSize,
        responseSize: logData.responseSize
      });
    }
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

// Günlük istatistikleri güncelle
async function updateDailyStats(logData: {
  apiClientId: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isSuccess = logData.statusCode < 400;

  try {
    // Var olan kaydı bul veya oluştur
    const existing = await db.query.apiUsageStats.findFirst({
      where: and(
        eq(apiUsageStats.apiClientId, logData.apiClientId),
        eq(apiUsageStats.endpoint, logData.endpoint),
        eq(apiUsageStats.method, logData.method),
        eq(apiUsageStats.usageDate, today)
      )
    });

    if (existing) {
      // Var olan kaydı güncelle
      const newTotalRequests = (existing.totalRequests || 0) + 1;
      const newSuccessRequests = (existing.successRequests || 0) + (isSuccess ? 1 : 0);
      const newErrorRequests = (existing.errorRequests || 0) + (isSuccess ? 0 : 1);
      const existingAvg = Number(existing.avgResponseTimeMs) || 0;
      const existingTotal = existing.totalRequests || 0;
      const newAvgResponseTime = ((existingAvg * existingTotal) + logData.responseTime) / newTotalRequests;
      const newTotalDataTransferred = (existing.totalDataTransferredBytes || 0) + logData.requestSize + logData.responseSize;

      await db.update(apiUsageStats)
        .set({
          totalRequests: newTotalRequests,
          successRequests: newSuccessRequests,
          errorRequests: newErrorRequests,
          avgResponseTimeMs: Number(newAvgResponseTime.toFixed(2)),
          minResponseTimeMs: Math.min(existing.minResponseTimeMs || 999999, logData.responseTime),
          maxResponseTimeMs: Math.max(existing.maxResponseTimeMs || 0, logData.responseTime),
          totalDataTransferredBytes: newTotalDataTransferred
        })
        .where(eq(apiUsageStats.id, existing.id));
    } else {
      // Yeni kayıt oluştur
      await db.insert(apiUsageStats).values({
        apiClientId: logData.apiClientId,
        endpoint: logData.endpoint,
        method: logData.method,
        usageDate: today,
        totalRequests: 1,
        successRequests: isSuccess ? 1 : 0,
        errorRequests: isSuccess ? 0 : 1,
        avgResponseTimeMs: logData.responseTime,
        minResponseTimeMs: logData.responseTime,
        maxResponseTimeMs: logData.responseTime,
        totalDataTransferredBytes: logData.requestSize + logData.responseSize
      });
    }
  } catch (error) {
    console.error('Failed to update daily stats:', error);
  }
}