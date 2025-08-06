import { apiRequest } from "./queryClient";

// Types for API responses
export interface City {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  department?: string;
  positionLevel: number;
  isActive: boolean;
  createdAt: string;
}

export interface Personnel {
  id: number;
  name: string;
  surname: string;
  tcNo: string;
  phone: string;
  workArea?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
  };
  isActive: boolean;
}

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  allowedDomains: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export interface ApiEndpoint {
  id: number;
  name: string;
  method: string;
  path: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

export interface BackendAuthResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: number;
    userContext: {
      userId: number;
      accessLevel: string;
      permissions: string[];
      allowedWorkAreaIds: number[] | null;
    };
  };
  message: string;
}

// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    return response.json();
  }
};

// Backend API (JWT-protected hierarchical system)
export const backendApi = {
  async login(email: string, password: string): Promise<BackendAuthResponse> {
    const response = await fetch('/api/backend/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async getPersonnel(token: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    workAreaId?: number;
    positionId?: number;
  }): Promise<{ success: boolean; data: Personnel[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.workAreaId) searchParams.append('workAreaId', params.workAreaId.toString());
    if (params?.positionId) searchParams.append('positionId', params.positionId.toString());

    const response = await fetch(`/api/backend/personnel?${searchParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async getWorkAreas(token: string): Promise<{ success: boolean; data: any[] }> {
    const response = await fetch('/api/backend/work-areas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};

// Public APIs
export const publicApi = {
  async getCities(params?: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ success: boolean; data: { cities: City[]; totalCount: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`/api/getCities?${searchParams.toString()}`);
    return response.json();
  },

  async getSwaggerDocs(): Promise<any> {
    const response = await fetch('/api/docs');
    return response.json();
  },

  async getEndpoints(): Promise<ApiEndpoint[]> {
    // Return real endpoint list with actual names from your 98 endpoints
    const endpoints: ApiEndpoint[] = [
      // Public Endpoints (3)
      { id: 1, name: 'getCities', method: 'GET', path: '/api/getCities', description: 'Şehir listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 2, name: 'getCountries', method: 'GET', path: '/api/getCountries', description: 'Ülke listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 3, name: 'getSwaggerDocs', method: 'GET', path: '/api/docs', description: 'API dokümantasyonu', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Authentication (3)
      { id: 4, name: 'login', method: 'POST', path: '/api/auth/login', description: 'Kullanıcı girişi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 5, name: 'logout', method: 'POST', path: '/api/auth/logout', description: 'Kullanıcı çıkışı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 6, name: 'refreshToken', method: 'POST', path: '/api/auth/refresh', description: 'Token yenileme', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Secure Asset Management (12)
      { id: 7, name: 'getAssets', method: 'GET', path: '/api/secure/assets', description: 'Varlık listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 8, name: 'createAsset', method: 'POST', path: '/api/secure/assets', description: 'Yeni varlık oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 9, name: 'getAssetById', method: 'GET', path: '/api/secure/assets/:id', description: 'Varlık detayı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 10, name: 'updateAsset', method: 'PUT', path: '/api/secure/assets/:id', description: 'Varlık güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 11, name: 'deleteAsset', method: 'DELETE', path: '/api/secure/assets/:id', description: 'Varlık sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 12, name: 'getAssetMaintenance', method: 'GET', path: '/api/secure/assets/:id/maintenance', description: 'Varlık bakım kayıtları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 13, name: 'createAssetMaintenance', method: 'POST', path: '/api/secure/assets/:id/maintenance', description: 'Bakım kaydı oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 14, name: 'getAssetPolicies', method: 'GET', path: '/api/secure/assets/:id/policies', description: 'Varlık sigorta poliçeleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 15, name: 'createAssetPolicy', method: 'POST', path: '/api/secure/assets/:id/policies', description: 'Sigorta poliçesi oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 16, name: 'getAssetDamages', method: 'GET', path: '/api/secure/assets/:id/damages', description: 'Varlık hasar kayıtları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 17, name: 'createAssetDamage', method: 'POST', path: '/api/secure/assets/:id/damages', description: 'Hasar kaydı oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 18, name: 'getAssetDocuments', method: 'GET', path: '/api/secure/assets/:id/documents', description: 'Varlık belgeleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Personnel Management (7)
      { id: 19, name: 'getPersonnel', method: 'GET', path: '/api/secure/personnel', description: 'Personel listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 20, name: 'createPersonnel', method: 'POST', path: '/api/secure/personnel', description: 'Yeni personel oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 21, name: 'getPersonnelById', method: 'GET', path: '/api/secure/personnel/:id', description: 'Personel detayı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 22, name: 'updatePersonnel', method: 'PUT', path: '/api/secure/personnel/:id', description: 'Personel güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 23, name: 'deletePersonnel', method: 'DELETE', path: '/api/secure/personnel/:id', description: 'Personel sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 24, name: 'getPersonnelDocuments', method: 'GET', path: '/api/secure/personnel/:id/documents', description: 'Personel belgeleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 25, name: 'uploadPersonnelDocument', method: 'POST', path: '/api/secure/personnel/:id/documents', description: 'Personel belgesi yükle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Company Management (7)
      { id: 26, name: 'getCompanies', method: 'GET', path: '/api/secure/companies', description: 'Şirket listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 27, name: 'createCompany', method: 'POST', path: '/api/secure/companies', description: 'Yeni şirket oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 28, name: 'getCompanyById', method: 'GET', path: '/api/secure/companies/:id', description: 'Şirket detayı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 29, name: 'updateCompany', method: 'PUT', path: '/api/secure/companies/:id', description: 'Şirket güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 30, name: 'deleteCompany', method: 'DELETE', path: '/api/secure/companies/:id', description: 'Şirket sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 31, name: 'getCompanyAssets', method: 'GET', path: '/api/secure/companies/:id/assets', description: 'Şirket varlıkları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 32, name: 'getCompanyPersonnel', method: 'GET', path: '/api/secure/companies/:id/personnel', description: 'Şirket personeli', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Financial Management (9)
      { id: 33, name: 'getCurrentAccounts', method: 'GET', path: '/api/secure/financial/current-accounts', description: 'Cari hesaplar', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 34, name: 'createCurrentAccount', method: 'POST', path: '/api/secure/financial/current-accounts', description: 'Cari hesap oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 35, name: 'updateCurrentAccount', method: 'PUT', path: '/api/secure/financial/current-accounts/:id', description: 'Cari hesap güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 36, name: 'getAccountDetails', method: 'GET', path: '/api/secure/financial/accounts/:id/details', description: 'Hesap detayları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 37, name: 'createAccountDetail', method: 'POST', path: '/api/secure/financial/accounts/:id/details', description: 'Hesap detayı oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 38, name: 'getPenalties', method: 'GET', path: '/api/secure/financial/penalties', description: 'Ceza listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 39, name: 'createPenalty', method: 'POST', path: '/api/secure/financial/penalties', description: 'Ceza oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 40, name: 'updatePenalty', method: 'PUT', path: '/api/secure/financial/penalties/:id', description: 'Ceza güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 41, name: 'deletePenalty', method: 'DELETE', path: '/api/secure/financial/penalties/:id', description: 'Ceza sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Fuel Management (5)
      { id: 42, name: 'getFuelRecords', method: 'GET', path: '/api/secure/fuel-records', description: 'Yakıt kayıtları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 43, name: 'createFuelRecord', method: 'POST', path: '/api/secure/fuel-records', description: 'Yakıt kaydı oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 44, name: 'getFuelRecordById', method: 'GET', path: '/api/secure/fuel-records/:id', description: 'Yakıt kaydı detayı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 45, name: 'updateFuelRecord', method: 'PUT', path: '/api/secure/fuel-records/:id', description: 'Yakıt kaydı güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 46, name: 'deleteFuelRecord', method: 'DELETE', path: '/api/secure/fuel-records/:id', description: 'Yakıt kaydı sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Trip Rental Management (6)
      { id: 47, name: 'getTripRentals', method: 'GET', path: '/api/secure/trip-rentals', description: 'Sefer kiralama listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 48, name: 'createTripRental', method: 'POST', path: '/api/secure/trip-rentals', description: 'Sefer kiralama oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 49, name: 'getTripRentalById', method: 'GET', path: '/api/secure/trip-rentals/:id', description: 'Sefer detayı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 50, name: 'updateTripRental', method: 'PUT', path: '/api/secure/trip-rentals/:id', description: 'Sefer güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 51, name: 'completeTripRental', method: 'POST', path: '/api/secure/trip-rentals/:id/complete', description: 'Seferi tamamla', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 52, name: 'getRentalAgreements', method: 'GET', path: '/api/secure/rental-agreements', description: 'Kiralama sözleşmeleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Bulk Import (10)
      { id: 53, name: 'bulkImportPersonnel', method: 'POST', path: '/api/secure/bulk-import/personnel', description: 'Toplu personel yükleme', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 54, name: 'getBulkImportStatus', method: 'GET', path: '/api/secure/bulk-import/status/:jobId', description: 'Toplu yükleme durumu', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 55, name: 'downloadPersonnelTemplate', method: 'GET', path: '/api/secure/bulk-import/templates/personnel', description: 'Personel şablonu indir', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 56, name: 'bulkImportAssets', method: 'POST', path: '/api/secure/bulk-import/assets', description: 'Toplu varlık yükleme', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 57, name: 'downloadAssetsTemplate', method: 'GET', path: '/api/secure/bulk-import/templates/assets', description: 'Varlık şablonu indir', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 58, name: 'bulkImportFuel', method: 'POST', path: '/api/secure/bulk-import/fuel', description: 'Toplu yakıt yükleme', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 59, name: 'downloadFuelTemplate', method: 'GET', path: '/api/secure/bulk-import/templates/fuel', description: 'Yakıt şablonu indir', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 60, name: 'bulkImportBrandsModels', method: 'POST', path: '/api/secure/bulk-import/brands-models', description: 'Toplu marka-model yükleme', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 61, name: 'downloadBrandsModelsTemplate', method: 'GET', path: '/api/secure/bulk-import/templates/brands-models', description: 'Marka-model şablonu', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 62, name: 'getBulkImportHistory', method: 'GET', path: '/api/secure/bulk-import/history', description: 'Toplu yükleme geçmişi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Backend API (8) 
      { id: 63, name: 'backendLogin', method: 'POST', path: '/api/backend/login', description: 'Backend sistemi girişi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 64, name: 'getBackendPersonnel', method: 'GET', path: '/api/backend/personnel', description: 'Backend personel listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 65, name: 'getBackendAssets', method: 'GET', path: '/api/backend/assets', description: 'Backend varlık listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 66, name: 'getBackendWorkAreas', method: 'GET', path: '/api/backend/work-areas', description: 'Backend çalışma alanları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 67, name: 'getBackendCompanies', method: 'GET', path: '/api/backend/companies', description: 'Backend şirket listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 68, name: 'createBackendAsset', method: 'POST', path: '/api/backend/assets', description: 'Backend varlık oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 69, name: 'updateBackendAsset', method: 'PUT', path: '/api/backend/assets/:id', description: 'Backend varlık güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 70, name: 'getBackendUserAccess', method: 'GET', path: '/api/backend/user-access', description: 'Backend kullanıcı yetkileri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      
      // Admin Management (28)
      { id: 71, name: 'getUsers', method: 'GET', path: '/api/admin/users', description: 'Kullanıcı listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 72, name: 'createUser', method: 'POST', path: '/api/admin/users', description: 'Kullanıcı oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 73, name: 'updateUser', method: 'PUT', path: '/api/admin/users/:id', description: 'Kullanıcı güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 74, name: 'deleteUser', method: 'DELETE', path: '/api/admin/users/:id', description: 'Kullanıcı sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 75, name: 'getUserRoles', method: 'GET', path: '/api/admin/users/:id/roles', description: 'Kullanıcı rolleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 76, name: 'assignUserRole', method: 'POST', path: '/api/admin/users/:id/roles', description: 'Kullanıcıya rol ata', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 77, name: 'getRoles', method: 'GET', path: '/api/admin/roles', description: 'Rol listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 78, name: 'createRole', method: 'POST', path: '/api/admin/roles', description: 'Rol oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 79, name: 'getPermissions', method: 'GET', path: '/api/admin/permissions', description: 'Yetki listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 80, name: 'createPermission', method: 'POST', path: '/api/admin/permissions', description: 'Yetki oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 81, name: 'getApiClients', method: 'GET', path: '/api/admin/api-clients', description: 'API istemci listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 82, name: 'createApiClient', method: 'POST', path: '/api/admin/api-clients', description: 'API istemci oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 83, name: 'getApiKeys', method: 'GET', path: '/api/admin/api-keys', description: 'API anahtar listesi', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 84, name: 'createApiKey', method: 'POST', path: '/api/admin/api-keys', description: 'API anahtarı oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 85, name: 'deleteApiKey', method: 'DELETE', path: '/api/admin/api-keys/:id', description: 'API anahtarı sil', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 86, name: 'getAuditLogs', method: 'GET', path: '/api/admin/audit-logs', description: 'Denetim kayıtları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 87, name: 'getSecurityEvents', method: 'GET', path: '/api/admin/security-events', description: 'Güvenlik olayları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 88, name: 'getLoginAttempts', method: 'GET', path: '/api/admin/login-attempts', description: 'Giriş denemeleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 89, name: 'getApiUsageStats', method: 'GET', path: '/api/admin/api-usage-stats', description: 'API kullanım istatistikleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 90, name: 'getApiRequestLogs', method: 'GET', path: '/api/admin/api-request-logs', description: 'API istek kayıtları', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 91, name: 'getSystemHealth', method: 'GET', path: '/api/admin/system-health', description: 'Sistem sağlığı', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 92, name: 'getBackupStatus', method: 'GET', path: '/api/admin/backup-status', description: 'Yedekleme durumu', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 93, name: 'createBackup', method: 'POST', path: '/api/admin/backup', description: 'Yedekleme oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 94, name: 'getSystemConfig', method: 'GET', path: '/api/admin/config', description: 'Sistem yapılandırması', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 95, name: 'updateSystemConfig', method: 'PUT', path: '/api/admin/config', description: 'Sistem yapılandırması güncelle', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 96, name: 'getDatabaseStats', method: 'GET', path: '/api/admin/database-stats', description: 'Veritabanı istatistikleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 97, name: 'getPerformanceMetrics', method: 'GET', path: '/api/admin/performance-metrics', description: 'Performans metrikleri', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' },
      { id: 98, name: 'generateReport', method: 'POST', path: '/api/admin/reports', description: 'Rapor oluştur', status: 'active', createdAt: '2025-01-05T19:00:00Z', updatedAt: '2025-01-05T19:00:00Z' }
    ];
    
    return endpoints;
  },

  async getOverview(): Promise<any> {
    const response = await fetch('/api/overview');
    return response.json();
  }
};

// API Key Management
export const apiKeyService = {
  async getUserApiKeys(): Promise<ApiKey[]> {
    const response = await apiRequest('GET', '/api/user/api-keys');
    const data = await response.json();
    return data.data || [];
  },

  async createApiKey(keyData: {
    name: string;
    permissions: string[];
    allowedDomains: string[];
  }): Promise<{ success: boolean; data: { apiKey: ApiKey } }> {
    const response = await apiRequest('POST', '/api/user/api-keys', keyData);
    return response.json();
  },

  async deleteApiKey(keyId: number): Promise<void> {
    await apiRequest('DELETE', `/api/user/api-keys/${keyId}`);
  },

  async getApiKeyStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalUsage: number;
  }> {
    const response = await apiRequest('GET', '/api/user/api-keys/stats');
    return response.json();
  }
};

// Analytics API
export const analyticsApi = {
  async getApiUsageStats(apiKey: string, params?: {
    timeframe?: string;
    endpoint?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params?.endpoint) searchParams.append('endpoint', params.endpoint);

    const response = await fetch(`/api/analytics/usage?${searchParams.toString()}`, {
      headers: { 'X-API-Key': apiKey }
    });
    return response.json();
  },

  async getPerformanceMetrics(apiKey: string): Promise<any> {
    const response = await fetch('/api/analytics/performance', {
      headers: { 'X-API-Key': apiKey }
    });
    return response.json();
  }
};

// Legacy API service for backward compatibility
export const apiService = {
  async getApis(searchTerm?: string, statusFilter?: string): Promise<ApiEndpoint[]> {
    return publicApi.getEndpoints();
  },

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }> {
    const endpoints = await publicApi.getEndpoints();
    return {
      total: endpoints.length,
      active: endpoints.filter(e => e.status === 'active').length,
      inactive: endpoints.filter(e => e.status === 'inactive').length,
      error: endpoints.filter(e => e.status === 'maintenance').length
    };
  }
};
