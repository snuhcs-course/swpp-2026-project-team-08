import type { AfterMealReview } from '../../types/afterMealReview';
import type { MealDetail } from '../../types/mealRecord';
import type { MealReviewDraft } from '../../types/reviewRecord';
import { ingredientId } from '../../rules/ingredientIds';
import { toMealReviewResponse } from '../dto/mealDto';
import { toMealReviewWrite } from '../dto/reviewDto';
import { apiRequest } from '../network/apiClient';

export function prepareReviewWrite(review: AfterMealReview, detail: MealDetail): MealReviewDraft {
  if (review.mealId !== detail.id || review.childId !== detail.userId) {
    throw new Error('Review does not match meal');
  }
  return {
    afterPhotoUri: review.afterPhoto?.uri ?? null,
    foodResults: detail.foods.map((food) => {
      const outcome = review.outcomes.find((item) => item.foodId === food.id);
      if (!outcome) throw new Error('Review food is missing');
      const occurrences = new Map<string, number>();
      const ingredientIds = new Map(food.ingredients.map((ingredient) => {
        const key = ingredient.name.trim().toLocaleLowerCase();
        const occurrence = occurrences.get(key) ?? 0;
        occurrences.set(key, occurrence + 1);
        return [ingredientId(food.id, ingredient.name, occurrence), ingredient.id];
      }));
      return {
        foodId: food.id,
        outcome: outcome.decision.confirmed,
        difficulties: (review.difficulties[food.id] ?? []).map((tag) => ({
          category: tag.category,
          subcategory: tag.subcategory ?? null,
          value: tag.note ? `${tag.value}: ${tag.note}` : tag.value,
        })),
        ingredientOutcomes: outcome.ingredients.map((item) => {
          const id = ingredientIds.get(item.id);
          if (!id) throw new Error('Review ingredient is missing');
          return { ingredientId: id, outcome: item.decision.confirmed, difficulties: [] };
        }),
      };
    }),
  };
}

export async function writeMealReview(
  review: AfterMealReview, detail: MealDetail,
): Promise<MealDetail> {
  const body = toMealReviewWrite(prepareReviewWrite(review, detail));
  const response = toMealReviewResponse(await apiRequest<unknown>(
    `/api/v1/meals/${encodeURIComponent(detail.id)}/review`,
    { method: 'PUT', body: JSON.stringify(body) },
  ));
  if (response.meal.id !== detail.id || response.meal.userId !== detail.userId) {
    throw new Error('Mismatched meal review response');
  }
  return { ...detail, ...response.meal, review: response.review };
}
