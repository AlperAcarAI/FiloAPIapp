import type { Express, Request, Response } from 'express';
import { db } from './db';
import { users, passwordResetTokens, userSecuritySettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  rateLimitMiddleware,
  logSecurityEvent,
  validatePasswordStrength,
  checkPasswordHistory,
  savePasswordToHistory,
  isAccountLocked,
} from './security-middleware';
import { revokeAllUserRefreshTokens } from './auth';
import { sendPulseService } from './sendpulse-service';

const TOKEN_EXPIRY_MINUTES = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const registerPasswordResetRoutes = (app: Express) => {

  // POST /api/auth/forgot-password
  app.post('/api/auth/forgot-password', rateLimitMiddleware('password_reset'), async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Geçerli bir e-posta adresi giriniz.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Always return the same response to prevent user enumeration
      const successResponse = {
        success: true,
        message: 'Eğer bu e-posta adresi sistemde kayıtlı ise, şifre sıfırlama bağlantısı gönderilecektir.',
      };

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

      if (!user || !user.isActive) {
        // Log but still return success to prevent enumeration
        await logSecurityEvent('password_reset_failed', {
          severity: 'low',
          description: `Password reset requested for non-existent or inactive email: ${normalizedEmail}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
        return res.json(successResponse);
      }

      // Check if account is locked
      const locked = await isAccountLocked(user.id);
      if (locked) {
        await logSecurityEvent('password_reset_blocked', {
          userId: user.id,
          severity: 'medium',
          description: 'Password reset attempted on locked account',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
        return res.json(successResponse);
      }

      // Invalidate any existing unused tokens for this user
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true, usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            eq(passwordResetTokens.isUsed, false)
          )
        );

      // Generate token
      const token = randomBytes(32).toString('hex');
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Store hashed token in database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: req.ip || undefined,
        userAgent: req.get('User-Agent') || undefined,
      });

      // Build reset URL
      const appUrl = process.env.APP_URL || 'https://app.ersaulasim.com';
      const resetUrl = `${appUrl}/reset-password/${token}`;

      // Get user's name from personnel if available
      let userName: string | undefined;
      try {
        const { personnel } = await import('@shared/schema');
        if (user.personnelId) {
          const [person] = await db.select().from(personnel).where(eq(personnel.id, user.personnelId));
          if (person) {
            userName = `${person.name} ${person.surname}`;
          }
        }
      } catch {
        // Ignore - userName stays undefined
      }

      // Send email via SendPulse
      const emailSent = await sendPulseService.sendPasswordResetEmail(
        normalizedEmail,
        resetUrl,
        userName
      );

      if (!emailSent) {
        console.error('Failed to send password reset email to:', normalizedEmail);
      }

      // Log security event
      await logSecurityEvent('password_reset_requested', {
        userId: user.id,
        severity: 'medium',
        description: 'Password reset email requested',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: JSON.stringify({ emailSent }),
      });

      return res.json(successResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      });
    }
  });

  // POST /api/auth/reset-password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || typeof token !== 'string' || token.length !== 64) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Geçersiz veya süresi dolmuş bağlantı.',
        });
      }

      if (!newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Yeni parola gereklidir.',
        });
      }

      // Hash token and look up in database
      const tokenHash = hashToken(token);
      const [tokenRecord] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            eq(passwordResetTokens.isUsed, false)
          )
        );

      if (!tokenRecord) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Geçersiz veya süresi dolmuş bağlantı.',
        });
      }

      // Check expiry
      if (new Date() > tokenRecord.expiresAt) {
        // Mark as used
        await db
          .update(passwordResetTokens)
          .set({ isUsed: true, usedAt: new Date() })
          .where(eq(passwordResetTokens.id, tokenRecord.id));

        return res.status(400).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Bu bağlantının süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebi oluşturun.',
        });
      }

      // Load user
      const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId));

      if (!user || !user.isActive) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Geçersiz veya süresi dolmuş bağlantı.',
        });
      }

      // Check account lock
      const locked = await isAccountLocked(user.id);
      if (locked) {
        return res.status(400).json({
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: 'Hesabınız kilitlenmiş durumda. Lütfen daha sonra tekrar deneyin.',
        });
      }

      // Validate password strength
      const strengthCheck = validatePasswordStrength(newPassword);
      if (!strengthCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: 'WEAK_PASSWORD',
          message: 'Parola yeterince güçlü değil',
          data: {
            requirements: strengthCheck.requirements,
            suggestions: strengthCheck.suggestions,
            score: strengthCheck.score,
          },
        });
      }

      // Check password history
      const isPasswordNew = await checkPasswordHistory(user.id, newPassword);
      if (!isPasswordNew) {
        return res.status(400).json({
          success: false,
          error: 'PASSWORD_REUSED',
          message: 'Bu parolayı yakın zamanda kullandınız. Farklı bir parola seçin.',
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id));

      // Save to password history
      await savePasswordToHistory(user.id, newPasswordHash);

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true, usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenRecord.id));

      // Revoke all refresh tokens (force re-login everywhere)
      await revokeAllUserRefreshTokens(user.id);

      // Update security settings
      await db
        .insert(userSecuritySettings)
        .values({
          userId: user.id,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userSecuritySettings.userId,
          set: {
            passwordChangedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      // Log security event
      await logSecurityEvent('password_reset_completed', {
        userId: user.id,
        severity: 'high',
        description: 'Password successfully reset via email link',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({
        success: true,
        message: 'Parolanız başarıyla sıfırlanmıştır. Yeni parolanızla giriş yapabilirsiniz.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      });
    }
  });

  // GET /api/auth/verify-reset-token/:token
  app.get('/api/auth/verify-reset-token/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      if (!token || token.length !== 64) {
        return res.json({ valid: false });
      }

      const tokenHash = hashToken(token);
      const [tokenRecord] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            eq(passwordResetTokens.isUsed, false)
          )
        );

      if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
        return res.json({ valid: false });
      }

      return res.json({ valid: true });
    } catch (error) {
      console.error('Verify reset token error:', error);
      return res.json({ valid: false });
    }
  });
};
