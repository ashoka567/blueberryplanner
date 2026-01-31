export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' | 'CHILD' | 'VIEW_ONLY';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  loginType: string;
  age?: number | null;
  isChild?: boolean | null;
  status?: string | null;
  avatar?: string | null;
  createdAt?: Date | null;
}

export interface Family {
  id: string;
  name: string;
  createdBy?: string | null;
  timezone?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt?: Date | null;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  roleId?: number | null;
  joinedAt?: Date | null;
  status?: string | null;
}

export interface Chore {
  id: string;
  familyId: string;
  title: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  repeatType?: string | null;
  status?: string | null;
  points?: number | null;
  createdBy?: string | null;
  createdAt?: Date | null;
}

export interface GroceryItem {
  id: string;
  familyId: string;
  name: string;
  quantity?: string | null;
  category?: string | null;
  store?: string | null;
  notes?: string | null;
  status?: string | null;
  purchaseCount?: number | null;
  addedBy?: string | null;
  updatedAt?: Date | null;
}

export interface Medicine {
  id: string;
  familyId: string;
  name: string;
  dosage?: string | null;
  schedule?: { type: string; times?: string[] } | null;
  assignedTo?: string | null;
  active?: boolean | null;
  inventory?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  createdBy?: string | null;
  createdAt?: Date | null;
}

export interface MedicineLog {
  id: string;
  familyId: string;
  medicineId: string;
  takenBy?: string | null;
  markedBy?: string | null;
  takenAt: Date;
  scheduledTime?: string | null;
  status?: string | null;
}

export interface Reminder {
  id: string;
  familyId: string;
  title: string;
  description?: string | null;
  type: string;
  referenceId?: string | null;
  schedule: Record<string, unknown>;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  timezone?: string | null;
  createdBy?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type CalendarEvent = Reminder;
