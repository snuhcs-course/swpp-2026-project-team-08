import type { ChildProfile } from '../../types/profile';
import type { HomeRecords } from '../../types/home';
import type { Meal } from '../../types/meal';
import { savedSuggestionsForProfile } from '../../rules/savedSuggestions';

export function visibleHomeData(records: HomeRecords, profile: ChildProfile, meals: Meal[] = []) {
  return {
    loggedDates: new Set(records.meals.filter((meal) => meal.childId === profile.id).map((meal) => meal.mealDate)),
    exposures: records.exposures.filter((entry) => entry.childId === profile.id),
    suggestions: savedSuggestionsForProfile(records, profile, meals),
  };
}
