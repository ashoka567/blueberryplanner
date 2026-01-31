import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiUrl || 'https://84f4d655-5aa9-4be0-8601-93c6a0e8a0d1-00-2o74ew3658wc2.riker.replit.dev';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }

  return response.json();
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<{ user: any; familyId: string; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  kidLogin: (familyName: string, kidName: string, pin: string) =>
    apiRequest<{ user: any; familyId: string; token?: string }>('/api/auth/kid-login', {
      method: 'POST',
      body: { familyName, kidName, pin },
    }),

  register: (data: any) =>
    apiRequest<{ user: any; family: any; token?: string }>('/api/auth/register', {
      method: 'POST',
      body: data,
    }),

  logout: () =>
    apiRequest('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    apiRequest<{ authenticated: boolean; user?: any; familyId?: string }>('/api/auth/me'),

  getFamilies: () =>
    apiRequest<any[]>('/api/families'),

  getFamilyMembers: (familyId: string) =>
    apiRequest<any[]>(`/api/families/${familyId}/members`),

  getReminders: (familyId: string) =>
    apiRequest<any[]>(`/api/families/${familyId}/reminders`),

  createReminder: (familyId: string, data: any) =>
    apiRequest(`/api/families/${familyId}/reminders`, {
      method: 'POST',
      body: data,
    }),

  getMedicines: (familyId: string) =>
    apiRequest<any[]>(`/api/families/${familyId}/medicines`),

  createMedicine: (familyId: string, data: any) =>
    apiRequest(`/api/families/${familyId}/medicines`, {
      method: 'POST',
      body: data,
    }),

  getMedicineLogs: (familyId: string) =>
    apiRequest<any[]>(`/api/families/${familyId}/medicine-logs`),

  createMedicineLog: (familyId: string, data: any) =>
    apiRequest(`/api/families/${familyId}/medicine-logs`, {
      method: 'POST',
      body: data,
    }),

  getChores: (familyId: string) =>
    apiRequest<any[]>(`/api/families/${familyId}/chores`),

  createChore: (familyId: string, data: any) =>
    apiRequest(`/api/families/${familyId}/chores`, {
      method: 'POST',
      body: data,
    }),

  updateChore: (choreId: string, data: any) =>
    apiRequest(`/api/chores/${choreId}`, {
      method: 'PATCH',
      body: data,
    }),

  getGroceryItems: (familyId: string) =>
    apiRequest<any[]>(`/api/families/${familyId}/grocery-items`),

  createGroceryItem: (familyId: string, data: any) =>
    apiRequest(`/api/families/${familyId}/grocery-items`, {
      method: 'POST',
      body: data,
    }),

  updateGroceryItem: (itemId: string, data: any) =>
    apiRequest(`/api/grocery-items/${itemId}`, {
      method: 'PATCH',
      body: data,
    }),

  deleteGroceryItem: (itemId: string) =>
    apiRequest(`/api/grocery-items/${itemId}`, {
      method: 'DELETE',
    }),
};
