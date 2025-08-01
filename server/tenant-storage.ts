import { assets, users, type Asset, type InsertAsset, type UpdateAsset, type User, type InsertUser } from "@shared/schema";
import { eq, ilike, or, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { TenantRequest } from "./tenant-middleware.js";

export interface ITenantStorage {
  // Asset methods - tenant-aware
  getAssets(db: any, searchTerm?: string, statusFilter?: string): Promise<Asset[]>;
  getAsset(db: any, id: number): Promise<Asset | undefined>;
  createAsset(db: any, asset: InsertAsset): Promise<Asset>;
  updateAsset(db: any, id: number, asset: UpdateAsset): Promise<Asset | undefined>;
  deleteAsset(db: any, id: number): Promise<boolean>;
  getAssetStats(db: any): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }>;
  
  // User methods - tenant-aware
  getUser(db: any, id: number): Promise<User | undefined>;
  getUserByUsername(db: any, username: string): Promise<User | undefined>;
  getUserByEmail(db: any, email: string): Promise<User | undefined>;
  createUser(db: any, user: InsertUser): Promise<User>;
  authenticateUser(db: any, email: string, password: string): Promise<User | null>;
}

export class TenantStorage implements ITenantStorage {
  // Asset methods
  async getAssets(db: any, searchTerm?: string, statusFilter?: string): Promise<Asset[]> {
    const conditions = [];
    
    if (searchTerm) {
      conditions.push(
        or(
          ilike(assets.plateNumber, `%${searchTerm}%`),
          ilike(assets.chassisNo, `%${searchTerm}%`)
        )
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active') {
        conditions.push(eq(assets.isActive, true));
      } else if (statusFilter === 'inactive') {
        conditions.push(eq(assets.isActive, false));
      }
    }
    
    if (conditions.length > 0) {
      return await db.select().from(assets)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(assets.createdAt);
    }
    
    return await db.select().from(assets).orderBy(assets.createdAt);
  }

  async getAsset(db: any, id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(db: any, asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(db: any, id: number, asset: UpdateAsset): Promise<Asset | undefined> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset || undefined;
  }

  async deleteAsset(db: any, id: number): Promise<boolean> {
    const [deletedAsset] = await db
      .update(assets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return !!deletedAsset;
  }

  async getAssetStats(db: any): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }> {
    const total = await db.select({ count: count() }).from(assets);
    const active = await db.select({ count: count() }).from(assets).where(eq(assets.isActive, true));
    const inactive = await db.select({ count: count() }).from(assets).where(eq(assets.isActive, false));
    
    return {
      total: total[0]?.count || 0,
      active: active[0]?.count || 0,
      inactive: inactive[0]?.count || 0,
      error: 0 // Implement error status logic if needed
    };
  }

  // User methods
  async getUser(db: any, id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(db: any, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getUserByEmail(db: any, email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(db: any, user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async authenticateUser(db: any, email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(db, email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    return user;
  }
}

// Singleton instance
export const tenantStorage = new TenantStorage();