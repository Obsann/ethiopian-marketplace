'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { syncSavedToApi } from '@/lib/saved';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithToken: (token: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'buyer' | 'seller';
  }) => Promise<{ emailSent?: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api<{ user: User | null }>('/api/auth/me', token ? { token } : {});
      setUser(res.data.user);
      if (!res.data.user) setToken(null);
    } catch {
      setUser(null);
      setToken(null);
    }
  }, [token]);

  useEffect(() => {
    api<{ user: User | null }>('/api/auth/me')
      .then((res) => {
        setUser(res.data.user);
        if (!res.data.user) setToken(null);
        else void syncSavedToApi();
      })
      .catch(() => {
        setUser(null);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (user) connectSocket(token);
  }, [user, token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.data.token);
    setUser(res.data.user);
    void syncSavedToApi(res.data.token);
    return res.data.user;
  }, []);

  const loginWithToken = useCallback(async (nextToken: string) => {
    const res = await api<{ user: User | null }>('/api/auth/me', { token: nextToken });
    if (!res.data.user) {
      throw new ApiError('Could not restore session', 401);
    }
    setToken(nextToken);
    setUser(res.data.user);
    void syncSavedToApi(nextToken);
    return res.data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: 'buyer' | 'seller';
    }) => {
      const res = await api<{ emailSent?: boolean }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { ...res.data, message: res.message };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* still clear local session */
    }
    disconnectSocket();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, loginWithToken, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
