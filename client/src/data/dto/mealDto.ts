// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 대문자 enum·서버 발급 id·음식 안 리뷰와 추천 시도 기준으로 변환 재작성

import type { Meal, MealDetail, MealDraft, FoodItem } from '../../types/mealRecord';
import type { SuggestionMealLink } from '../../types/suggestionRecord';
import type { IngredientInputDto } from './ingredientDto';
import { toIngredient, toIngredientInput } from './ingredientDto';
import { toMealReview } from './reviewDto';
import {
  acceptance, array, cookingMethods, date, fromApiEnum, id, mealLocations,
  mealTypes, nullable, object, text, timestamp, toApiEnum,
} from './values';

export type MealFoodWriteDto = {
  name: string;
  ingredients: IngredientInputDto[];
  cooking_method: string | null;
  serving_note: string | null;
  acceptance: number | null;
};
export type MealWriteDto = {
  meal_date: string;
  meal_type: string;
  setting: string;
  before_photo_uri: string | null;
  foods: (MealFoodWriteDto & { food_recommendation_ids: string[] })[];
};

const feedbackValues = ['helpful', 'not_helpful', 'not_sure'] as const;

export function toMeal(value: unknown): Meal {
  const dto = object(value);
  return {
    id: id(dto.id),
    userId: id(dto.user_id),
    mealDate: date(dto.meal_date),
    mealType: fromApiEnum(dto.meal_type, mealTypes),
    setting: fromApiEnum(dto.setting, mealLocations),
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
    cookingMethod: nullable(dto.cooking_method, (method) => fromApiEnum(method, cookingMethods)),
    servingNote: nullable(dto.serving_note, text),
    acceptance: acceptance(dto.acceptance),
  };
}

function toSuggestionMealLink(mealId: string, foodId: string, value: unknown): SuggestionMealLink {
  const dto = object(value);
  const suggestion = object(dto.recommendation);
  return {
    id: id(dto.id),
    suggestionId: id(dto.food_recommendation_id),
    mealId,
    foodId,
    // 서버의 추천 시도는 음식 단위라 재료 연결이 없다.
    ingredientId: null,
    feedback: nullable(dto.feedback, (feedback) => fromApiEnum(feedback, feedbackValues)),
    createdAt: timestamp(dto.created_at),
    updatedAt: timestamp(dto.updated_at),
    suggestion: {
      whatToTry: text(suggestion.what_to_try),
      whyThisMayHelp: text(suggestion.why_this_may_help),
      servingTip: nullable(suggestion.serving_tip, text),
    },
  };
}

/** 식사 상세 응답을 앱의 식사 기록으로 바꾼다. 리뷰와 추천 시도는 음식 안에서 모은다. */
export function toMealDetail(value: unknown): MealDetail {
  const dto = object(value);
  const meal = toMeal(dto);
  const rawFoods = array(dto.foods, object);
  const foods = rawFoods.map(toFoodItem);
  if (foods.some((food) => food.mealId !== meal.id)) throw new Error('Mismatched meal detail');
  return {
    ...meal,
    foods,
    review: toMealReview(meal.id, rawFoods),
    suggestionLinks: rawFoods.flatMap((food) =>
      array(food.recommendation_tries, (attempt) =>
        toSuggestionMealLink(meal.id, id(food.id), attempt))),
  };
}

export function toMealWrite(draft: MealDraft): MealWriteDto {
  if (!draft.foods.length) throw new Error('Meal needs food');
  const foodIds = new Set(draft.foods.map((food) => food.id));
  if (foodIds.size !== draft.foods.length) throw new Error('Duplicate meal food ID');
  if (draft.suggestionLinks.some((link) => !foodIds.has(link.foodId))) {
    throw new Error('Suggestion link has no meal food');
  }
  return {
    meal_date: date(draft.mealDate),
    meal_type: toApiEnum(draft.mealType, mealTypes),
    setting: toApiEnum(draft.setting, mealLocations),
    before_photo_uri: nullable(draft.beforePhotoUri, text),
    foods: draft.foods.map((food) => ({
      ...toMealFoodWrite(food),
      // 추천 시도는 음식 단위로 보낸다. 새 음식은 저장 전에 서버 id 가 없으므로 음식 안에 담는다.
      food_recommendation_ids: draft.suggestionLinks
        .filter((link) => link.foodId === food.id)
        .map((link) => id(link.suggestionId)),
    })),
  };
}

export function toMealFoodWrite(food: MealDraft['foods'][number]): MealFoodWriteDto {
  return {
    name: text(food.name),
    ingredients: food.ingredients.map(toIngredientInput),
    cooking_method: nullable(food.cookingMethod, (method) => toApiEnum(method, cookingMethods)),
    serving_note: nullable(food.servingNote, text),
    acceptance: acceptance(food.acceptance),
  };
}
