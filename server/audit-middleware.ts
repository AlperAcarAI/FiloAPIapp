import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { auditLogs } from "@shared/schema";
import type { ApiRequest } from "./api-security";

// Audit middleware - Tüm CRUD işlemlerini loglar
export interface AuditableRequest extends Request {
  auditInfo?: {
    userId?: number;
    apiClientId?: number;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Request'e audit bilgilerini ekleyen fonksiyon (middleware değil)
export const captureAuditInfo = (req: any) => {
  const apiReq = req as ApiRequest;
  
  return {
    userId: (apiReq.user?.id || apiReq.apiUser?.id || req.userContext?.userId) || undefined,
    apiClientId: apiReq.apiClient?.id || undefined,
    ipAddress: req.ip || req.socket.remoteAddress || undefined,
    userAgent: req.get('User-Agent') || undefined
  };
};

// Audit log kaydı oluşturan fonksiyon
export const createAuditLog = async (
  tableName: string,
  recordId: number,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  oldValues?: any,
  newValues?: any,
  auditInfo?: {
    userId?: number;
    apiClientId?: number;
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  try {
    // Değişen alanları tespit et
    const changedFields: string[] = [];
    if (operation === 'UPDATE' && oldValues && newValues) {
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changedFields.push(key);
        }
      });
    }

    await db.insert(auditLogs).values({
      tableName,
      recordId,
      operation,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      changedFields: changedFields.length > 0 ? changedFields : null,
      userId: auditInfo?.userId || undefined,
      apiClientId: auditInfo?.apiClientId || undefined,
      ipAddress: auditInfo?.ipAddress || undefined,
      userAgent: auditInfo?.userAgent || undefined
    });
  } catch (error) {
    // Audit logging hatası uygulamayı durdurmamalı
    console.error('Audit log oluşturma hatası:', error);
  }
};

// Drizzle ORM için audit wrapper fonksiyonları
export const auditableInsert = async (
  dbInstance: any,
  table: any,
  values: any,
  auditInfo?: any
) => {
  const result = await dbInstance.insert(table).values(values).returning();
  if (result[0]) {
    const tableName = table._.name;
    await createAuditLog(tableName, result[0].id, 'INSERT', null, values, auditInfo);
  }
  return result;
};

export const auditableUpdate = async (
  dbInstance: any,
  table: any,
  newValues: any,
  condition: any,
  oldValues: any,
  auditInfo?: any
) => {
  const result = await dbInstance.update(table).set(newValues).where(condition).returning();
  
  if (result[0]) {
    const tableName = table._.name;
    await createAuditLog(tableName, result[0].id, 'UPDATE', oldValues, newValues, auditInfo);
  }
  return result;
};

export const auditableDelete = async (
  table: any,
  condition: any,
  tableName: string,
  auditInfo?: any
) => {
  // Önce silinecek kaydın değerlerini al
  const oldRecord = await db.select().from(table).where(condition).limit(1);
  const oldValues = oldRecord[0] || null;
  
  const result = await db.delete(table).where(condition).returning();
  
  if (result[0] && oldValues) {
    await createAuditLog(tableName, oldValues.id, 'DELETE', oldValues, null, auditInfo);
  }
  return result;
};

// Audit geçmişini sorgulayan fonksiyonlar
export const getRecordAuditHistory = async (tableName: string, recordId: number) => {
  return await db
    .select()
    .from(auditLogs)
    .where(and(
      eq(auditLogs.tableName, tableName),
      eq(auditLogs.recordId, recordId)
    ))
    .orderBy(desc(auditLogs.timestamp));
};

export const getUserAuditActivity = async (userId: number, limit: number = 100) => {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
};

export const getTableAuditSummary = async (tableName: string, days: number = 30) => {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return await db
    .select({
      operation: auditLogs.operation,
      count: sql<number>`count(*)`
    })
    .from(auditLogs)
    .where(and(
      eq(auditLogs.tableName, tableName),
      gte(auditLogs.timestamp, dateLimit)
    ))
    .groupBy(auditLogs.operation);
};

// Import gerekli olanları ekle
import { and, eq, desc, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";