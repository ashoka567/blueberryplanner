export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'GUARDIAN' | 'MEMBER';
  householdId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'GUARDIAN' | 'MEMBER';
  householdName?: string;
  inviteCode?: string;
}
