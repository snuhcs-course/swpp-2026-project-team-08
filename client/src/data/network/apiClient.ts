// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import Constants from 'expo-constants';
import { readSession, saveSession, type AuthSession } from '../storage/authStorage';

export class ApiError extends Error {
  status: number;
  errorCode: string;
  constructor(status: number, errorCode: string) {
    super(errorCode);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

function metroHostname(): string | undefined {
  const extra = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    debuggerHost?: string;
  };
  const candidates = [
    extra.expoConfig?.hostUri,
    extra.expoGoConfig?.debuggerHost,
    extra.debuggerHost,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const host = value.replace(/^\w+:\/\//, '').split('/')[0]?.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }
  return undefined;
}

export function apiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const host = metroHostname();
  return `http://${host ?? 'localhost'}:8000`;
}

let refreshInFlight: Promise<AuthSession> | null = null;

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
      if (!response.ok) throw new ApiError(response.status, 'UNAUTHENTICATED');
      const tokens: unknown = await response.json();
      if (!tokens || typeof tokens !== 'object' || !('access_token' in tokens)
        || !('refresh_token' in tokens) || typeof tokens.access_token !== 'string'
        || typeof tokens.refresh_token !== 'string') throw new Error('Invalid refresh response');
      const current = await readSession();
      if (!current || current.user.id !== session.user.id || current.refreshToken !== session.refreshToken) {
        throw new ApiError(401, 'UNAUTHENTICATED');
      }
      const next = { ...current, accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
      await saveSession(next);
      return next;
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const session = await readSession();
  if (session?.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  let response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  if (response.status === 401 && session && path !== '/api/v1/auth/refresh'
    && path !== '/api/v1/auth/login' && path !== '/api/v1/auth/signup') {
    const current = await readSession();
    const renewed = current?.accessToken !== session.accessToken && current
      ? current : await refreshSession(session);
    headers.set('Authorization', `Bearer ${renewed.accessToken}`);
    response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const code = data && typeof data === 'object' && 'error_code' in data && typeof data.error_code === 'string'
      ? data.error_code : 'UNKNOWN';
    throw new ApiError(response.status, code);
  }
  return data as T;
}
