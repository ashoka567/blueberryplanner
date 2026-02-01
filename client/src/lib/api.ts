import { Family, User, Chore, GroceryItem, Medicine, MedicineLog, Reminder } from './types';
import { Capacitor } from '@capacitor/core';

// Use full URL when running as native app, relative path for web
const getApiBase = () => {
  if (Capacitor.isNativePlatform()) {
    // Point to your production server for native apps
    return 'https://blueberry-planner.replit.app/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

export async function getFamilies(): Promise<Family[]> {
  const res = await fetch(`${API_BASE}/families`);
  return res.json();
}

export async function getFamily(id: string): Promise<Family> {
  const res = await fetch(`${API_BASE}/families/${id}`);
  return res.json();
}

export async function getFamilyMembers(familyId: string): Promise<User[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/members`);
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  return res.json();
}

export async function updateUserAvatar(userId: string, avatar: string): Promise<{ success: boolean; avatar: string }> {
  const res = await fetch(`${API_BASE}/users/${userId}/avatar`, {
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
  const res = await fetch(`${API_BASE}/families/${familyId}/chores`);
  return res.json();
}

export async function createChore(familyId: string, chore: Partial<Chore>): Promise<Chore> {
  const res = await fetch(`${API_BASE}/families/${familyId}/chores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chore),
  });
  return res.json();
}

export async function updateChore(id: string, updates: Partial<Chore>): Promise<Chore> {
  const res = await fetch(`${API_BASE}/chores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteChore(id: string): Promise<void> {
  await fetch(`${API_BASE}/chores/${id}`, { method: 'DELETE' });
}

export async function getGroceryItems(familyId: string): Promise<GroceryItem[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/groceries`);
  return res.json();
}

export async function createGroceryItem(familyId: string, item: Partial<GroceryItem>): Promise<GroceryItem> {
  const res = await fetch(`${API_BASE}/families/${familyId}/groceries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<GroceryItem> {
  const res = await fetch(`${API_BASE}/groceries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteGroceryItem(id: string): Promise<void> {
  await fetch(`${API_BASE}/groceries/${id}`, { method: 'DELETE' });
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
  const res = await fetch(`${API_BASE}/families/${familyId}/grocery-essentials`);
  return res.json();
}

export async function createGroceryEssential(familyId: string, essential: Partial<GroceryEssential>): Promise<GroceryEssential> {
  const res = await fetch(`${API_BASE}/families/${familyId}/grocery-essentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(essential),
  });
  return res.json();
}

export async function deleteGroceryEssential(id: string): Promise<void> {
  await fetch(`${API_BASE}/grocery-essentials/${id}`, { method: 'DELETE' });
}

export async function getGroceryStores(familyId: string): Promise<GroceryStore[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/grocery-stores`);
  return res.json();
}

export async function createGroceryStore(familyId: string, store: Partial<GroceryStore>): Promise<GroceryStore> {
  const res = await fetch(`${API_BASE}/families/${familyId}/grocery-stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(store),
  });
  return res.json();
}

export async function deleteGroceryStore(id: string): Promise<void> {
  await fetch(`${API_BASE}/grocery-stores/${id}`, { method: 'DELETE' });
}

export async function getGroceryBuyAgain(familyId: string): Promise<GroceryBuyAgain[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/grocery-buy-again`);
  return res.json();
}

export async function createGroceryBuyAgain(familyId: string, item: Partial<GroceryBuyAgain>): Promise<GroceryBuyAgain> {
  const res = await fetch(`${API_BASE}/families/${familyId}/grocery-buy-again`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateGroceryBuyAgain(id: string, updates: Partial<GroceryBuyAgain>): Promise<GroceryBuyAgain> {
  const res = await fetch(`${API_BASE}/grocery-buy-again/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteGroceryBuyAgain(id: string): Promise<void> {
  await fetch(`${API_BASE}/grocery-buy-again/${id}`, { method: 'DELETE' });
}

export async function getMedicines(familyId: string): Promise<Medicine[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/medicines`);
  return res.json();
}

export async function createMedicine(familyId: string, medicine: Partial<Medicine>): Promise<Medicine> {
  const res = await fetch(`${API_BASE}/families/${familyId}/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medicine),
  });
  return res.json();
}

export async function updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
  const res = await fetch(`${API_BASE}/medicines/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteMedicine(id: string): Promise<void> {
  await fetch(`${API_BASE}/medicines/${id}`, { method: 'DELETE' });
}

export async function getMedicineLogs(familyId: string): Promise<MedicineLog[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/medicine-logs`);
  return res.json();
}

export async function createMedicineLog(familyId: string, log: Partial<MedicineLog>): Promise<MedicineLog> {
  const res = await fetch(`${API_BASE}/families/${familyId}/medicine-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  return res.json();
}

export async function getReminders(familyId: string): Promise<Reminder[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/reminders`);
  return res.json();
}

export async function createReminder(familyId: string, reminder: Partial<Reminder>): Promise<Reminder> {
  const res = await fetch(`${API_BASE}/families/${familyId}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  return res.json();
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
  const res = await fetch(`${API_BASE}/reminders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteReminder(id: string): Promise<void> {
  await fetch(`${API_BASE}/reminders/${id}`, { method: 'DELETE' });
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
  const res = await fetch(`${API_BASE}/ai/schedule`, {
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
  const res = await fetch(`${API_BASE}/users/${userId}/pin`, {
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
  const res = await fetch(`${API_BASE}/users/${userId}/points`, {
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
  members?: RegisterMember[];
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}

export interface MeResponse {
  authenticated: boolean;
  user?: AuthUser;
  familyId?: string;
}

export async function getMe(): Promise<MeResponse> {
  const res = await fetch(`${API_BASE}/auth/me`);
  return res.json();
}

export interface KidLoginResponse {
  success: boolean;
  user: { id: string; name: string; isChild: boolean };
  familyId: string;
}

export async function kidLogin(familyName: string, kidName: string, pin: string): Promise<KidLoginResponse> {
  const res = await fetch(`${API_BASE}/auth/kid-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ familyName, kidName, pin }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Invalid PIN');
  }
  return res.json();
}

export interface Kid {
  id: string;
  name: string;
  avatar: string | null;
}

export async function getKidsByFamily(familyId: string): Promise<Kid[]> {
  const res = await fetch(`${API_BASE}/families/${familyId}/kids`);
  return res.json();
}
