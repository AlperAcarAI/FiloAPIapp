import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, personnel, personnelWorkAreas, workAreas, personnelPositions, accessLevels, userAccessRights } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '8h'; // 8 saatlik session

export interface UserContext {
  userId: number;
  personnelId: number | null;
  personnelName: string | null;
  personnelSurname: string | null;
  accessLevel: string;
  hierarchyLevel: number;
  allowedWorkAreaIds: number[] | null; // null = all access
  permissions: string[];
  department: string | null;
  positionLevel: number;
  currentWorkAreaId: number | null;
  currentPositionId: number | null;
  companyId: number;
}

export interface AuthRequest extends Request {
  userContext?: UserContext;
}

// JWT token oluşturma (login sonrası)
export const generateJWTToken = (userContext: UserContext) => {
  const payload = {
    sub: userContext.personnelId || userContext.userId,
    userId: userContext.userId,
    personnelId: userContext.personnelId,
    accessLevel: userContext.accessLevel,
    allowedWorkAreaIds: userContext.allowedWorkAreaIds,
    permissions: userContext.permissions,
    department: userContext.department,
    positionLevel: userContext.positionLevel,
    companyId: userContext.companyId,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Kullanıcının erişim kapsamını hesapla
function calculateAllowedWorkAreas(userContext: any): number[] | null {
  const { accessLevel, accessScope, currentWorkAreaId } = userContext;
  
  // Corporate seviyesi için özel işaretleyici
  if (accessLevel === 'CORPORATE') {
    // Corporate seviye: Açık tüm erişim yetkisi
    return null; // Sadece CORPORATE için null, ama bu kontrollü olacak
  }
  
  if (accessLevel === 'DEPARTMENT') {
    // Department seviye: accessScope'tan work_area_ids al
    try {
      let scope = {};
      if (accessScope) {
        if (typeof accessScope === 'object') {
          scope = accessScope;
        } else if (typeof accessScope === 'string') {
          scope = JSON.parse(accessScope);
        }
      }
      return (scope as any)?.work_area_ids || [];
    } catch (error) {
      console.log('Department access scope parse error:', error);
      return [];
    }
  }
  
  // WORKSITE seviyesi için sadece kendi şantiyesi
  if (accessLevel === 'WORKSITE') {
    return currentWorkAreaId ? [currentWorkAreaId] : [];
  }
  
  // REGIONAL için accessScope'u işle
  if (accessLevel === 'REGIONAL') {
    try {
      let scope = {};
      
      if (accessScope) {
        if (typeof accessScope === 'object') {
          scope = accessScope;
        } else if (typeof accessScope === 'string') {
          scope = JSON.parse(accessScope);
        }
      }
      
      return (scope as any)?.work_area_ids || [];
    } catch (error) {
      console.log('Regional access scope parse warning:', error);
      return [];
    }
  }
  
  return [];
}

// İzinleri hesapla
function calculatePermissions(userContext: any): string[] {
  const { accessLevel, department, positionLevel, accessScope } = userContext;
  
  const basePermissions = ['data:read'];
  
  // Access scope'tan özel izinleri kontrol et
  let scopePermissions: string[] = [];
  if (accessScope) {
    try {
      const scope = typeof accessScope === 'object' ? accessScope : JSON.parse(accessScope);
      if (scope.permissions && Array.isArray(scope.permissions)) {
        scopePermissions = scope.permissions;
      }
    } catch (error) {
      console.log('Permission scope parse error:', error);
    }
  }
  
  let levelPermissions: string[] = [];
  
  switch (accessLevel) {
    case 'WORKSITE':
      if (positionLevel >= 2) { // Şef seviyesi ve üstü
        levelPermissions = [...basePermissions, 'data:write', 'personnel:read', 'fleet:read', 'fleet:write', 'fuel:write'];
      } else {
        levelPermissions = [...basePermissions, 'fleet:read', 'fuel:write'];
      }
      break;
      
    case 'REGIONAL':
      levelPermissions = [...basePermissions, 'data:write', 'personnel:read', 'personnel:write', 
              'fleet:read', 'fleet:write', 'reports:read', 'fuel:read', 'fuel:write'];
      break;
      
    case 'CORPORATE':
      levelPermissions = ['*']; // Tüm izinler
      break;
      
    case 'DEPARTMENT':
      switch (department) {
        case 'muhasebe':
          levelPermissions = [...basePermissions, 'finance:read', 'finance:write', 'reports:read', 'data:write'];
          break;
        case 'ik':
          levelPermissions = [...basePermissions, 'personnel:read', 'personnel:write', 'reports:read', 'data:write'];
          break;
        case 'satin_alma':
          levelPermissions = [...basePermissions, 'assets:read', 'assets:write', 'finance:read', 'data:write'];
          break;
        case 'operasyon':
          levelPermissions = [...basePermissions, 'fleet:read', 'fleet:write', 'fuel:read', 'fuel:write', 'data:write'];
          break;
        default:
          levelPermissions = basePermissions;
      }
      break;
      
    default:
      levelPermissions = basePermissions;
  }
  
  // Scope permissions ile level permissions'ı birleştir
  return [...new Set([...levelPermissions, ...scopePermissions])];
}

// JWT tabanlı hiyerarşik authentication middleware
export const authenticateJWT = async (
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
        error: 'NO_TOKEN',
        message: 'Erişim token\'ı gerekli. Authorization header\'ında Bearer token gönderin.'
      });
    }

    // JWT token doğrulama
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Kullanıcının hala aktif olup olmadığını kontrol et ve context bilgilerini al
    const userWithAccess = await db.select({
      userId: users.id,
      email: users.email,
      department: users.department,
      positionLevel: users.positionLevel,
      personnelId: users.personnelId,
      companyId: users.companyId,
      isActive: users.isActive,
      
      // Personnel bilgileri
      personnelName: personnel.name,
      personnelSurname: personnel.surname,
      
      // Access rights
      accessLevel: accessLevels.code,
      hierarchyLevel: accessLevels.hierarchyLevel,
      accessScope: userAccessRights.accessScope,
      
      // Current worksite (if personnel level)
      currentWorkAreaId: personnelWorkAreas.workAreaId,
      currentPositionId: personnelWorkAreas.positionId,
      workAreaName: workAreas.name,
      positionName: personnelPositions.name
    })
    .from(users)
    .leftJoin(personnel, eq(users.personnelId, personnel.id))
    .leftJoin(userAccessRights, and(
      eq(users.id, userAccessRights.userId),
      eq(userAccessRights.isActive, true)
    ))
    .leftJoin(accessLevels, eq(userAccessRights.accessLevelId, accessLevels.id))
    .leftJoin(personnelWorkAreas, and(
      eq(personnel.id, personnelWorkAreas.personnelId),
      eq(personnelWorkAreas.isActive, true)
    ))
    .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
    .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
    .where(and(
      eq(users.id, decoded.userId),
      eq(users.isActive, true)
    ))
    .limit(1);

    if (!userWithAccess.length) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı veya hesap pasif durumda'
      });
    }

    const userData = userWithAccess[0];
    
    // Eğer kullanıcının access rights'ı yoksa default WORKSITE seviyesi ver
    const accessLevel = userData.accessLevel || 'WORKSITE';
    const hierarchyLevel = userData.hierarchyLevel || 1;
    
    // Access scope kontrolü - Corporate için unlimited_access kontrolü
    let allowedWorkAreaIds: number[] | null = null;
    
    if (accessLevel === 'CORPORATE') {
      // Corporate için unlimited_access flag'i kontrol et
      try {
        const scope = userData.accessScope as any;
        if (scope && scope.unlimited_access === true) {
          allowedWorkAreaIds = null; // Tüm erişim
        } else {
          allowedWorkAreaIds = []; // Hiç erişim yok
        }
      } catch (error) {
        allowedWorkAreaIds = []; // Default: erişim yok
      }
    } else {
      // Diğer seviyeler için hesapla
      allowedWorkAreaIds = calculateAllowedWorkAreas({
        accessLevel,
        accessScope: userData.accessScope,
        currentWorkAreaId: userData.currentWorkAreaId
      });
    }

    // User context oluştur
    const userContext: UserContext = {
      userId: userData.userId,
      personnelId: userData.personnelId,
      personnelName: userData.personnelName,
      personnelSurname: userData.personnelSurname,
      accessLevel: accessLevel,
      hierarchyLevel: hierarchyLevel,
      allowedWorkAreaIds: allowedWorkAreaIds,
      permissions: calculatePermissions({
        accessLevel,
        department: userData.department,
        positionLevel: userData.positionLevel || 1,
        accessScope: userData.accessScope
      }),
      department: userData.department,
      positionLevel: userData.positionLevel || 1,
      currentWorkAreaId: userData.currentWorkAreaId,
      currentPositionId: userData.currentPositionId,
      companyId: userData.companyId
    };
    
    req.userContext = userContext;
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      });
    }
    
    console.error('JWT Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Kimlik doğrulama hatası oluştu'
    });
  }
};

// İzin kontrolü middleware'i
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { permissions } = req.userContext!;
    
    // Wildcard permission check
    if (permissions.includes('*')) {
      return next();
    }
    
    // Specific permission check
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSION',
        message: `Bu işlem için '${permission}' yetkisi gerekli`,
        requiredPermission: permission,
        userPermissions: permissions
      });
    }
    
    next();
  };
};

// Data filtreleme middleware'i
export const filterByWorkArea = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { allowedWorkAreaIds, accessLevel } = req.userContext!;
  
  // Corporate level - tüm erişim
  if (accessLevel === 'CORPORATE' || allowedWorkAreaIds === null) {
    req.workAreaFilter = null; // No filter
    return next();
  }
  
  // Restricted access
  req.workAreaFilter = allowedWorkAreaIds;
  next();
};

// Login endpoint için kullanıcı context'i yükleme
export const loadUserContext = async (userId: number): Promise<UserContext | null> => {
  try {
    const userWithAccess = await db.select({
      userId: users.id,
      email: users.email,
      department: users.department,
      positionLevel: users.positionLevel,
      personnelId: users.personnelId,
      companyId: users.companyId,
      
      // Personnel bilgileri
      personnelName: personnel.name,
      personnelSurname: personnel.surname,
      
      // Access rights
      accessLevel: accessLevels.code,
      hierarchyLevel: accessLevels.hierarchyLevel,
      accessScope: userAccessRights.accessScope,
      
      // Current worksite
      currentWorkAreaId: personnelWorkAreas.workAreaId,
      currentPositionId: personnelWorkAreas.positionId
    })
    .from(users)
    .leftJoin(personnel, eq(users.personnelId, personnel.id))
    .leftJoin(userAccessRights, and(
      eq(users.id, userAccessRights.userId),
      eq(userAccessRights.isActive, true)
    ))
    .leftJoin(accessLevels, eq(userAccessRights.accessLevelId, accessLevels.id))
    .leftJoin(personnelWorkAreas, and(
      eq(personnel.id, personnelWorkAreas.personnelId),
      eq(personnelWorkAreas.isActive, true)
    ))
    .where(and(
      eq(users.id, userId),
      eq(users.isActive, true)
    ))
    .limit(1);

    if (!userWithAccess.length) {
      return null;
    }

    const userData = userWithAccess[0];
    const accessLevel = userData.accessLevel || 'WORKSITE';
    
    return {
      userId: userData.userId,
      personnelId: userData.personnelId,
      personnelName: userData.personnelName,
      personnelSurname: userData.personnelSurname,
      accessLevel: accessLevel,
      hierarchyLevel: userData.hierarchyLevel || 1,
      allowedWorkAreaIds: calculateAllowedWorkAreas({
        accessLevel,
        accessScope: userData.accessScope,
        currentWorkAreaId: userData.currentWorkAreaId
      }),
      permissions: calculatePermissions({
        accessLevel,
        department: userData.department,
        positionLevel: userData.positionLevel || 1
      }),
      department: userData.department,
      positionLevel: userData.positionLevel || 1,
      currentWorkAreaId: userData.currentWorkAreaId,
      currentPositionId: userData.currentPositionId,
      companyId: userData.companyId
    };

  } catch (error) {
    console.error('Load user context error:', error);
    return null;
  }
};

// Request objesine workAreaFilter eklemek için interface extension
declare global {
  namespace Express {
    interface Request {
      workAreaFilter?: number[] | null;
    }
  }
}