import { Router } from 'express';
import { db } from './db';
import { apiUsageLogs, apiUsageStats, apiClients } from '@shared/schema';
import { eq, and, desc, asc, gte, lte, count, sum, avg, min, max } from 'drizzle-orm';
import { authenticateToken } from './auth';

const router = Router();

// Middleware - API key kontrolü (optional for analytics viewing)
// router.use(authenticateApiKey(['data:read', 'admin:read']));

// 1. API kullanım genel istatistikleri
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    // Toplam istek sayısı (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [totalRequests] = await db
      .select({ count: count() })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.requestTimestamp, thirtyDaysAgo));

    // Başarı oranı (son 30 gün)
    const [successRequests] = await db
      .select({ count: count() })
      .from(apiUsageLogs)
      .where(and(
        gte(apiUsageLogs.requestTimestamp, thirtyDaysAgo),
        lte(apiUsageLogs.statusCode, 299)
      ));

    // Ortalama yanıt süresi (son 30 gün)
    const [avgResponseTime] = await db
      .select({ avg: avg(apiUsageLogs.responseTimeMs) })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.requestTimestamp, thirtyDaysAgo));

    // En çok kullanılan endpoint'ler (son 30 gün)
    const topEndpoints = await db
      .select({
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        count: count()
      })
      .from(apiUsageLogs)
      .where(gte(apiUsageLogs.requestTimestamp, thirtyDaysAgo))
      .groupBy(apiUsageLogs.endpoint, apiUsageLogs.method)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      success: true,
      message: "API kullanım istatistikleri getirildi",
      data: {
        totalRequests: totalRequests.count,
        successRequests: successRequests.count,
        successRate: totalRequests.count > 0 ? (successRequests.count / totalRequests.count * 100).toFixed(2) : '0',
        avgResponseTime: avgResponseTime.avg ? Number(avgResponseTime.avg).toFixed(2) : '0',
        topEndpoints
      }
    });
  } catch (error) {
    console.error('API stats error:', error);
    res.status(500).json({
      success: false,
      error: "API_STATS_ERROR",
      message: "İstatistik verileri alınırken hata oluştu"
    });
  }
});

// 2. Endpoint bazlı detaylı istatistikler
router.get('/stats/endpoints', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { startDate, endDate, endpoint } = req.query;
    
    let whereConditions = [];
    if (startDate) whereConditions.push(gte(apiUsageLogs.requestTimestamp, new Date(startDate as string)));
    if (endDate) whereConditions.push(lte(apiUsageLogs.requestTimestamp, new Date(endDate as string)));
    if (endpoint) whereConditions.push(eq(apiUsageLogs.endpoint, endpoint as string));

    const endpointStats = await db
      .select({
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        totalRequests: count(),
        avgResponseTime: avg(apiUsageLogs.responseTimeMs),
        minResponseTime: min(apiUsageLogs.responseTimeMs),
        maxResponseTime: max(apiUsageLogs.responseTimeMs),
        totalDataTransferred: sum(apiUsageLogs.requestSizeBytes + apiUsageLogs.responseSizeBytes),
        successCount: count(apiUsageLogs.statusCode).mapWith(val => val), // Bu aslında success olanları sayacak
        errorCount: count(apiUsageLogs.statusCode).mapWith(val => val) // Bu aslında error olanları sayacak
      })
      .from(apiUsageLogs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(apiUsageLogs.endpoint, apiUsageLogs.method)
      .orderBy(desc(count()));

    res.json({
      success: true,
      message: "Endpoint istatistikleri getirildi",
      data: endpointStats
    });
  } catch (error) {
    console.error('Endpoint stats error:', error);
    res.status(500).json({
      success: false,
      error: "ENDPOINT_STATS_ERROR",
      message: "Endpoint istatistikleri alınırken hata oluştu"
    });
  }
});

// 3. Günlük kullanım trendi
router.get('/stats/daily', async (req, res) => {
  try {
    const clientId = req.apiClient?.id;
    const { days = 30 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const dailyStats = await db
      .select({
        date: apiUsageStats.usageDate,
        totalRequests: sum(apiUsageStats.totalRequests),
        successRequests: sum(apiUsageStats.successRequests),
        errorRequests: sum(apiUsageStats.errorRequests),
        avgResponseTime: avg(apiUsageStats.avgResponseTimeMs),
        totalDataTransferred: sum(apiUsageStats.totalDataTransferredBytes)
      })
      .from(apiUsageStats)
      .where(and(
        clientId ? eq(apiUsageStats.apiClientId, clientId) : undefined,
        gte(apiUsageStats.usageDate, daysAgo.toISOString().split('T')[0])
      ))
      .groupBy(apiUsageStats.usageDate)
      .orderBy(asc(apiUsageStats.usageDate));

    res.json({
      success: true,
      message: "Günlük kullanım trendi getirildi",
      data: dailyStats
    });
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json({
      success: false,
      error: "DAILY_STATS_ERROR",
      message: "Günlük istatistikler alınırken hata oluştu"
    });
  }
});

// 4. Detaylı log kayıtları (sayfalama ile)
router.get('/logs', async (req, res) => {
  try {
    const clientId = req.apiClient?.id;
    const { 
      page = 1, 
      limit = 50, 
      endpoint, 
      method, 
      statusCode, 
      startDate, 
      endDate 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [];
    if (clientId) whereConditions.push(eq(apiUsageLogs.apiClientId, clientId));
    if (endpoint) whereConditions.push(eq(apiUsageLogs.endpoint, endpoint as string));
    if (method) whereConditions.push(eq(apiUsageLogs.method, method as string));
    if (statusCode) whereConditions.push(eq(apiUsageLogs.statusCode, Number(statusCode)));
    if (startDate) whereConditions.push(gte(apiUsageLogs.requestTimestamp, new Date(startDate as string)));
    if (endDate) whereConditions.push(lte(apiUsageLogs.requestTimestamp, new Date(endDate as string)));

    const logs = await db
      .select({
        id: apiUsageLogs.id,
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        statusCode: apiUsageLogs.statusCode,
        responseTime: apiUsageLogs.responseTimeMs,
        requestSize: apiUsageLogs.requestSizeBytes,
        responseSize: apiUsageLogs.responseSizeBytes,
        ipAddress: apiUsageLogs.ipAddress,
        timestamp: apiUsageLogs.requestTimestamp,
        errorMessage: apiUsageLogs.errorMessage
      })
      .from(apiUsageLogs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(apiUsageLogs.requestTimestamp))
      .limit(Number(limit))
      .offset(offset);

    // Toplam sayım
    const [totalCount] = await db
      .select({ count: count() })
      .from(apiUsageLogs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    res.json({
      success: true,
      message: "API log kayıtları getirildi",
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('API logs error:', error);
    res.status(500).json({
      success: false,
      error: "API_LOGS_ERROR",
      message: "Log kayıtları alınırken hata oluştu"
    });
  }
});

// 5. En yavaş endpoint'ler
router.get('/stats/slowest', async (req, res) => {
  try {
    const clientId = req.apiClient?.id;
    const { limit = 10 } = req.query;
    
    const slowestEndpoints = await db
      .select({
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        avgResponseTime: avg(apiUsageLogs.responseTimeMs),
        maxResponseTime: max(apiUsageLogs.responseTimeMs),
        requestCount: count()
      })
      .from(apiUsageLogs)
      .where(clientId ? eq(apiUsageLogs.apiClientId, clientId) : undefined)
      .groupBy(apiUsageLogs.endpoint, apiUsageLogs.method)
      .orderBy(desc(avg(apiUsageLogs.responseTimeMs)))
      .limit(Number(limit));

    res.json({
      success: true,
      message: "En yavaş endpoint'ler getirildi",
      data: slowestEndpoints
    });
  } catch (error) {
    console.error('Slowest endpoints error:', error);
    res.status(500).json({
      success: false,
      error: "SLOWEST_ENDPOINTS_ERROR",
      message: "Yavaş endpoint'ler alınırken hata oluştu"
    });
  }
});

// 6. Hata analizi
router.get('/stats/errors', async (req, res) => {
  try {
    const clientId = req.apiClient?.id;
    const { days = 7 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));
    
    const errorStats = await db
      .select({
        statusCode: apiUsageLogs.statusCode,
        endpoint: apiUsageLogs.endpoint,
        method: apiUsageLogs.method,
        errorCount: count(),
        lastError: max(apiUsageLogs.requestTimestamp)
      })
      .from(apiUsageLogs)
      .where(and(
        clientId ? eq(apiUsageLogs.apiClientId, clientId) : undefined,
        gte(apiUsageLogs.requestTimestamp, daysAgo),
        gte(apiUsageLogs.statusCode, 400)
      ))
      .groupBy(apiUsageLogs.statusCode, apiUsageLogs.endpoint, apiUsageLogs.method)
      .orderBy(desc(count()));

    res.json({
      success: true,
      message: "Hata analizi getirildi",
      data: errorStats
    });
  } catch (error) {
    console.error('Error analysis error:', error);
    res.status(500).json({
      success: false,
      error: "ERROR_ANALYSIS_ERROR",
      message: "Hata analizi alınırken hata oluştu"
    });
  }
});

export default router;