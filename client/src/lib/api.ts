import { Family, User, Chore, GroceryItem, Medicine, MedicineLog, Reminder } from './types';

// Detect if running as a native Capacitor app
const isNativePlatform = () => {
  try {
    // Check for Capacitor native platform indicators
    const win = window as any;
    return win.Capacitor?.isNativePlatform?.() || 
           win.Capacitor?.platform !== 'web' ||
           (typeof win.Capacitor !== 'undefined' && win.Capacitor.platform !== undefined && win.Capacitor.platform !== 'web');
  } catch {
    return false;
  }
};

// Use full URL when running as native app, relative path for web
const getApiBase = () => {
  if (isNativePlatform()) {
    // Point to your production server for native apps
    return 'https://84f4d655-5aa9-4be0-8601-93c6a0e8a0d1-00-2o74ew3658wc2.riker.replit.dev/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

// Helper for fetch with credentials (needed for cookies on iOS)
const fetchWithCredentials = (url: string, options?: RequestInit) => {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  
  // For native platforms, send auth info in headers since cookies don't work
  if (isNativePlatform()) {
    const stored = localStorage.getItem('blueberry_auth');
    if (stored) {
      try {
        const authData = JSON.parse(stored);
        if (authData.user?.id) {
          headers['X-User-Id'] = authData.user.id;
        }
        if (authData.familyId) {
          headers['X-Family-Id'] = authData.familyId;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
};

export async function getFamilies(): Promise<Family[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families`);
  return res.json();
}

export async function getFamily(id: string): Promise<Family> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${id}`);
  return res.json();
}

export async function getFamilyMembers(familyId: string): Promise<User[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/members`);
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetchWithCredentials(`${API_BASE}/users`);
  return res.json();
}

export async function updateUserAvatar(userId: string, avatar: string): Promise<{ success: boolean; avatar: string }> {
  const res = await fetchWithCredentials(`${API_BASE}/users/${userId}/avatar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update avatar');
  }
  return res.json();
}

export async function getChores(familyId: string): Promise<Chore[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/chores`);
  return res.json();
}

export async function createChore(familyId: string, chore: Partial<Chore>): Promise<Chore> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/chores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chore),
  });
  return res.json();
}

export async function updateChore(id: string, updates: Partial<Chore>): Promise<Chore> {
  const res = await fetchWithCredentials(`${API_BASE}/chores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteChore(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/chores/${id}`, { method: 'DELETE' });
}

export async function getGroceryItems(familyId: string): Promise<GroceryItem[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/groceries`);
  return res.json();
}

export async function createGroceryItem(familyId: string, item: Partial<GroceryItem>): Promise<GroceryItem> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/groceries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<GroceryItem> {
  const res = await fetchWithCredentials(`${API_BASE}/groceries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteGroceryItem(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/groceries/${id}`, { method: 'DELETE' });
}

export interface GroceryEssential {
  id: string;
  familyId: string;
  userId: string | null;
  name: string;
  category: string | null;
  createdAt: Date;
}

export interface GroceryStore {
  id: string;
  familyId: string;
  userId: string | null;
  name: string;
  createdAt: Date;
}

export interface GroceryBuyAgain {
  id: string;
  familyId: string;
  userId: string | null;
  name: string;
  category: string | null;
  store: string | null;
  quantity: string | null;
  purchaseCount: number;
  lastPurchased: Date;
}

export async function getGroceryEssentials(familyId: string): Promise<GroceryEssential[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/grocery-essentials`);
  return res.json();
}

export async function createGroceryEssential(familyId: string, essential: Partial<GroceryEssential>): Promise<GroceryEssential> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/grocery-essentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(essential),
  });
  return res.json();
}

export async function deleteGroceryEssential(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/grocery-essentials/${id}`, { method: 'DELETE' });
}

export async function getGroceryStores(familyId: string): Promise<GroceryStore[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/grocery-stores`);
  return res.json();
}

export async function createGroceryStore(familyId: string, store: Partial<GroceryStore>): Promise<GroceryStore> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/grocery-stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(store),
  });
  return res.json();
}

export async function deleteGroceryStore(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/grocery-stores/${id}`, { method: 'DELETE' });
}

export async function getGroceryBuyAgain(familyId: string): Promise<GroceryBuyAgain[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/grocery-buy-again`);
  return res.json();
}

export async function createGroceryBuyAgain(familyId: string, item: Partial<GroceryBuyAgain>): Promise<GroceryBuyAgain> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/grocery-buy-again`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateGroceryBuyAgain(id: string, updates: Partial<GroceryBuyAgain>): Promise<GroceryBuyAgain> {
  const res = await fetchWithCredentials(`${API_BASE}/grocery-buy-again/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteGroceryBuyAgain(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/grocery-buy-again/${id}`, { method: 'DELETE' });
}

export async function getMedicines(familyId: string): Promise<Medicine[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/medicines`);
  return res.json();
}

export async function createMedicine(familyId: string, medicine: Partial<Medicine>): Promise<Medicine> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medicine),
  });
  return res.json();
}

export async function updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
  const res = await fetchWithCredentials(`${API_BASE}/medicines/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteMedicine(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/medicines/${id}`, { method: 'DELETE' });
}

export async function getMedicineLogs(familyId: string): Promise<MedicineLog[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/medicine-logs`);
  return res.json();
}

export async function createMedicineLog(familyId: string, log: Partial<MedicineLog>): Promise<MedicineLog> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/medicine-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  return res.json();
}

export async function getReminders(familyId: string): Promise<Reminder[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/reminders`);
  return res.json();
}

export async function createReminder(familyId: string, reminder: Partial<Reminder>): Promise<Reminder> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  return res.json();
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
  const res = await fetchWithCredentials(`${API_BASE}/reminders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteReminder(id: string): Promise<void> {
  await fetchWithCredentials(`${API_BASE}/reminders/${id}`, { method: 'DELETE' });
}

export interface ScheduleResponse {
  message: string;
  items: unknown[];
  choresCreated: number;
  remindersCreated: number;
  medicationsCreated: number;
  groceriesCreated: number;
}

export async function aiSchedule(text: string, familyId?: string): Promise<ScheduleResponse> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetchWithCredentials(`${API_BASE}/ai/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, familyId, timezone }),
  });
  return res.json();
}

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  isChild: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  family?: { id: string; name: string };
  familyId?: string;
  emailVerificationSent?: boolean;
  kidPins?: { name: string; pin: string }[];
}

export interface RegisterMember {
  name: string;
  email?: string;
  password?: string;
  age?: number;
  isChild: boolean;
  pin?: string;
}

export async function updateUserPin(userId: string, pin: string): Promise<{ success: boolean }> {
  const res = await fetchWithCredentials(`${API_BASE}/users/${userId}/pin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update PIN');
  }
  return res.json();
}

export async function updateUserPoints(userId: string, points: number): Promise<{ success: boolean }> {
  const res = await fetchWithCredentials(`${API_BASE}/users/${userId}/points`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update points');
  }
  return res.json();
}

export interface RegisterData {
  familyName: string;
  guardianName: string;
  guardianEmail: string;
  password: string;
  securityQuestion1?: string;
  securityAnswer1?: string;
  securityQuestion2?: string;
  securityAnswer2?: string;
  members?: RegisterMember[];
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  const result = await res.json();
  // Save to localStorage for native platforms
  if (result.success && result.user) {
    saveAuthToStorage({ user: result.user, familyId: result.familyId });
  }
  return result;
}

const AUTH_STORAGE_KEY = 'blueberry_auth';

// Save auth data to localStorage for native platforms
const saveAuthToStorage = (data: { user: AuthUser; familyId?: string }) => {
  if (isNativePlatform()) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  }
};

// Get auth data from localStorage
const getAuthFromStorage = (): { user: AuthUser; familyId?: string } | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

// Clear auth data from localStorage
const clearAuthFromStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  const data = await res.json();
  // Save to localStorage for native platforms
  if (data.success && data.user) {
    saveAuthToStorage({ user: data.user, familyId: data.familyId });
  }
  return data;
}

export async function logout(): Promise<void> {
  clearAuthFromStorage();
  try {
    await fetchWithCredentials(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (e) {
  }
}

export async function deleteAccount(): Promise<{ success: boolean }> {
  clearAuthFromStorage();
  const res = await fetchWithCredentials(`${API_BASE}/auth/account`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

export interface MeResponse {
  authenticated: boolean;
  user?: AuthUser;
  familyId?: string;
}

export async function getMe(): Promise<MeResponse> {
  // On native platforms, check localStorage first
  if (isNativePlatform()) {
    const stored = getAuthFromStorage();
    if (stored) {
      return {
        authenticated: true,
        user: stored.user,
        familyId: stored.familyId,
      };
    }
  }
  
  const res = await fetchWithCredentials(`${API_BASE}/auth/me`);
  return res.json();
}

export interface KidLoginResponse {
  success: boolean;
  user: { id: string; name: string; isChild: boolean };
  familyId: string;
}

export async function kidLogin(familyName: string, kidName: string, pin: string): Promise<KidLoginResponse> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/kid-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ familyName, kidName, pin }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Invalid PIN');
  }
  const data = await res.json();
  // Save to localStorage for native platforms
  if (data.success && data.user) {
    saveAuthToStorage({ 
      user: { ...data.user, email: null }, 
      familyId: data.familyId 
    });
  }
  return data;
}

export interface Kid {
  id: string;
  name: string;
  avatar: string | null;
}

export async function getKidsByFamily(familyId: string): Promise<Kid[]> {
  const res = await fetchWithCredentials(`${API_BASE}/families/${familyId}/kids`);
  return res.json();
}

export interface VerifyResetResponse {
  found: boolean;
  reason?: string;
  securityQuestion1?: string;
  securityQuestion2?: string;
}

export async function getSecurityQuestions(): Promise<{ hasSecurityQuestions: boolean; securityQuestion1: string | null; securityQuestion2: string | null }> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/security-questions`);
  return res.json();
}

export async function updateSecurityQuestions(data: { securityQuestion1: string; securityAnswer1: string; securityQuestion2: string; securityAnswer2: string }): Promise<{ success: boolean }> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/security-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update security questions');
  }
  return res.json();
}

export async function setupSecurityQuestions(data: { email: string; currentPassword: string; securityQuestion1: string; securityAnswer1: string; securityQuestion2: string; securityAnswer2: string }): Promise<{ success: boolean }> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/setup-security-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to set up security questions');
  }
  return res.json();
}

export async function verifyResetPassword(email: string): Promise<VerifyResetResponse> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/reset-password/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to verify account');
  }
  return res.json();
}

export interface DashboardConfigResponse {
  id?: string;
  userId?: string;
  widgets: Array<{ id: string; visible: boolean; position: number }> | null;
  updatedAt?: string;
}

export async function getDashboardConfig(): Promise<DashboardConfigResponse> {
  const res = await fetchWithCredentials(`${API_BASE}/dashboard-config`);
  return res.json();
}

export async function saveDashboardConfig(widgets: Array<{ id: string; visible: boolean; position: number }>): Promise<DashboardConfigResponse> {
  const res = await fetchWithCredentials(`${API_BASE}/dashboard-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgets }),
  });
  return res.json();
}

export interface AddFamilyMemberData {
  name: string;
  email?: string;
  password?: string;
  isChild: boolean;
  age?: number;
  pin?: string;
}

export async function addFamilyMember(data: AddFamilyMemberData): Promise<any> {
  const res = await fetchWithCredentials(`${API_BASE}/family/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add family member');
  }
  return res.json();
}

export async function updateFamilyMember(userId: string, data: Partial<AddFamilyMemberData>): Promise<any> {
  const res = await fetchWithCredentials(`${API_BASE}/family/members/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update family member');
  }
  return res.json();
}

export async function removeFamilyMember(userId: string): Promise<{ success: boolean }> {
  const res = await fetchWithCredentials(`${API_BASE}/family/members/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to remove family member');
  }
  return res.json();
}

export async function resetPassword(email: string, securityAnswer1: string, securityAnswer2: string, newPassword: string): Promise<{ success: boolean }> {
  const res = await fetchWithCredentials(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, securityAnswer1, securityAnswer2, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Password reset failed');
  }
  return res.json();
}
