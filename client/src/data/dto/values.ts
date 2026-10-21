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

export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const satisfies readonly MealType[];
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
