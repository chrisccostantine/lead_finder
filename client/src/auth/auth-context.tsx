import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStorage } from '../lib/api';
import type { AuthResponse, User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  needsSetup: boolean | null;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  refreshSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  const refreshSetupStatus = async () => {
    const { data } = await api.get<{ registrationOpen: boolean }>('/auth/setup-status');
    setNeedsSetup(data.registrationOpen);
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const setupResponse = await api.get<{ registrationOpen: boolean }>('/auth/setup-status');
        if (!active) return;
        setNeedsSetup(setupResponse.data.registrationOpen);
        if (tokenStorage.get()) {
          const { data } = await api.get<{ user: User }>('/auth/me');
          if (active) setUser(data.user);
        }
      } catch {
        tokenStorage.clear();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    needsSetup,
    signIn: ({ token, user: nextUser }) => {
      tokenStorage.set(token);
      setUser(nextUser);
      setNeedsSetup(false);
    },
    signOut: () => {
      tokenStorage.clear();
      setUser(null);
    },
    refreshSetupStatus,
  }), [user, isLoading, needsSetup]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

