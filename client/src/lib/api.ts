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
    const response = await fetch('/api/endpoints');
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
