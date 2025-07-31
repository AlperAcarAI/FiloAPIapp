import { assets, users, type Asset, type InsertAsset, type UpdateAsset, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Asset methods
  getAssets(searchTerm?: string, statusFilter?: string): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: UpdateAsset): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;
  getAssetStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
}

export class DatabaseStorage implements IStorage {
  async getAssets(searchTerm?: string, statusFilter?: string): Promise<Asset[]> {
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

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: number, asset: UpdateAsset): Promise<Asset | undefined> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset || undefined;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAssetStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }> {
    const totalResult = await db.select({ count: count() }).from(assets);
    const activeResult = await db.select({ count: count() }).from(assets).where(eq(assets.isActive, true));
    const inactiveResult = await db.select({ count: count() }).from(assets).where(eq(assets.isActive, false));

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      inactive: inactiveResult[0]?.count || 0,
      error: 0, // No error state for assets
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.passwordHash || '', 10);
    const [newUser] = await db.insert(users).values({
      ...user,
      passwordHash: hashedPassword
    }).returning();
    return newUser;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(email);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) return null;
    
    return user;
  }
}

export const storage = new DatabaseStorage();