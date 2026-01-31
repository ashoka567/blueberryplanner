export interface Chore {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  startTime?: string;
  dueDate: string;
  points: number;
  completed: boolean;
  completedAt?: string;
  householdId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChoreRequest {
  title: string;
  description?: string;
  assignedToId: string;
  startTime?: string;
  dueDate: string;
  points?: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  points: number;
}
