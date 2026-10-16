// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import type { Outcome } from '../../types/afterMealReview';
import type { FoodItem, FoodTraits, Meal } from '../../types/meal';

export type MealRecord = {
  id: string;
  mealDate: string;
  mealType: Meal['mealType'];
  setting: Meal['setting'];
  beforePhotoUri: string | null;
  foods: { name: string; ingredients: string[] }[];
  reviewStatus: 'awaiting_review' | 'reviewed';
};

export type FoodResponseCard = {
  foodId: string;
  name: string;
  ingredients: string[];
  traits: FoodTraits;
  history: FoodItem['history'];
  preparation: string;
  servingNote: string;
  outcome: Outcome | null;
  reasons: { category: string; value: string; note?: string }[];
  suggestion: { id: string; title: string; description: string; servingTip: string | null } | null;
};
