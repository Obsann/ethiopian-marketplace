'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'buyer' | 'seller';
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = Cookies.get('etm_token');
    if (!saved) {
      setIsLoading(false);
      return;
    }
    setToken(saved);
    api<{ user: User }>('/api/auth/me', { token: saved })
      .then((res) => setUser(res.data.user))
      .catch(() => {
        Cookies.remove('etm_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    Cookies.set('etm_token', res.data.token, { expires: 7 });
    setToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: 'buyer' | 'seller';
    }) => {
      const res = await api<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      Cookies.set('etm_token', res.data.token, { expires: 7 });
      setToken(res.data.token);
      setUser(res.data.user);
    },
    []
  );

  const logout = useCallback(() => {
    Cookies.remove('etm_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
