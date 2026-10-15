// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authFailure, loginAccount, readCurrentUser, signUpAccount, type AuthFailure } from '../data/api/authApi';
import { clearSession, readSession, saveSession, type AuthSession } from '../data/storage/authStorage';

type AuthResult = { ok: true } | { ok: false; error: AuthFailure };

type AuthContextValue = {
  status: 'loading' | 'ready';
  session: AuthSession | null;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;
    void readSession().then(
      (stored) => { if (active) { setSession(stored); setStatus('ready'); } },
      () => { if (active) setStatus('ready'); },
    );
    return () => { active = false; };
  }, []);

  const persistLogin = useCallback(async (email: string, password: string) => {
    const tokens = await loginAccount({ email, password });
    const pending = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: '', email, fullName: '' },
    };
    await saveSession(pending);
    try {
      const user = await readCurrentUser();
      const next = { ...pending, user };
      await saveSession(next);
      setSession(next);
    } catch (error) {
      await clearSession();
      throw error;
    }
  }, []);

  const signIn = useCallback(async (input: { email: string; password: string }): Promise<AuthResult> => {
    try {
      await persistLogin(input.email, input.password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: authFailure(error) };
    }
  }, [persistLogin]);

  const signUp = useCallback(async (input: { email: string; password: string; fullName: string }): Promise<AuthResult> => {
    try {
      await signUpAccount(input);
      await persistLogin(input.email, input.password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: authFailure(error) };
    }
  }, [persistLogin]);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ status, session, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
}
