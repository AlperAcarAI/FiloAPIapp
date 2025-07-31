import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { loginAttempts, rateLimitBuckets, securityEvents, userSecuritySettings } from '@shared/schema';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Rate limiting configuration
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15 }, // 5 attempts per 15 minutes
  api: { maxAttempts: 100, windowMinutes: 1 },   // 100 requests per minute
  password_reset: { maxAttempts: 3, windowMinutes: 60 }, // 3 resets per hour
};

// Account lockout configuration
const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  maxLockoutDurationMinutes: 24 * 60, // 24 hours
};

export interface SecurityRequest extends Request {
  security?: {
    isRateLimited: boolean;
    attemptsRemaining: number;
    deviceFingerprint?: string;
    riskScore: number;
  };
}

// Rate limiting middleware
export const rateLimitMiddleware = (bucketType: keyof typeof RATE_LIMITS) => {
  return async (req: SecurityRequest, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || 'unknown';
      const config = RATE_LIMITS[bucketType];
      
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);
      
      // Check existing bucket
      const [existingBucket] = await db
        .select()
        .from(rateLimitBuckets)
        .where(and(
          eq(rateLimitBuckets.identifier, identifier),
          eq(rateLimitBuckets.bucketType, bucketType)
        ));

      let requestCount = 1;
      let isBlocked = false;

      if (existingBucket) {
        // Check if window has expired
        if (new Date() > existingBucket.windowEnd) {
          // Reset bucket
          const newWindowEnd = new Date();
          newWindowEnd.setMinutes(newWindowEnd.getMinutes() + config.windowMinutes);
          
          await db
            .update(rateLimitBuckets)
            .set({
              requestCount: 1,
              windowStart: new Date(),
              windowEnd: newWindowEnd,
              isBlocked: false,
              blockedUntil: null,
            })
            .where(eq(rateLimitBuckets.id, existingBucket.id));
          
          requestCount = 1;
        } else {
          // Increment counter
          requestCount = existingBucket.requestCount + 1;
          isBlocked = requestCount > config.maxAttempts;
          
          let blockedUntil = null;
          if (isBlocked) {
            blockedUntil = new Date();
            blockedUntil.setMinutes(blockedUntil.getMinutes() + config.windowMinutes);
          }
          
          await db
            .update(rateLimitBuckets)
            .set({
              requestCount,
              isBlocked,
              blockedUntil,
            })
            .where(eq(rateLimitBuckets.id, existingBucket.id));
        }
      } else {
        // Create new bucket
        const windowEnd = new Date();
        windowEnd.setMinutes(windowEnd.getMinutes() + config.windowMinutes);
        
        await db
          .insert(rateLimitBuckets)
          .values({
            identifier,
            bucketType,
            requestCount: 1,
            windowStart: new Date(),
            windowEnd,
          });
      }

      // Set security info
      req.security = {
        isRateLimited: isBlocked,
        attemptsRemaining: Math.max(0, config.maxAttempts - requestCount),
        riskScore: requestCount / config.maxAttempts,
      };

      if (isBlocked) {
        // Log security event
        await logSecurityEvent('rate_limit_exceeded', {
          severity: 'medium',
          description: `Rate limit exceeded for ${bucketType}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: JSON.stringify({ bucketType, requestCount }),
        });

        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Çok fazla istek. ${config.windowMinutes} dakika sonra tekrar deneyin.`,
          retryAfter: config.windowMinutes * 60,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next(); // Fail open - don't block on middleware errors
    }
  };
};

// Login attempt tracking
export const trackLoginAttempt = async (
  email: string,
  success: boolean,
  ipAddress: string,
  userAgent?: string,
  failureReason?: string
) => {
  try {
    await db.insert(loginAttempts).values({
      email,
      success,
      ipAddress,
      userAgent,
      failureReason,
    });

    // Check for account lockout if failed
    if (!success) {
      await checkAccountLockout(email);
    }
  } catch (error) {
    console.error('Error tracking login attempt:', error);
  }
};

// Check and apply account lockout
export const checkAccountLockout = async (email: string) => {
  try {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const recentFailures = await db
      .select()
      .from(loginAttempts)
      .where(and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.success, false),
        gte(loginAttempts.attemptTime, fifteenMinutesAgo)
      ))
      .orderBy(desc(loginAttempts.attemptTime));

    if (recentFailures.length >= LOCKOUT_CONFIG.maxFailedAttempts) {
      // Lock the account
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_CONFIG.lockoutDurationMinutes);

      // Find user and apply lock
      const { users } = await import('@shared/schema');
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (user) {
        // Update or create security settings
        await db
          .insert(userSecuritySettings)
          .values({
            userId: user.id,
            isAccountLocked: true,
            lockReason: 'Too many failed login attempts',
            lockedAt: new Date(),
            lockedUntil: lockUntil,
          })
          .onConflictDoUpdate({
            target: userSecuritySettings.userId,
            set: {
              isAccountLocked: true,
              lockReason: 'Too many failed login attempts',
              lockedAt: new Date(),
              lockedUntil: lockUntil,
              updatedAt: new Date(),
            },
          });

        // Log security event
        await logSecurityEvent('account_locked', {
          userId: user.id,
          severity: 'high',
          description: `Account locked due to ${recentFailures.length} failed login attempts`,
          metadata: JSON.stringify({ 
            failureCount: recentFailures.length,
            lockDuration: LOCKOUT_CONFIG.lockoutDurationMinutes 
          }),
        });
      }
    }
  } catch (error) {
    console.error('Error checking account lockout:', error);
  }
};

// Check if account is locked
export const isAccountLocked = async (userId: number): Promise<boolean> => {
  try {
    const [settings] = await db
      .select()
      .from(userSecuritySettings)
      .where(eq(userSecuritySettings.userId, userId));

    if (!settings || !settings.isAccountLocked) {
      return false;
    }

    // Check if lock has expired
    if (settings.lockedUntil && new Date() > settings.lockedUntil) {
      // Unlock the account
      await db
        .update(userSecuritySettings)
        .set({
          isAccountLocked: false,
          lockReason: null,
          lockedAt: null,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(userSecuritySettings.userId, userId));

      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking account lock:', error);
    return false;
  }
};

// Security event logging
export const logSecurityEvent = async (
  eventType: string,
  data: {
    userId?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    location?: string;
    metadata?: string;
  }
) => {
  try {
    await db.insert(securityEvents).values({
      userId: data.userId,
      eventType,
      severity: data.severity || 'medium',
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceFingerprint: data.deviceFingerprint,
      location: data.location,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

// Device fingerprinting middleware
export const deviceFingerprintMiddleware = async (
  req: SecurityRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';

    // Create a simple device fingerprint
    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${req.ip}`;
    const deviceFingerprint = await bcrypt.hash(fingerprintData, 8); // Light hash for performance

    if (req.security) {
      req.security.deviceFingerprint = deviceFingerprint;
    } else {
      req.security = {
        isRateLimited: false,
        attemptsRemaining: 0,
        deviceFingerprint,
        riskScore: 0,
      };
    }

    next();
  } catch (error) {
    console.error('Device fingerprint middleware error:', error);
    next();
  }
};

// Security headers middleware
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // CORS headers
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'https://yourdomain.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
  }

  next();
};

// Password strength validation
export const validatePasswordStrength = (password: string): { 
  isValid: boolean;
  score: number;
  requirements: { [key: string]: boolean };
  suggestions: string[];
} => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonWords: !/(password|123456|qwerty|admin|user)/i.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score >= 4; // At least 4/6 requirements

  const suggestions = [];
  if (!requirements.minLength) suggestions.push('En az 8 karakter kullanın');
  if (!requirements.hasUppercase) suggestions.push('En az bir büyük harf ekleyin');
  if (!requirements.hasLowercase) suggestions.push('En az bir küçük harf ekleyin');
  if (!requirements.hasNumbers) suggestions.push('En az bir rakam ekleyin');
  if (!requirements.hasSpecialChars) suggestions.push('En az bir özel karakter ekleyin (!@#$%^&*)');
  if (!requirements.noCommonWords) suggestions.push('Yaygın parolaları kullanmayın');

  return { isValid, score, requirements, suggestions };
};

// Check password history
export const checkPasswordHistory = async (userId: number, newPasswordHash: string): Promise<boolean> => {
  try {
    const { passwordHistory } = await import('@shared/schema');
    
    // Get last 5 passwords
    const lastPasswords = await db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.userId, userId))
      .orderBy(desc(passwordHistory.createdAt))
      .limit(5);

    // Check if new password matches any of the last 5
    for (const oldPassword of lastPasswords) {
      const matches = await bcrypt.compare(newPasswordHash, oldPassword.passwordHash);
      if (matches) {
        return false; // Password was used before
      }
    }

    return true; // Password is new
  } catch (error) {
    console.error('Error checking password history:', error);
    return true; // Fail open
  }
};

// Save password to history
export const savePasswordToHistory = async (userId: number, passwordHash: string) => {
  try {
    const { passwordHistory } = await import('@shared/schema');
    
    await db.insert(passwordHistory).values({
      userId,
      passwordHash,
    });

    // Keep only last 10 passwords
    const oldPasswords = await db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.userId, userId))
      .orderBy(desc(passwordHistory.createdAt))
      .offset(10);

    if (oldPasswords.length > 0) {
      const oldIds = oldPasswords.map(p => p.id);
      await db
        .delete(passwordHistory)
        .where(sql`id = ANY(${oldIds})`);
    }
  } catch (error) {
    console.error('Error saving password to history:', error);
  }
};