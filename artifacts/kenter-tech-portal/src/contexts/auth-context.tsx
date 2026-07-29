import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@workspace/api-client-react';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('kenter_token');
  });
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('kenter_token', newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
  };

  const logout = () => {
    localStorage.removeItem('kenter_token');
    setToken(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
