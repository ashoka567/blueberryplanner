import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string | null;
  isChild: boolean;
}

interface AuthContextType {
  user: User | null;
  familyId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  kidLogin: (familyName: string, kidName: string, pin: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await api.getMe();
      if (result.authenticated && result.user) {
        setUser(result.user);
        setFamilyId(result.familyId || null);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.token) {
      await SecureStore.setItemAsync('authToken', result.token);
    }
    setUser(result.user);
    setFamilyId(result.familyId);
    if (result.familyId) {
      await SecureStore.setItemAsync('familyId', result.familyId);
    }
  };

  const kidLogin = async (familyName: string, kidName: string, pin: string) => {
    const result = await api.kidLogin(familyName, kidName, pin);
    if (result.token) {
      await SecureStore.setItemAsync('authToken', result.token);
    }
    setUser(result.user);
    setFamilyId(result.familyId);
    if (result.familyId) {
      await SecureStore.setItemAsync('familyId', result.familyId);
    }
  };

  const register = async (data: any) => {
    const result = await api.register(data);
    if (result.token) {
      await SecureStore.setItemAsync('authToken', result.token);
    }
    setUser(result.user);
    const fid = result.family?.id || null;
    setFamilyId(fid);
    if (fid) {
      await SecureStore.setItemAsync('familyId', fid);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.log('Logout error:', error);
    }
    setUser(null);
    setFamilyId(null);
    await SecureStore.deleteItemAsync('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        familyId,
        isAuthenticated: !!user,
        isLoading,
        login,
        kidLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
