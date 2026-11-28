// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 공통 요약
import type { Language, RefusedFood } from '../types/profile';
import { copyFor } from './strings';

export function refusedFoodSummary(foods: readonly RefusedFood[] | undefined, language: Language): string {
  return foods?.map(food => food.name).join(', ') || copyFor(language).common.notEntered;
}
