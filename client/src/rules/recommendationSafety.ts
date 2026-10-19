// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import type { AfterMealReview } from '../types/afterMealReview';
import type { SavedSuggestion } from '../types/home';
import type { FoodItem, Meal } from '../types/meal';
import type { ChildProfile } from '../types/profile';

export function hasVerifiedNoRestrictions(profile: ChildProfile): boolean {
  return profile.allergies.length === 1 && profile.allergies[0] === 'none'
    && profile.restrictions.length === 1 && profile.restrictions[0] === 'none';
}

export function hasKnownFoodForm(food: FoodItem): boolean {
  return !!food.name.trim() && !!food.preparation.trim()
    && food.ingredients.length > 0 && food.ingredients.every((ingredient) => !!ingredient.trim());
}

export function foodFormKey(food: FoodItem): string {
  return JSON.stringify({
    name: food.name.trim(),
    ingredients: food.ingredients.map((ingredient) => ingredient.trim()),
    preparation: food.preparation.trim(),
    servingNote: food.servingNote.trim(),
  });
}

// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Old evidence may contain food traits. Compare the remaining serving details.
export function normalizedFoodFormKey(key: string | undefined): string | null {
  if (typeof key !== 'string') return null;
  try {
    const value: unknown = JSON.parse(key);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const form = value as Record<string, unknown>;
    if (Object.keys(form).some((name) => !['name', 'ingredients', 'preparation', 'servingNote', 'traits'].includes(name))
      || typeof form.name !== 'string' || typeof form.preparation !== 'string' || typeof form.servingNote !== 'string'
      || !Array.isArray(form.ingredients) || !form.ingredients.every((item) => typeof item === 'string')) return null;
    return JSON.stringify({ name: form.name, ingredients: form.ingredients, preparation: form.preparation, servingNote: form.servingNote });
  } catch {
    return null;
  }
}

export function isCurrentRecommendation(
  suggestion: SavedSuggestion, profile: ChildProfile, meal: Meal | undefined,
  review?: AfterMealReview | null,
): boolean {
  const evidence = suggestion.recommendation;
  if (!evidence || evidence.kind !== 'small-separate-portion' || !meal
    || suggestion.childId !== profile.id || meal.childId !== profile.id
    || meal.id !== evidence.mealId || !hasVerifiedNoRestrictions(profile)) return false;
  const food = meal.foods.find((item) => item.id === evidence.foodId);
  const recordedFormKey = normalizedFoodFormKey(evidence.foodFormKey);
  if (!food || food.name !== evidence.foodName || !hasKnownFoodForm(food)
    || foodFormKey(food) !== recordedFormKey
    || suggestion.ingredients.length !== food.ingredients.length
    || suggestion.ingredients.some((ingredient, index) => ingredient !== food.ingredients[index])) return false;
  if (review) {
    const outcome = review.outcomes.find((item) => item.foodId === food.id)?.decision.confirmed;
    if (review.childId !== profile.id || review.mealId !== meal.id
      || review.savedAt !== evidence.reviewSavedAt || outcome !== evidence.outcome
      || normalizedFoodFormKey(review.foodFormKeys?.[food.id]) !== recordedFormKey
      || (evidence.difficulty && !review.difficulties[food.id]?.some((tag) => tag.category === evidence.difficulty))) return false;
  }
  return true;
}
