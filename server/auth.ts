import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { db } from './db';
import { users, refreshTokens } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_ACCESS_EXPIRES_IN = '30m'; // Access token: 30 dakika
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30; // Refresh token: 30 gün

export interface AuthRequest extends Request {
  user?: {
    id: number;
    userId: number;
    username: string;
  };
}

// Access token oluşturma (kısa süreli)
export const generateAccessToken = (user: { id: number; username: string }) => {
  return jwt.sign(
    { id: user.id, username: user.username, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
};

// Refresh token oluşturma (uzun süreli)
export const generateRefreshToken = async (
  userId: number, 
  ipAddress?: string, 
  userAgent?: string
): Promise<{ token: string; id: number }> => {
  // 32 byte random token oluştur
  const token = randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);
  
  // Expiry date hesapla
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
  
  // Database'e kaydet
  const [refreshTokenRecord] = await db
    .insert(refreshTokens)
    .values({
      userId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    })
    .returning({ id: refreshTokens.id });
  
  return { token, id: refreshTokenRecord.id };
};

// Token çifti oluşturma (access + refresh)
export const generateTokenPair = async (
  user: { id: number; username: string },
  ipAddress?: string,
  userAgent?: string
) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);
  
  return {
    accessToken,
    refreshToken: refreshToken.token,
    refreshTokenId: refreshToken.id,
    expiresIn: 30 * 60, // 30 minutes in seconds
    refreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60, // 30 days in seconds
  };
};

// JWT token doğrulama middleware
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim token bulunamadı. Lütfen giriş yapın.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Kullanıcının hala aktif olup olmadığını kontrol et
    const [user] = await db.select().from(users).where(eq(users.id, decoded.id));
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    req.user = { id: user.id, userId: user.id, username: user.email };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.'
    });
  }
};

// Şifre hash'leme
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// Şifre doğrulama
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Refresh token doğrulama
export const validateRefreshToken = async (token: string) => {
  try {
    // Database'den token'ları al
    const tokenRecords = await db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        tokenHash: refreshTokens.tokenHash,
        expiresAt: refreshTokens.expiresAt,
        isRevoked: refreshTokens.isRevoked,
        userEmail: users.email,
        userIsActive: users.isActive,
      })
      .from(refreshTokens)
      .innerJoin(users, eq(refreshTokens.userId, users.id))
      .where(
        and(
          eq(refreshTokens.isRevoked, false),
          eq(users.isActive, true)
        )
      );

    // Token'ları kontrol et
    for (const record of tokenRecords) {
      const isValid = await bcrypt.compare(token, record.tokenHash);
      if (isValid) {
        // Expiry kontrol et
        if (new Date() > record.expiresAt) {
          throw new Error('Refresh token süresi dolmuş');
        }
        
        return {
          id: record.id,
          userId: record.userId,
          username: record.userEmail,
        };
      }
    }
    
    throw new Error('Geçersiz refresh token');
  } catch (error) {
    throw error;
  }
};

// Refresh token iptal etme
export const revokeRefreshToken = async (tokenId: number) => {
  await db
    .update(refreshTokens)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
    })
    .where(eq(refreshTokens.id, tokenId));
};

// Kullanıcının tüm refresh token'larını iptal etme
export const revokeAllUserRefreshTokens = async (userId: number) => {
  await db
    .update(refreshTokens)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
    })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.isRevoked, false)
      )
    );
};

// Süresi dolmuş token'ları temizleme
export const cleanupExpiredTokens = async () => {
  const result = await db
    .update(refreshTokens)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
    })
    .where(
      and(
        lt(refreshTokens.expiresAt, new Date()),
        eq(refreshTokens.isRevoked, false)
      )
    );
  
  return result;
};

// API key tabanlı basit auth (test ortamı için)
export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key gerekli. Header\'a x-api-key ekleyin.'
    });
  }

  // Basit API key kontrolü (production'da daha güvenli olmalı)
  const validApiKeys = [
    'test-api-key-2025',
    'fleet-management-api-key',
    'demo-api-access-key'
  ];

  if (!validApiKeys.includes(apiKey as string)) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz API key.'
    });
  }

  next();
};