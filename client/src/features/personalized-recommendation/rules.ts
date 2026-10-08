import { foodFormKey, hasKnownFoodForm, hasVerifiedNoRestrictions } from '../../rules/recommendationSafety';
import type { AfterMealReview } from '../../types/afterMealReview';
import type { RecommendationEvidence } from '../../types/home';
import type { Meal } from '../../types/meal';
import type { ChildProfile } from '../../types/profile';

export type RecommendationCandidate = RecommendationEvidence & { id: string; childId: string; ingredients: string[] };
export type RecommendationResult = {
  status: 'ready' | 'safety-unverified' | 'no-safe-candidate' | 'meal-changed' | 'insufficient-evidence';
  candidates: RecommendationCandidate[];
};

function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildRecommendations(profile: ChildProfile, meal: Meal, review: AfterMealReview): RecommendationResult {
  if (profile.id !== meal.childId || review.childId !== profile.id || review.mealId !== meal.id
    || !hasVerifiedNoRestrictions(profile)) return { status: 'safety-unverified', candidates: [] };
  const verifiedForms = meal.foods.filter(hasKnownFoodForm);
  if (!verifiedForms.length) return { status: 'no-safe-candidate', candidates: [] };
  const knownFoods = verifiedForms.filter((food) => review.foodFormKeys?.[food.id] === foodFormKey(food));
  if (!knownFoods.length) return { status: 'meal-changed', candidates: [] };
  const candidates = knownFoods.flatMap((food): RecommendationCandidate[] => {
    const outcome = review.outcomes.find((entry) => entry.foodId === food.id)?.decision.confirmed;
    if (outcome !== 'tasted' && outcome !== 'untouched') return [];
    const formKey = foodFormKey(food);
    const presentationDifficulty = review.difficulties[food.id]?.find((tag) =>
      tag.category === 'shape' || tag.category === 'visibility');
    return [{
      id: `next:${meal.id}:${food.id}:${fingerprint(`${formKey}:${review.savedAt}`)}`,
      childId: profile.id,
      mealId: meal.id,
      foodId: food.id,
      foodName: food.name,
      foodFormKey: formKey,
      reviewSavedAt: review.savedAt,
      outcome,
      ...(presentationDifficulty ? { difficulty: presentationDifficulty.category as 'shape' | 'visibility' } : {}),
      kind: 'small-separate-portion',
      ingredients: [...food.ingredients],
    }];
  });
  return candidates.length
    ? { status: 'ready', candidates }
    : { status: knownFoods.length < verifiedForms.length ? 'meal-changed' : 'insufficient-evidence', candidates: [] };
}
