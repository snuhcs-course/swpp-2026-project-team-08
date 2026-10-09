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
    traits: food.traits,
  });
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
  if (!food || food.name !== evidence.foodName || !hasKnownFoodForm(food)
    || foodFormKey(food) !== evidence.foodFormKey
    || suggestion.ingredients.length !== food.ingredients.length
    || suggestion.ingredients.some((ingredient, index) => ingredient !== food.ingredients[index])) return false;
  if (review) {
    const outcome = review.outcomes.find((item) => item.foodId === food.id)?.decision.confirmed;
    if (review.childId !== profile.id || review.mealId !== meal.id
      || review.savedAt !== evidence.reviewSavedAt || outcome !== evidence.outcome
      || review.foodFormKeys?.[food.id] !== evidence.foodFormKey
      || (evidence.difficulty && !review.difficulties[food.id]?.some((tag) => tag.category === evidence.difficulty))) return false;
  }
  return true;
}
