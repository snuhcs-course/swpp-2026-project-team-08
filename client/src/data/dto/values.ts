// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 대문자 enum 과 앱 소문자 값을 변환하는 함수 추가

import type {
  CookingMethod,
  MealLocation,
  MealType,
} from '../../types/recordValues';

export function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid API object');
  }
  return value as Record<string, unknown>;
}

export function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid API string');
  return value;
}

export function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)
    || BigInt(value) > 9223372036854775807n) throw new Error('Invalid API ID');
  return value;
}

export function nullable<T>(value: unknown, parse: (value: unknown) => T): T | null {
  return value === null ? null : parse(value);
}

export function array<T>(value: unknown, parse: (value: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('Invalid API array');
  return value.map(parse);
}

export function date(value: unknown): string {
  const result = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new Error('Invalid API date');
  return result;
}

export function timestamp(value: unknown): string {
  const result = text(value);
  if (!Number.isFinite(Date.parse(result)) || !/(Z|[+-]\d{2}:\d{2})$/.test(result)) {
    throw new Error('Invalid API timestamp');
  }
  return result;
}

export function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new Error('Invalid API choice');
  }
  return value as T;
}

// 서버 enum 은 대문자이고 앱 안의 값은 소문자다. 변환은 이 경계에서만 한다.
export function fromApiEnum<T extends string>(value: unknown, choices: readonly T[]): T {
  const upper = text(value);
  const lower = upper.toLowerCase();
  if (upper !== upper.toUpperCase() || !choices.includes(lower as T)) {
    throw new Error('Invalid API choice');
  }
  return lower as T;
}

export function toApiEnum<T extends string>(value: unknown, choices: readonly T[]): string {
  return choice(value, choices).toUpperCase();
}

export const mealTypes =['breakfast', 'lunch', 'dinner', 'snack'] as const satisfies readonly MealType[];
export const mealLocations = ['home', 'restaurant', 'school', 'others'] as const satisfies readonly MealLocation[];
export const cookingMethods = [
  'raw', 'boiled', 'steamed', 'pan_fried', 'stir_fried', 'baked_roasted', 'mashed_blended', 'other',
] as const satisfies readonly CookingMethod[];

export function acceptance(value: unknown): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 3) {
    throw new Error('Invalid API acceptance');
  }
  return value as number;
}
