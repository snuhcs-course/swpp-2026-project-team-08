// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

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

export function apiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
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
