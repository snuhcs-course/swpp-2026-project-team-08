// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim

import { ApiError, apiRequest } from '../network/apiClient';
import { isUserId, type AuthUser } from '../storage/authStorage';

export type AuthFailure = 'invalid-credentials' | 'email-taken' | 'invalid-email-code' | 'network' | 'unknown';
export type TokenPair = { accessToken: string; refreshToken: string };

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export function authFailure(error: unknown): AuthFailure {
  if (error instanceof ApiError) {
    if (error.errorCode === 'INVALID_CREDENTIALS') return 'invalid-credentials';
    if (error.errorCode === 'EMAIL_ALREADY_EXISTS') return 'email-taken';
    if (error.errorCode === 'INVALID_EMAIL_CODE') return 'invalid-email-code';
    return 'unknown';
  }
  return 'network';
}

export async function signUpAccount(input: { email: string; password: string; fullName: string }): Promise<AuthUser> {
  const value = await apiRequest<unknown>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: input.email, password: input.password, full_name: input.fullName }),
  });
  if (!record(value) || !isUserId(value.id) || typeof value.email !== 'string' || typeof value.full_name !== 'string') {
    throw new Error('Invalid signup response');
  }
  return { id: value.id, email: value.email, fullName: value.full_name };
}

export async function loginAccount(input: { email: string; password: string }): Promise<TokenPair> {
  const value = await apiRequest<unknown>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
  if (!record(value) || typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string') {
    throw new Error('Invalid login response');
  }
  return { accessToken: value.access_token, refreshToken: value.refresh_token };
}

function asUser(value: unknown): AuthUser {
  if (!record(value) || !isUserId(value.id) || typeof value.email !== 'string' || typeof value.full_name !== 'string') {
    throw new Error('Invalid user response');
  }
  return { id: value.id, email: value.email, fullName: value.full_name };
}

export async function readCurrentUser(): Promise<AuthUser> {
  return asUser(await apiRequest<unknown>('/api/v1/auth/me'));
}

export async function updateCurrentName(fullName: string): Promise<AuthUser> {
  return asUser(await apiRequest<unknown>('/api/v1/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ full_name: fullName }),
  }));
}

export function issuedEmailCode(value: unknown): string | undefined {
  if (record(value) && typeof value.dev_code === 'string' && /^\d{6}$/.test(value.dev_code)) {
    return value.dev_code;
  }
  return undefined;
}

export async function requestEmailChange(email: string): Promise<string | undefined> {
  const value = await apiRequest<unknown>('/api/v1/auth/email-change', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return issuedEmailCode(value);
}

export async function confirmEmailChange(email: string, code: string): Promise<AuthUser> {
  return asUser(await apiRequest<unknown>('/api/v1/auth/email-change/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }));
}

export async function deleteAccount(): Promise<void> {
  await apiRequest<unknown>('/api/v1/auth/me', { method: 'DELETE' });
}
