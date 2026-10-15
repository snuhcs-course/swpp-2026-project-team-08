// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import Constants from 'expo-constants';
import { readSession } from '../storage/authStorage';

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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const session = await readSession();
  if (session?.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  } catch (error) {
    throw error;
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
