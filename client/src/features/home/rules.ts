// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import type { ChildProfile } from '../../types/profile';
import type { HomeRecords } from '../../types/home';
import type { Meal } from '../../types/meal';
import { savedSuggestionsForProfile } from '../../rules/savedSuggestions';

export function visibleHomeData(records: HomeRecords, profile: ChildProfile, meals: Meal[] = []) {
  return {
    loggedDates: new Set(records.meals.filter((meal) => meal.childId === profile.id).map((meal) => meal.mealDate)),
    suggestions: savedSuggestionsForProfile(records, profile, meals),
  };
}

export function pendingHomeMeals(childId: string, records: readonly { meal: Meal; reviewed: boolean }[]) {
  return records.filter(entry => entry.meal.childId === childId && !entry.reviewed)
    .map(entry => entry.meal)
    .sort((a, b) => b.mealDate.localeCompare(a.mealDate) || b.savedAt.localeCompare(a.savedAt) || a.id.localeCompare(b.id));
}
