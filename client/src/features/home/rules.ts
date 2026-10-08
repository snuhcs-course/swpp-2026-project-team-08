import type { ChildProfile } from '../../types/profile';
import type { HomeRecords } from '../../types/home';

export function visibleHomeData(records: HomeRecords, profile: ChildProfile) {
  const allergies = profile.allergies.filter((value) => value !== 'none');
  const restrictions = profile.restrictions.filter((value) => value !== 'none');
  const unsafe = new Set([...allergies, ...restrictions]);
  return {
    loggedDates: new Set(records.meals.filter((meal) => meal.childId === profile.id).map((meal) => meal.mealDate)),
    exposures: records.exposures.filter((entry) => entry.childId === profile.id),
    suggestions: records.suggestions.filter((item) => item.childId === profile.id && item.isSaved
      && item.safetyVerifiedForProfileAt === profile.updatedAt && item.ingredients.length > 0
      && !item.ingredients.some((ingredient) => unsafe.has(ingredient))),
  };
}
