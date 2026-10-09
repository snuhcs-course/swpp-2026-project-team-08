import type { Outcome } from '../../types/afterMealReview';
import type { FoodItem, MealPhoto } from '../../types/meal';
import { ingredientId } from '../../rules/ingredientIds';

export type ComparisonSuggestion = { foodId: string; ingredientId?: string; outcome: Outcome };

/** Prototype response only; this function does not inspect image pixels or infer consumption. */
export async function compareMealPhotos({ mealId, before, after, foods, signal }: {
  mealId: string;
  before: MealPhoto;
  after: MealPhoto;
  foods: FoodItem[];
  signal: AbortSignal;
}): Promise<{ mealId: string; beforePhotoId: string; afterPhotoId: string; suggestions: ComparisonSuggestion[] }> {
  if (!mealId || !before.uri || !after.uri) throw new Error('A meal or photo is missing');
  if (signal.aborted) throw new Error('Cancelled');
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, 1200);
    const cancel = () => { clearTimeout(timer); reject(new Error('Cancelled')); };
    signal.addEventListener('abort', cancel, { once: true });
  });
  if (signal.aborted) throw new Error('Cancelled');
  return {
    mealId,
    beforePhotoId: before.id,
    afterPhotoId: after.id,
    suggestions: foods.flatMap((food) => {
      const occurrences = new Map<string, number>();
      return [
        { foodId: food.id, outcome: 'unclear' as const },
        ...food.ingredients.map((name) => {
          const normalized = name.trim().toLocaleLowerCase();
          const occurrence = occurrences.get(normalized) ?? 0;
          occurrences.set(normalized, occurrence + 1);
          return { foodId: food.id, ingredientId: ingredientId(food.id, name, occurrence), outcome: 'unclear' as const };
        }),
      ];
    }),
  };
}
