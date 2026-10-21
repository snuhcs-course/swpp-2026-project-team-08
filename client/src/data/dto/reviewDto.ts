import type {
  Difficulty,
  FoodSnapshot,
  MealReview,
  MealReviewDraft,
  ReviewFoodResult,
  ReviewIngredientResult,
} from '../../types/reviewRecord';
import { toIngredient } from './ingredientDto';
import { acceptance, array, choice, cookingMethods, id, nullable, object, text } from './values';

export type DifficultyDto = { category: Difficulty['category']; subcategory: string | null; value: string };
export type FoodSnapshotDto = {
  name: string;
  ingredients: { id: string; name: string }[];
  cooking_method: FoodSnapshot['cookingMethod'];
  serving_note: string | null;
  acceptance: number | null;
};
export type ReviewFoodResultDto = {
  meal_id: string;
  food_id: string;
  food_snapshot: FoodSnapshotDto;
  outcome: ReviewFoodResult['outcome'];
  difficulties: DifficultyDto[];
};
export type ReviewIngredientResultDto = {
  meal_id: string;
  food_id: string;
  ingredient_id: string;
  outcome: ReviewIngredientResult['outcome'];
  difficulties: DifficultyDto[];
};
export type MealReviewDto = {
  food_results: ReviewFoodResultDto[];
  ingredient_results: ReviewIngredientResultDto[];
};
export type MealReviewWriteDto = {
  after_photo_uri: string | null;
  food_results: {
    food_id: string;
    outcome: ReviewFoodResult['outcome'];
    difficulties: DifficultyDto[];
    ingredient_outcomes: {
      ingredient_id: string;
      outcome: ReviewIngredientResult['outcome'];
      difficulties: DifficultyDto[];
    }[];
  }[];
};

const outcomes = ['eaten', 'tasted', 'untouched', 'unclear'] as const;
const difficultyCategories = [
  'texture', 'tasteType', 'tasteIntensity', 'smell', 'color', 'shape', 'visibility',
  'temperature', 'notSure', 'pieceSize', 'arrangement',
] as const;

export function toDifficulty(value: unknown): Difficulty {
  const dto = object(value);
  return {
    category: choice(dto.category, difficultyCategories),
    subcategory: nullable(dto.subcategory, text),
    value: text(dto.value),
  };
}

export function toFoodSnapshot(value: unknown): FoodSnapshot {
  const dto = object(value);
  return {
    name: text(dto.name),
    ingredients: array(dto.ingredients, toIngredient),
    cookingMethod: nullable(dto.cooking_method, (method) => choice(method, cookingMethods)),
    servingNote: nullable(dto.serving_note, text),
    acceptance: acceptance(dto.acceptance),
  };
}

export function toReviewFoodResult(value: unknown): ReviewFoodResult {
  const dto = object(value);
  return {
    mealId: id(dto.meal_id),
    foodId: id(dto.food_id),
    foodSnapshot: toFoodSnapshot(dto.food_snapshot),
    outcome: nullable(dto.outcome, (outcome) => choice(outcome, outcomes)),
    difficulties: array(dto.difficulties, toDifficulty),
  };
}

export function toReviewIngredientResult(value: unknown): ReviewIngredientResult {
  const dto = object(value);
  return {
    mealId: id(dto.meal_id),
    foodId: id(dto.food_id),
    ingredientId: id(dto.ingredient_id),
    outcome: nullable(dto.outcome, (outcome) => choice(outcome, outcomes)),
    difficulties: array(dto.difficulties, toDifficulty),
  };
}

export function toMealReview(value: unknown): MealReview {
  const dto = object(value);
  return {
    foodResults: array(dto.food_results, toReviewFoodResult),
    ingredientResults: array(dto.ingredient_results, toReviewIngredientResult),
  };
}

export function toMealReviewWrite(draft: MealReviewDraft): MealReviewWriteDto {
  return {
    after_photo_uri: nullable(draft.afterPhotoUri, text),
    food_results: draft.foodResults.map((food) => ({
      food_id: id(food.foodId),
      outcome: nullable(food.outcome, (outcome) => choice(outcome, outcomes)),
      difficulties: food.difficulties.map(toDifficultyWrite),
      ingredient_outcomes: food.ingredientOutcomes.map((ingredient) => ({
        ingredient_id: id(ingredient.ingredientId),
        outcome: nullable(ingredient.outcome, (outcome) => choice(outcome, outcomes)),
        difficulties: ingredient.difficulties.map(toDifficultyWrite),
      })),
    })),
  };
}

function toDifficultyWrite(difficulty: Difficulty): DifficultyDto {
  return {
    category: choice(difficulty.category, difficultyCategories),
    subcategory: nullable(difficulty.subcategory, text),
    value: text(difficulty.value),
  };
}
