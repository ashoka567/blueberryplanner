export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  instructions?: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  inventory: number;
  assignedToId: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  userId: string;
  status: 'TAKEN' | 'SKIPPED' | 'MISSED';
  scheduledTime: string;
  takenTime?: string;
  notes?: string;
  householdId: string;
  createdAt: string;
}

export interface CreateMedicationRequest {
  name: string;
  dosage?: string;
  instructions?: string;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  inventory: number;
  assignedToId: string;
}

export interface LogMedicationRequest {
  medicationId: string;
  status: 'TAKEN' | 'SKIPPED' | 'MISSED';
  scheduledTime: string;
  takenTime?: string;
  notes?: string;
}
