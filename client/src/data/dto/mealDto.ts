import type { Meal, MealDetail, MealDraft, FoodItem } from '../../types/mealRecord';
import type { MealReview } from '../../types/reviewRecord';
import type { SuggestionMealLink } from '../../types/suggestionRecord';
import type { IngredientDto, IngredientInputDto } from './ingredientDto';
import { toIngredient, toIngredientInput } from './ingredientDto';
import type { MealReviewDto } from './reviewDto';
import { toMealReview } from './reviewDto';
import type { SuggestionMealLinkDto } from './suggestionDto';
import { toSuggestionMealLink } from './suggestionDto';
import {
  acceptance, array, choice, cookingMethods, date, id, mealLocations,
  mealTypes, nullable, object, text, timestamp,
} from './values';

export type MealDto = {
  id: string;
  user_id: string;
  meal_date: string;
  meal_type: Meal['mealType'];
  setting: Meal['setting'];
  before_photo_uri: string | null;
  after_photo_uri: string | null;
  saved_at: string;
};
export type FoodItemDto = {
  id: string;
  meal_id: string;
  name: string;
  ingredients: IngredientDto[];
  cooking_method: FoodItem['cookingMethod'];
  serving_note: string | null;
  acceptance: number | null;
};
export type MealDetailDto = MealDto & {
  foods: FoodItemDto[];
  review: MealReviewDto | null;
  suggestion_links: SuggestionMealLinkDto[];
};
export type MealWriteDto = {
  meal_date: string;
  meal_type: Meal['mealType'];
  setting: Meal['setting'];
  before_photo_uri: string | null;
  foods: {
    id: string;
    name: string;
    ingredients: IngredientInputDto[];
    cooking_method: FoodItem['cookingMethod'];
    serving_note: string | null;
    acceptance: number | null;
  }[];
  suggestion_links: { suggestion_id: string; food_id: string; ingredient_id: string | null }[];
};
export type MealReviewResponseDto = MealReviewDto & { meal: MealDto };
export type MealReviewResponse = { meal: Meal; review: MealReview };

export function toMeal(value: unknown): Meal {
  const dto = object(value);
  return {
    id: id(dto.id),
    userId: id(dto.user_id),
    mealDate: date(dto.meal_date),
    mealType: choice(dto.meal_type, mealTypes),
    setting: choice(dto.setting, mealLocations),
    beforePhotoUri: nullable(dto.before_photo_uri, text),
    afterPhotoUri: nullable(dto.after_photo_uri, text),
    savedAt: timestamp(dto.saved_at),
  };
}

export function toFoodItem(value: unknown): FoodItem {
  const dto = object(value);
  return {
    id: id(dto.id),
    mealId: id(dto.meal_id),
    name: text(dto.name),
    ingredients: array(dto.ingredients, toIngredient),
    cookingMethod: nullable(dto.cooking_method, (method) => choice(method, cookingMethods)),
    servingNote: nullable(dto.serving_note, text),
    acceptance: acceptance(dto.acceptance),
  };
}

export function toMealDetail(value: unknown): MealDetail {
  const dto = object(value);
  const meal = toMeal(dto);
  const foods = array(dto.foods, toFoodItem);
  const suggestionLinks = array(dto.suggestion_links, toSuggestionMealLink);
  if (foods.some((food) => food.mealId !== meal.id)
    || suggestionLinks.some((link: SuggestionMealLink) => link.mealId !== meal.id)) {
    throw new Error('Mismatched meal detail');
  }
  return {
    ...meal,
    foods,
    review: nullable(dto.review, toMealReview),
    suggestionLinks,
  };
}

export function toMealWrite(draft: MealDraft): MealWriteDto {
  if (!draft.foods.length) throw new Error('Meal needs food');
  const foods = draft.foods.map((food) => ({
    id: id(food.id),
    name: text(food.name),
    ingredients: food.ingredients.map(toIngredientInput),
    cooking_method: nullable(food.cookingMethod, (method) => choice(method, cookingMethods)),
    serving_note: nullable(food.servingNote, text),
    acceptance: acceptance(food.acceptance),
  }));
  if (new Set(foods.map((food) => food.id)).size !== foods.length) {
    throw new Error('Duplicate meal food ID');
  }
  const foodIds = new Set(foods.map((food) => food.id));
  const suggestionLinks = draft.suggestionLinks.map((link) => ({
    suggestion_id: id(link.suggestionId),
    food_id: id(link.foodId),
    ingredient_id: nullable(link.ingredientId, id),
  }));
  if (suggestionLinks.some((link) => !foodIds.has(link.food_id))) {
    throw new Error('Suggestion link has no meal food');
  }
  return {
    meal_date: date(draft.mealDate),
    meal_type: choice(draft.mealType, mealTypes),
    setting: choice(draft.setting, mealLocations),
    before_photo_uri: nullable(draft.beforePhotoUri, text),
    foods,
    suggestion_links: suggestionLinks,
  };
}

export function toMealReviewResponse(value: unknown): MealReviewResponse {
  const dto = object(value);
  return { meal: toMeal(dto.meal), review: toMealReview(dto) };
}
