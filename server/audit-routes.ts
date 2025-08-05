import type { Express } from "express";
import { db } from "./db";
import { auditLogs, users, apiClients } from "@shared/schema";
import { 
  getRecordAuditHistory,
  getUserAuditActivity,
  getTableAuditSummary
} from "./audit-middleware";
// Authentication removed - direct access enabled
import { eq, desc, and, gte, sql } from "drizzle-orm";

export function registerAuditRoutes(app: Express) {
  
  // Belirli bir kaydın audit geçmişini getir
  app.get("/api/audit/record/:tableName/:recordId", async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      
      const auditHistory = await getRecordAuditHistory(tableName, parseInt(recordId));
      
      // Kullanıcı bilgilerini de getir
      const enrichedHistory = await Promise.all(
        auditHistory.map(async (log) => {
          let user = null;
          let apiClient = null;
          
          if (log.userId) {
            const userResult = await db.select({
              id: users.id,
              email: users.email
            }).from(users).where(eq(users.id, log.userId)).limit(1);
            user = userResult[0] || null;
          }
          
          if (log.apiClientId) {
            const clientResult = await db.select({
              id: apiClients.id,
              name: apiClients.name
            }).from(apiClients).where(eq(apiClients.id, log.apiClientId)).limit(1);
            apiClient = clientResult[0] || null;
          }
          
          return {
            ...log,
            user,
            apiClient,
            oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
            newValues: log.newValues ? JSON.parse(log.newValues) : null
          };
        })
      );
      
      res.json({
        success: true,
        data: enrichedHistory,
        count: enrichedHistory.length
      });
    } catch (error) {
      console.error("Audit history getirme hatası:", error);
      res.status(500).json({
        success: false,
        error: "AUDIT_HISTORY_ERROR",
        message: "Audit geçmişi alınırken hata oluştu."
      });
    }
  });

  // Kullanıcının son aktivitelerini getir
  app.get("/api/audit/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const userActivity = await getUserAuditActivity(parseInt(userId), limit);
      
      res.json({
        success: true,
        data: userActivity,
        count: userActivity.length
      });
    } catch (error) {
      console.error("User audit activity getirme hatası:", error);
      res.status(500).json({
        success: false,
        error: "USER_AUDIT_ERROR",
        message: "Kullanıcı audit aktivitesi alınırken hata oluştu."
      });
    }
  });

  // Tablo bazlı audit özeti
  app.get("/api/audit/table/:tableName/summary", async (req, res) => {
    try {
      const { tableName } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      
      const summary = await getTableAuditSummary(tableName, days);
      
      res.json({
        success: true,
        data: {
          tableName,
          period: `${days} gün`,
          operations: summary
        }
      });
    } catch (error) {
      console.error("Table audit summary getirme hatası:", error);
      res.status(500).json({
        success: false,
        error: "TABLE_AUDIT_ERROR",
        message: "Tablo audit özeti alınırken hata oluştu."
      });
    }
  });

  // Genel audit istatistikleri
  app.get("/api/audit/stats", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      
      // Toplam işlem sayısı
      const totalOperations = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(gte(auditLogs.timestamp, dateLimit));
      
      // Operasyon tiplerini say
      const operationStats = await db
        .select({
          operation: auditLogs.operation,
          count: sql<number>`count(*)`
        })
        .from(auditLogs)
        .where(gte(auditLogs.timestamp, dateLimit))
        .groupBy(auditLogs.operation);
      
      // En aktif tablolar
      const activeTableStats = await db
        .select({
          tableName: auditLogs.tableName,
          count: sql<number>`count(*)`
        })
        .from(auditLogs)
        .where(gte(auditLogs.timestamp, dateLimit))
        .groupBy(auditLogs.tableName)
        .orderBy(desc(sql`count(*)`))
        .limit(10);
      
      // En aktif kullanıcılar
      const activeUserStats = await db
        .select({
          userId: auditLogs.userId,
          count: sql<number>`count(*)`
        })
        .from(auditLogs)
        .where(and(
          gte(auditLogs.timestamp, dateLimit),
          sql`${auditLogs.userId} IS NOT NULL`
        ))
        .groupBy(auditLogs.userId)
        .orderBy(desc(sql`count(*)`))
        .limit(10);
      
      res.json({
        success: true,
        data: {
          period: `${days} gün`,
          totalOperations: totalOperations[0]?.count || 0,
          operationBreakdown: operationStats,
          mostActiveTables: activeTableStats,
          mostActiveUsers: activeUserStats
        }
      });
    } catch (error) {
      console.error("Audit stats getirme hatası:", error);
      res.status(500).json({
        success: false,
        error: "AUDIT_STATS_ERROR",
        message: "Audit istatistikleri alınırken hata oluştu."
      });
    }
  });
}