// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'nurturebites.auth.session.v1';

export type AuthUser = { id: string; email: string; fullName: string };
export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

let cached: AuthSession | null | undefined;

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function parseSession(value: unknown): AuthSession | null {
  if (!record(value) || typeof value.accessToken !== 'string' || typeof value.refreshToken !== 'string'
    || !record(value.user) || typeof value.user.id !== 'string' || typeof value.user.email !== 'string'
    || typeof value.user.fullName !== 'string') return null;
  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    user: { id: value.user.id, email: value.user.email, fullName: value.user.fullName },
  };
}

export async function readSession(): Promise<AuthSession | null> {
  if (cached !== undefined) return cached;
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    cached = null;
    return null;
  }
  try {
    cached = parseSession(JSON.parse(raw));
  } catch {
    cached = null;
  }
  return cached;
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  cached = session;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  cached = null;
}
