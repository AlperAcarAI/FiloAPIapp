import { apiRequest } from "./queryClient";
import type { Api, InsertApi, UpdateApi } from "@shared/schema";

export const apiService = {
  async getApis(searchTerm?: string, statusFilter?: string): Promise<Api[]> {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    
    const response = await apiRequest('GET', `/api/apis?${params.toString()}`);
    return response.json();
  },

  async getApi(id: string): Promise<Api> {
    const response = await apiRequest('GET', `/api/apis/${id}`);
    return response.json();
  },

  async createApi(api: InsertApi): Promise<Api> {
    const response = await apiRequest('POST', '/api/apis', api);
    return response.json();
  },

  async updateApi(id: string, api: UpdateApi): Promise<Api> {
    const response = await apiRequest('PUT', `/api/apis/${id}`, api);
    return response.json();
  },

  async deleteApi(id: string): Promise<void> {
    await apiRequest('DELETE', `/api/apis/${id}`);
  },

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }> {
    const response = await apiRequest('GET', '/api/apis/stats');
    return response.json();
  },

  async exportApis(): Promise<Blob> {
    const response = await apiRequest('GET', '/api/apis/export/json');
    return response.blob();
  }
};
