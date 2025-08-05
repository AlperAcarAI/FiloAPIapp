import type { Express, Request } from 'express';
// Authentication removed - direct access enabled
import { db } from './db';
import { 
  securityEvents, 
  userSecuritySettings, 
  loginAttempts, 
  rateLimitBuckets,
  userDevices,
  passwordHistory
} from '@shared/schema';
import { eq, desc, and, gte, sql, count } from 'drizzle-orm';
import { 
  logSecurityEvent,
  validatePasswordStrength,
  checkPasswordHistory,
  savePasswordToHistory
} from './security-middleware';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const registerSecurityRoutes = (app: Express) => {
  
  // Get user security dashboard
  app.get('/api/security/dashboard', async (req, res) => {
    try {
      // Mock user ID since authentication is removed
      const userId = 1; // Default user for demonstration

      // Get security settings
      const [securitySettings] = await db
        .select()
        .from(userSecuritySettings)
        .where(eq(userSecuritySettings.userId, userId));

      // Get recent security events
      const recentEvents = await db
        .select()
        .from(securityEvents)
        .where(eq(securityEvents.userId, userId))
        .orderBy(desc(securityEvents.createdAt))
        .limit(10);

      // Get recent login attempts
      const recentLogins = await db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.email, 'demo@filokiapi.com'))
        .orderBy(desc(loginAttempts.attemptTime))
        .limit(5);

      // Get trusted devices
      const trustedDevices = await db
        .select()
        .from(userDevices)
        .where(and(
          eq(userDevices.userId, userId),
          eq(userDevices.isTrusted, true)
        ))
        .orderBy(desc(userDevices.lastSeenAt));

      res.json({
        success: true,
        data: {
          securitySettings: securitySettings || {
            emailVerified: false,
            isAccountLocked: false,
            passwordChangedAt: null,
          },
          recentEvents,
          recentLogins,
          trustedDevices,
          stats: {
            totalEvents: recentEvents.length,
            failedLogins: recentLogins.filter(l => !l.success).length,
            trustedDevicesCount: trustedDevices.length,
          }
        }
      });
    } catch (error) {
      console.error('Security dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'DASHBOARD_ERROR',
        message: 'Güvenlik panosu yüklenirken hata oluştu'
      });
    }
  });



  // Change password with security checks
  app.post('/api/security/change-password', async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const { currentPassword, newPassword } = req.body;

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
          }
        });
      }

      // Verify current password
      const { users } = await import('@shared/schema');
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'Mevcut parola hatalı'
        });
      }

      // Check password history
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      const isPasswordNew = await checkPasswordHistory(userId, newPassword);
      
      if (!isPasswordNew) {
        return res.status(400).json({
          success: false,
          error: 'PASSWORD_REUSED',
          message: 'Bu parolayı yakın zamanda kullandınız. Farklı bir parola seçin.'
        });
      }

      // Update password
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
        })
        .where(eq(users.id, userId));

      // Save to password history
      await savePasswordToHistory(userId, newPasswordHash);

      // Update security settings
      await db
        .insert(userSecuritySettings)
        .values({
          userId,
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
      await logSecurityEvent('password_changed', {
        userId,
        severity: 'medium',
        description: 'Password successfully changed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Parola başarıyla değiştirildi',
        data: {
          passwordStrength: strengthCheck.score,
          changedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        error: 'PASSWORD_CHANGE_ERROR',
        message: 'Parola değiştirilirken hata oluştu'
      });
    }
  });

  // Get security events (with pagination)
  app.get('/api/security/events', async (req, res) => {
    try {
      const userId = 1;
      const { page = 1, limit = 10, severity, eventType } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Kullanıcı kimliği bulunamadı'
        });
      }

      const offset = (Number(page) - 1) * Number(limit);
      
      // Build where conditions
      let whereConditions = [eq(securityEvents.userId, userId)];
      
      if (severity) {
        whereConditions.push(eq(securityEvents.severity, severity as string));
      }
      
      if (eventType) {
        whereConditions.push(eq(securityEvents.eventType, eventType as string));
      }

      const events = await db
        .select()
        .from(securityEvents)
        .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
        .orderBy(desc(securityEvents.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count  
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(securityEvents)
        .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]);

      res.json({
        success: true,
        data: events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount),
          pages: Math.ceil(Number(totalCount) / Number(limit)),
        }
      });
    } catch (error) {
      console.error('Security events error:', error);
      res.status(500).json({
        success: false,
        error: 'EVENTS_ERROR',
        message: 'Güvenlik olayları yüklenirken hata oluştu'
      });
    }
  });

  // Check password strength
  app.post('/api/security/check-password-strength', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_PASSWORD',
          message: 'Parola gereklidir'
        });
      }

      const strengthCheck = validatePasswordStrength(password);

      res.json({
        success: true,
        data: strengthCheck
      });
    } catch (error) {
      console.error('Password strength check error:', error);
      res.status(500).json({
        success: false,
        error: 'STRENGTH_CHECK_ERROR',
        message: 'Parola gücü kontrol edilirken hata oluştu'
      });
    }
  });

  // Get trusted devices
  app.get('/api/security/devices', async (req: Request, res) => {
    try {
      const userId = 1;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Kullanıcı kimliği bulunamadı'
        });
      }

      const devices = await db
        .select()
        .from(userDevices)
        .where(eq(userDevices.userId, userId))
        .orderBy(desc(userDevices.lastSeenAt));

      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      console.error('Devices error:', error);
      res.status(500).json({
        success: false,
        error: 'DEVICES_ERROR',
        message: 'Cihazlar yüklenirken hata oluştu'
      });
    }
  });

  // Revoke device trust
  app.delete('/api/security/devices/:deviceId', async (req: Request, res) => {
    try {
      const userId = 1;
      const { deviceId } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Kullanıcı kimliği bulunamadı'
        });
      }

      await db
        .update(userDevices)
        .set({
          isTrusted: false,
          isVerified: false,
        })
        .where(and(
          eq(userDevices.userId, userId),
          eq(userDevices.id, Number(deviceId))
        ));

      // Log security event
      await logSecurityEvent('device_trust_revoked', {
        userId,
        severity: 'medium',
        description: `Device trust revoked for device ID: ${deviceId}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Cihaz güveni iptal edildi'
      });
    } catch (error) {
      console.error('Device revoke error:', error);
      res.status(500).json({
        success: false,
        error: 'DEVICE_REVOKE_ERROR',
        message: 'Cihaz güveni iptal edilirken hata oluştu'
      });
    }
  });

  // Admin: Get security overview
  app.get('/api/security/admin/overview', async (req: Request, res) => {
    try {
      // This should have admin permission check
      const userId = 1;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Kullanıcı kimliği bulunamadı'
        });
      }

      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      // Security statistics
      const [totalEvents] = await db
        .select({ count: count() })
        .from(securityEvents);

      const [recentEvents] = await db
        .select({ count: count() })
        .from(securityEvents)
        .where(gte(securityEvents.createdAt, last24Hours));

      const [highSeverityEvents] = await db
        .select({ count: count() })
        .from(securityEvents)
        .where(and(
          gte(securityEvents.createdAt, last24Hours),
          eq(securityEvents.severity, 'high')
        ));

      const [failedLogins] = await db
        .select({ count: count() })
        .from(loginAttempts)
        .where(and(
          gte(loginAttempts.attemptTime, last24Hours),
          eq(loginAttempts.success, false)
        ));

      const [lockedAccounts] = await db
        .select({ count: count() })
        .from(userSecuritySettings)
        .where(eq(userSecuritySettings.isAccountLocked, true));

      res.json({
        success: true,
        data: {
          totalEvents: Number(totalEvents.count),
          recentEvents: Number(recentEvents.count),
          highSeverityEvents: Number(highSeverityEvents.count),
          failedLogins: Number(failedLogins.count),
          lockedAccounts: Number(lockedAccounts.count),
        }
      });
    } catch (error) {
      console.error('Admin security overview error:', error);
      res.status(500).json({
        success: false,
        error: 'ADMIN_OVERVIEW_ERROR',
        message: 'Güvenlik genel bakışı yüklenirken hata oluştu'
      });
    }
  });
};