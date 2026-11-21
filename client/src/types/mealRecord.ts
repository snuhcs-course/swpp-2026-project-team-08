// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 연결로 재료 연결 제거

// AI-generated with GPT-6, 2026-11-17, reviewed by Haechan Jung
// Changed: 식사 장소 미응답 허용

import type { Ingredient, IngredientDraft } from './ingredientRecord';
import type { MealReview } from './reviewRecord';
import type { SuggestionMealLink } from './suggestionRecord';
import type {
  CookingMethod,
  DateString,
  Id,
  MealLocation,
  MealType,
  TimestampString,
} from './recordValues';

export type FoodItem = {
  id: Id;
  mealId: Id;
  name: string;
  ingredients: Ingredient[];
  cookingMethod: CookingMethod | null;
  servingNote: string | null;
  acceptance: number | null;
};

export type FoodDraft = {
  id: Id;
  name: string;
  ingredients: IngredientDraft[];
  cookingMethod: CookingMethod | null;
  servingNote: string | null;
  acceptance: number | null;
};

export type SuggestionLinkDraft = {
  suggestionId: Id;
  foodId: Id;
};

export type MealDraft = {
  mealDate: DateString;
  mealType: MealType;
  setting: MealLocation | null;
  beforePhotoUri: string | null;
  foods: FoodDraft[];
  suggestionLinks: SuggestionLinkDraft[];
};

export type Meal = {
  id: Id;
  userId: Id;
  mealDate: DateString;
  mealType: MealType;
  setting: MealLocation | null;
  beforePhotoUri: string | null;
  afterPhotoUri: string | null;
  savedAt: TimestampString;
};

export type MealDetail = Meal & {
  foods: FoodItem[];
  review: MealReview | null;
  suggestionLinks: SuggestionMealLink[];
};
