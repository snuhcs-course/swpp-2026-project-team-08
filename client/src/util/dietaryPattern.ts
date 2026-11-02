// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장

import { dietaryPatternIds, type DietaryPattern } from '../types/dietaryPattern';
import type { Language } from '../types/profile';
import { copyFor } from './strings';

export function isDietaryPattern(value: unknown): value is DietaryPattern {
  return typeof value === 'string' && (dietaryPatternIds as readonly string[]).includes(value);
}

export function dietaryPatternLabel(value: unknown, language: Language): string {
  const copy = copyFor(language).onboarding.dietaryPattern;
  return copy.options.find((option) => option.id === value)?.label ?? copy.notAnswered;
}
