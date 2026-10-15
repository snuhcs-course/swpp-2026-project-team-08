// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'nurturebites.auth.accessToken';
const REFRESH_KEY = 'nurturebites.auth.refreshToken';
const USER_KEY = 'nurturebites.auth.user.v1';
const LEGACY_SESSION_KEY = 'nurturebites.auth.session.v1';

const secureOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED };

export type AuthUser = { id: string; email: string; fullName: string };
export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

let cached: AuthSession | null | undefined;

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function parseUser(value: unknown): AuthUser | null {
  if (!record(value) || typeof value.id !== 'string' || typeof value.email !== 'string'
    || typeof value.fullName !== 'string') return null;
  return { id: value.id, email: value.email, fullName: value.fullName };
}

function parseSession(value: unknown): AuthSession | null {
  if (!record(value) || typeof value.accessToken !== 'string' || typeof value.refreshToken !== 'string') return null;
  const user = parseUser(value.user);
  if (!user) return null;
  return { accessToken: value.accessToken, refreshToken: value.refreshToken, user };
}

async function canUseSecureStore(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function readSecret(key: string): Promise<string | null> {
  if (await canUseSecureStore()) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function writeSecret(key: string, value: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(key, value, secureOptions);
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteSecret(key: string): Promise<void> {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Missing keys are fine; still drop any plaintext leftover below.
    }
  }
  await AsyncStorage.removeItem(key);
}

async function readUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return parseUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function migrateLegacySession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
  if (!raw) return null;
  let session: AuthSession | null = null;
  try {
    session = parseSession(JSON.parse(raw));
  } catch {
    session = null;
  }
  await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
  if (!session) return null;
  await persistSession(session);
  return session;
}

async function persistSession(session: AuthSession): Promise<void> {
  await writeSecret(ACCESS_KEY, session.accessToken);
  await writeSecret(REFRESH_KEY, session.refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user));
  await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
}

export async function readSession(): Promise<AuthSession | null> {
  if (cached !== undefined) return cached;
  const [accessToken, refreshToken, user] = await Promise.all([
    readSecret(ACCESS_KEY),
    readSecret(REFRESH_KEY),
    readUser(),
  ]);
  if (accessToken && refreshToken && user) {
    cached = { accessToken, refreshToken, user };
    await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
    return cached;
  }
  cached = await migrateLegacySession();
  return cached;
}

export async function saveSession(session: AuthSession): Promise<void> {
  await persistSession(session);
  cached = session;
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteSecret(ACCESS_KEY),
    deleteSecret(REFRESH_KEY),
    AsyncStorage.removeItem(USER_KEY),
    AsyncStorage.removeItem(LEGACY_SESSION_KEY),
  ]);
  cached = undefined;
}
