import { apis, type Api, type InsertApi, type UpdateApi } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // API methods
  getApis(searchTerm?: string, statusFilter?: string): Promise<Api[]>;
  getApi(id: string): Promise<Api | undefined>;
  createApi(api: InsertApi): Promise<Api>;
  updateApi(id: string, api: UpdateApi): Promise<Api | undefined>;
  deleteApi(id: string): Promise<boolean>;
  getApiStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }>;
  
  // User methods (keeping existing interface)
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(user: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getApis(searchTerm?: string, statusFilter?: string): Promise<Api[]> {
    let queryBuilder = db.select().from(apis);
    
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          ilike(apis.ad, `%${searchTerm}%`),
          ilike(apis.aciklama, `%${searchTerm}%`)
        )
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(eq(apis.durum, statusFilter as any));
    }
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      );
    }
    
    return await queryBuilder.orderBy(apis.created_at);
  }

  async getApi(id: string): Promise<Api | undefined> {
    const [api] = await db.select().from(apis).where(eq(apis.api_id, id));
    return api || undefined;
  }

  async createApi(insertApi: InsertApi): Promise<Api> {
    const [api] = await db
      .insert(apis)
      .values({
        ...insertApi,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return api;
  }

  async updateApi(id: string, updateApi: UpdateApi): Promise<Api | undefined> {
    const [api] = await db
      .update(apis)
      .set({
        ...updateApi,
        updated_at: new Date(),
      })
      .where(eq(apis.api_id, id))
      .returning();
    return api || undefined;
  }

  async deleteApi(id: string): Promise<boolean> {
    const result = await db.delete(apis).where(eq(apis.api_id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getApiStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }> {
    const allApis = await db.select().from(apis);
    
    return {
      total: allApis.length,
      active: allApis.filter(api => api.durum === 'aktif').length,
      inactive: allApis.filter(api => api.durum === 'pasif').length,
      error: allApis.filter(api => api.durum === 'hata').length,
    };
  }

  // Keep existing user methods for compatibility
  async getUser(id: number): Promise<any> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any> {
    return undefined;
  }

  async createUser(user: any): Promise<any> {
    return undefined;
  }
}

export const storage = new DatabaseStorage();
