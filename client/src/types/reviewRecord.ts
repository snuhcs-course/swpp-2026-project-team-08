// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버가 받지 않는 난이도 카테고리 제거

import type { Ingredient } from './ingredientRecord';
import type { CookingMethod, Id, IngredientId } from './recordValues';

export type Outcome = 'eaten' | 'tasted' | 'untouched' | 'unclear';
export type DifficultyCategory =
  | 'texture'
  | 'tasteType'
  | 'smell'
  | 'color'
  | 'temperature'
  | 'notSure'
  | 'pieceSize'
  | 'arrangement';

export type Difficulty = {
  category: DifficultyCategory;
  subcategory: string | null;
  value: string;
};

export type FoodSnapshot = {
  name: string;
  ingredients: Ingredient[];
  cookingMethod: CookingMethod | null;
  servingNote: string | null;
  acceptance: number | null;
};

export type ReviewFoodResult = {
  mealId: Id;
  foodId: Id;
  foodSnapshot: FoodSnapshot;
  outcome: Outcome | null;
  difficulties: Difficulty[];
};

export type ReviewIngredientResult = {
  mealId: Id;
  foodId: Id;
  ingredientId: IngredientId;
  outcome: Outcome | null;
  difficulties: Difficulty[];
};

export type MealReview = {
  foodResults: ReviewFoodResult[];
  ingredientResults: ReviewIngredientResult[];
};

export type IngredientReviewDraft = {
  ingredientId: IngredientId;
  outcome: Outcome | null;
  difficulties: Difficulty[];
};

export type FoodReviewDraft = {
  foodId: Id;
  outcome: Outcome | null;
  difficulties: Difficulty[];
  ingredientOutcomes: IngredientReviewDraft[];
};

export type MealReviewDraft = {
  afterPhotoUri: string | null;
  foodResults: FoodReviewDraft[];
};
