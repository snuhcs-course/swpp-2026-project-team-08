// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식·재료 안의 리뷰 결과와 난이도 사유 문자열 목록 변환으로 재작성

import type {
  MealReview,
  MealReviewDraft,
  ReviewFoodResult,
  ReviewIngredientResult,
} from '../../types/reviewRecord';
import { fromDifficultyReason, toDifficultyReason } from './difficultyReasons';
import { toIngredient } from './ingredientDto';
import {
  acceptance, array, cookingMethods, fromApiEnum, id, nullable, object, text, toApiEnum,
} from './values';

export type MealReviewWriteDto = {
  after_photo_uri: string | null;
  food_results: {
    food_id: string;
    outcome: string;
    difficulty_reasons: string[];
    ingredient_outcomes: {
      ingredient_id: string;
      outcome: string | null;
      difficulty_reasons: string[];
    }[];
  }[];
};

const outcomes = ['eaten', 'tasted', 'untouched', 'unclear'] as const;

const reviewOutcome = (value: unknown) => nullable(value, (outcome) => fromApiEnum(outcome, outcomes));

/** 서버는 리뷰 결과를 음식·재료 안에 담는다. 모든 음식의 outcome 이 null 이면 아직 리뷰하지 않은 식사다. */
export function toMealReview(mealId: string, foods: unknown[]): MealReview | null {
  const parsed = foods.map(object);
  if (parsed.every((food) => food.outcome === null)) return null;
  const foodResults: ReviewFoodResult[] = parsed.map((food) => ({
    mealId,
    foodId: id(food.id),
    foodSnapshot: {
      name: text(food.name),
      ingredients: array(food.ingredients, toIngredient),
      cookingMethod: nullable(food.cooking_method, (method) => fromApiEnum(method, cookingMethods)),
      servingNote: nullable(food.serving_note, text),
      acceptance: acceptance(food.acceptance),
    },
    outcome: reviewOutcome(food.outcome),
    difficulties: array(food.difficulty_reasons, fromDifficultyReason),
  }));
  const ingredientResults: ReviewIngredientResult[] = parsed.flatMap((food) =>
    array(food.ingredients, object)
      .filter((ingredient) => ingredient.outcome !== null)
      .map((ingredient) => ({
        mealId,
        foodId: id(food.id),
        ingredientId: id(ingredient.id),
        outcome: reviewOutcome(ingredient.outcome),
        difficulties: array(ingredient.difficulty_reasons, fromDifficultyReason),
      })));
  return { foodResults, ingredientResults };
}

// 같은 사유가 두 번 들어가면 서버가 거절하므로 중복을 없앤다. 메모는 서버로 보내지 않는다.
const reasons = (difficulties: Parameters<typeof toDifficultyReason>[0][]) =>
  [...new Set(difficulties.map(toDifficultyReason))];

export function toMealReviewWrite(draft: MealReviewDraft): MealReviewWriteDto {
  return {
    after_photo_uri: nullable(draft.afterPhotoUri, text),
    food_results: draft.foodResults.map((food) => ({
      food_id: id(food.foodId),
      outcome: toApiEnum(food.outcome, outcomes),
      difficulty_reasons: reasons(food.difficulties),
      ingredient_outcomes: food.ingredientOutcomes.map((ingredient) => ({
        ingredient_id: id(ingredient.ingredientId),
        outcome: nullable(ingredient.outcome, (outcome) => toApiEnum(outcome, outcomes)),
        difficulty_reasons: reasons(ingredient.difficulties),
      })),
    })),
  };
}
