# Backend-Only API Tasarımı

## Sistem Mimarisi

### Genel Yapı
```
Frontend Apps (Mobile/Web/Desktop)
           ↓
     RESTful API Gateway
           ↓
   Authentication & Authorization Layer
           ↓
     Business Logic Layer
           ↓
      Database Layer
```

## Authentication & Session Management

### 1. Token-Based Authentication
```javascript
// Login endpoint
POST /api/auth/login
{
  "username": "ahmet.yilmaz",
  "password": "securepass123"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_xyz789abc",
    "expiresIn": 3600,
    "userContext": {
      "userId": 123,
      "personnelId": 456,
      "personnelName": "Ahmet Yılmaz",
      "accessLevel": "WORKSITE",
      "allowedWorkAreaIds": [2],
      "permissions": ["data:read", "fleet:read", "personnel:read"],
      "department": null,
      "positionLevel": 2
    }
  }
}
```

### 2. JWT Token Structure
```javascript
// JWT Payload
{
  "sub": "456", // personnelId
  "userId": 123,
  "accessLevel": "WORKSITE",
  "allowedWorkAreaIds": [2],
  "permissions": ["data:read", "fleet:read", "personnel:read"],
  "department": null,
  "positionLevel": 2,
  "iat": 1706545200,
  "exp": 1706548800
}
```

### 3. Authorization Middleware
```javascript
// JWT doğrulama ve yetki kontrolü
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'NO_TOKEN',
      message: 'Erişim token\'ı gerekli'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Geçersiz veya süresi dolmuş token'
      });
    }

    // User context'i request'e ekle
    req.userContext = {
      userId: payload.userId,
      personnelId: payload.sub,
      accessLevel: payload.accessLevel,
      allowedWorkAreaIds: payload.allowedWorkAreaIds,
      permissions: payload.permissions,
      department: payload.department,
      positionLevel: payload.positionLevel
    };

    next();
  });
};
```

## API Endpoint'leri

### 1. Authentication Endpoints
```javascript
// Giriş
POST /api/auth/login
// Çıkış
POST /api/auth/logout
// Token yenileme
POST /api/auth/refresh
// Kullanıcı bilgileri
GET /api/auth/me
// Şifre değiştirme
PUT /api/auth/change-password
```

### 2. Personnel Management APIs
```javascript
// Personel listesi (hiyerarşik filtreleme)
GET /api/personnel
Query Parameters:
- page: Sayfa numarası (default: 1)  
- limit: Sayfa başına kayıt (default: 20)
- search: Arama terimi
- workAreaId: Çalışma alanı filtresi
- positionId: Pozisyon filtresi
- isActive: Aktif/pasif filtresi

Response:
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "Ahmet",
      "surname": "Yılmaz", 
      "tcNo": "12345678901",
      "workArea": {
        "id": 2,
        "name": "İstanbul Şantiye 1"
      },
      "position": {
        "id": 1,
        "name": "Şantiye Şefi"
      },
      "isActive": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 87,
    "hasNext": true,
    "hasPrev": false
  },
  "userContext": {
    "accessLevel": "WORKSITE",
    "filteredByWorkAreas": [2]
  }
}

// Personel detayı
GET /api/personnel/{id}

// Personel oluşturma (yetki kontrolü)
POST /api/personnel

// Personel güncelleme (yetki kontrolü)
PUT /api/personnel/{id}

// Personel silme (soft delete, yetki kontrolü)
DELETE /api/personnel/{id}
```

### 3. Assets Management APIs
```javascript
// Araç listesi (kullanıcının erişebileceği araçlar)
GET /api/assets
Query Parameters:
- page, limit, search (pagination & arama)
- workAreaId: Çalışma alanı filtresi
- assignedToMe: Sadece bana atanan araçlar (true/false)
- plateNumber: Plaka arama
- brandId: Marka filtresi
- modelId: Model filtresi

Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "plateNumber": "34XYZ789",
      "brand": "Ford",
      "model": "Transit",
      "modelYear": 2022,
      "currentWorkArea": {
        "id": 2,
        "name": "İstanbul Şantiye 1"
      },
      "assignedPersonnel": {
        "id": 456,
        "name": "Ahmet Yılmaz"
      },
      "isAssignedToMe": true,
      "isActive": true
    }
  ],
  "pagination": {...},
  "userContext": {
    "myAssetsCount": 3,
    "totalAccessibleAssets": 15
  }
}

// Araç detayı  
GET /api/assets/{id}

// Araç oluşturma
POST /api/assets

// Araç güncelleme
PUT /api/assets/{id}

// Araç silme (soft delete)
DELETE /api/assets/{id}

// Araç personel atama
POST /api/assets/{id}/assign-personnel
{
  "personnelId": 789,
  "startDate": "2025-01-29",
  "endDate": "2025-06-30"
}
```

### 4. Fuel Records APIs
```javascript
// Yakıt kayıtları (kullanıcının erişebileceği araçlar için)
GET /api/fuel-records
Query Parameters:
- assetId: Araç filtresi
- dateFrom, dateTo: Tarih aralığı
- driverId: Sürücü filtresi

// Yakıt kaydı oluşturma
POST /api/fuel-records
{
  "assetId": 123,
  "recordDate": "2025-01-29",
  "currentKilometers": 45000,
  "fuelAmount": 50.5,
  "fuelCostCents": 2750, // 27.50 TL
  "gasStationName": "Shell",
  "notes": "Tam depo yakıt alındı",
  "receiptNumber": "SH2025012901"
}

// Yakıt kaydı güncelleme (sadece kendi kayıtları)
PUT /api/fuel-records/{id}

// Yakıt kaydı silme (sadece kendi kayıtları)
DELETE /api/fuel-records/{id}
```

### 5. Work Areas APIs
```javascript
// Çalışma alanları (kullanıcının erişebileceği)
GET /api/work-areas

Response:
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "İstanbul Şantiye 1",
      "address": "Pendik, İstanbul",
      "manager": {
        "id": 456,
        "name": "Ahmet Yılmaz"
      },
      "personnelCount": 15,
      "assetsCount": 8,
      "isActive": true,
      "isCurrentWorkArea": true // Kullanıcının aktif çalışma alanı
    }
  ],
  "userContext": {
    "accessLevel": "WORKSITE",
    "allowedWorkAreaIds": [2]
  }
}

// Çalışma alanı detayı
GET /api/work-areas/{id}

// Çalışma alanındaki personeller
GET /api/work-areas/{id}/personnel

// Çalışma alanındaki araçlar  
GET /api/work-areas/{id}/assets
```

## Permission-Based API Access

### 1. Permission Kontrolü Middleware
```javascript
const requirePermission = (permission) => {
  return (req, res, next) => {
    const { permissions } = req.userContext;
    
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

// Usage
app.get('/api/personnel', 
  authenticateJWT, 
  requirePermission('personnel:read'), 
  getPersonnelList
);

app.post('/api/personnel', 
  authenticateJWT, 
  requirePermission('personnel:write'), 
  createPersonnel
);
```

### 2. Data Filtreleme Middleware
```javascript
const filterByWorkArea = (req, res, next) => {
  const { allowedWorkAreaIds, accessLevel } = req.userContext;
  
  // Corporate level - tüm erişim
  if (accessLevel === 'CORPORATE' || allowedWorkAreaIds === null) {
    req.workAreaFilter = null; // No filter
    return next();
  }
  
  // Restricted access
  req.workAreaFilter = allowedWorkAreaIds;
  next();
};
```

## Error Handling & Responses

### 1. Standart Response Format
```javascript
// Success Response
{
  "success": true,
  "data": {...},
  "pagination": {...}, // Sadece liste endpoint'lerinde
  "userContext": {...} // Kullanıcı bağlamı bilgileri
}

// Error Response
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Kullanıcı dostu hata mesajı",
  "details": {...}, // Opsiyonel detay bilgileri
  "timestamp": "2025-01-29T15:30:00Z"
}
```

### 2. HTTP Status Codes
```javascript
200 - OK (Başarılı işlem)
201 - Created (Kayıt oluşturuldu)
400 - Bad Request (Geçersiz istek)
401 - Unauthorized (Kimlik doğrulama gerekli)
403 - Forbidden (Yetki yok)
404 - Not Found (Kayıt bulunamadı)
422 - Unprocessable Entity (Validasyon hatası)
500 - Internal Server Error (Sunucu hatası)
```

## API Documentation (Swagger)

### Swagger Configuration
```javascript
// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FiloApi - Fleet Management API',
      version: '1.0.0',
      description: 'Comprehensive fleet management API with hierarchical access control',
    },
    servers: [
      {
        url: 'https://your-domain.replit.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./server/routes/*.js'], // API dosyaları
};

const specs = swaggerJsdoc(options);
```

## Frontend Integration Guide

### 1. JavaScript/TypeScript Client
```typescript
class FiloApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('filo_token', this.token);
      return data.data.userContext;
    }
    
    throw new Error(data.message);
  }

  // Generic API call
  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      this.token = null;
      localStorage.removeItem('filo_token');
      throw new Error('Session expired');
    }

    return response.json();
  }

  // Personnel methods
  async getPersonnel(params: {
    page?: number;
    limit?: number;
    search?: string;
    workAreaId?: number;
  } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.apiCall(`/api/personnel?${query}`);
  }

  async createPersonnel(data: any) {
    return this.apiCall('/api/personnel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Assets methods
  async getMyAssets() {
    return this.apiCall('/api/assets?assignedToMe=true');
  }

  async createFuelRecord(data: any) {
    return this.apiCall('/api/fuel-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Usage example
const client = new FiloApiClient('https://your-api.replit.app');

// Login
const userContext = await client.login('ahmet.yilmaz', 'password123');
console.log('Logged in as:', userContext.personnelName);
console.log('Access level:', userContext.accessLevel);

// Get personnel (automatically filtered by user's access level)
const personnel = await client.getPersonnel({ page: 1, limit: 20 });
console.log('Accessible personnel:', personnel.data.length);
```

### 2. Mobile App Integration (React Native)
```typescript
// hooks/useFiloApi.ts
import { useState, useEffect } from 'react';

export const useFiloApi = () => {
  const [userContext, setUserContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('filo_token');
    if (token) {
      loadUserContext(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const client = new FiloApiClient(API_BASE_URL);
      const context = await client.login(username, password);
      setUserContext(context);
      return context;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('filo_token');
    setUserContext(null);
  };

  return {
    userContext,
    isLoading,
    isAuthenticated: !!userContext,
    login,
    logout,
  };
};
```

## Deployment & Security

### 1. Environment Variables
```bash
# .env
JWT_SECRET=your-super-secret-jwt-key-256-bit
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://webapp.com,https://mobile.app
API_RATE_LIMIT=1000 # requests per hour per IP
```

### 2. Security Middleware
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Çok fazla istek gönderildi, bir saat sonra tekrar deneyin'
  }
});

app.use('/api/', apiLimiter);

// CORS configuration
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## İmplementasyon Planı

### Aşama 1: Authentication System (3 saat)
1. JWT authentication middleware
2. Login/logout endpoints
3. Token refresh mechanism
4. User context loading

### Aşama 2: Core APIs (4 saat)
1. Personnel management APIs
2. Assets management APIs  
3. Fuel records APIs
4. Work areas APIs

### Aşama 3: Authorization & Filtering (2 saat)
1. Permission-based access control
2. Hierarchical data filtering
3. Error handling standardization

### Aşama 4: Documentation & Testing (1 saat)
1. Swagger documentation
2. API testing
3. Frontend integration examples

**Toplam Süre:** ~10 saat
**Sonuç:** Tamamen backend-only, RESTful API sistemi
**Frontend'ler:** Web, mobile, desktop uygulamaları bu API'ler üzerinden çalışabilir