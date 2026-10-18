// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import { readMeals } from './mealStorage';
import { readAfterMealReview } from './afterMealReviewStorage';

export async function readHomeMeals(childId: string) {
  const meals = await readMeals(childId);
  return Promise.all(meals.map(async meal => ({
    meal,
    reviewed: !!(await readAfterMealReview(childId, meal.id)),
  })));
}
