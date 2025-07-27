import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    userId: number;
    username: string;
  };
}

// JWT token oluşturma
export const generateToken = (user: { id: number; username: string }) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
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