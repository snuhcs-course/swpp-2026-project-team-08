// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import type { AfterMealReview, FoodOutcome } from '../../types/afterMealReview';
import type { SavedSuggestion } from '../../types/home';
import type { FoodItem, Meal } from '../../types/meal';
import { apiRequest } from '../network/apiClient';
import { demoMealDetail, mergeDemoMealList } from './mealLogFixtures';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const mealSettings = ['home', 'restaurant', 'school', 'others'] as const;
export type MealReviewStatus = 'awaiting_review' | 'reviewed';
export type MealListItem = {
  id: string;
  mealDate: string;
  mealType: Meal['mealType'];
  setting: Meal['setting'];
  beforePhotoUri: string | null;
  foods: { name: string; ingredients: string[] }[];
  reviewStatus: MealReviewStatus;
};
export type MealCalendarDay = { date: string; count: number };
export type MealLogSuggestion = {
  id: string;
  foodId: string;
  title: string;
  description: string;
  servingTip: string | null;
  ingredients: string[];
};
export type MealLogReview = {
  afterPhotoUri: string;
  outcomes: FoodOutcome[];
  difficulties: AfterMealReview['difficulties'];
  goalFeedback: AfterMealReview['goalFeedback'];
  savedAt: string;
};
export type MealDetail = {
  id: string;
  childId: string;
  mealDate: string;
  mealType: Meal['mealType'];
  setting: Meal['setting'];
  beforePhotoUri: string | null;
  exposureFoodId: string | null;
  savedAt: string;
  foods: FoodItem[];
  review: MealLogReview | null;
  suggestions: MealLogSuggestion[];
};

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const isoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function asMealType(value: unknown): Meal['mealType'] {
  if (typeof value === 'string' && mealTypes.includes(value as Meal['mealType'])) return value as Meal['mealType'];
  throw new Error('Invalid meal type');
}
function asSetting(value: unknown): Meal['setting'] {
  if (typeof value === 'string' && mealSettings.includes(value as Meal['setting'])) return value as Meal['setting'];
  throw new Error('Invalid meal setting');
}

function parseListItem(value: unknown): MealListItem {
  if (!record(value) || typeof value.id !== 'string' || !isoDate(value.meal_date)
    || (value.before_photo_uri !== null && typeof value.before_photo_uri !== 'string')
    || (value.review_status !== 'awaiting_review' && value.review_status !== 'reviewed')
    || !Array.isArray(value.foods)) throw new Error('Invalid meal list item');
  return {
    id: value.id,
    mealDate: value.meal_date,
    mealType: asMealType(value.meal_type),
    setting: asSetting(value.setting),
    beforePhotoUri: value.before_photo_uri,
    reviewStatus: value.review_status,
    foods: value.foods.map((food) => {
      if (!record(food) || typeof food.name !== 'string' || !strings(food.ingredients)) {
        throw new Error('Invalid meal food summary');
      }
      return { name: food.name, ingredients: food.ingredients };
    }),
  };
}

function parseOutcome(value: unknown): FoodOutcome {
  if (!record(value) || typeof value.food_id !== 'string' || !record(value.decision) || !Array.isArray(value.ingredients)) {
    throw new Error('Invalid food outcome');
  }
  return {
    foodId: value.food_id,
    decision: value.decision as FoodOutcome['decision'],
    ingredients: value.ingredients.map((ingredient) => {
      if (!record(ingredient) || typeof ingredient.id !== 'string' || typeof ingredient.name !== 'string' || !record(ingredient.decision)) {
        throw new Error('Invalid ingredient outcome');
      }
      return { id: ingredient.id, name: ingredient.name, decision: ingredient.decision as FoodOutcome['decision'] };
    }),
  };
}

function parseFood(value: unknown): FoodItem {
  if (!record(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !strings(value.ingredients)
    || typeof value.preparation !== 'string' || typeof value.serving_note !== 'string' || !record(value.traits)
    || (value.source !== 'ai' && value.source !== 'parent')) throw new Error('Invalid meal food');
  return {
    id: value.id,
    name: value.name,
    ingredients: value.ingredients,
    preparation: value.preparation,
    servingNote: value.serving_note,
    traits: value.traits as FoodItem['traits'],
    history: (value.history as FoodItem['history']) ?? null,
    source: value.source,
  };
}

function parseDetail(value: unknown): MealDetail {
  if (!record(value) || typeof value.id !== 'string' || typeof value.child_id !== 'string' || !isoDate(value.meal_date)
    || (value.before_photo_uri !== null && typeof value.before_photo_uri !== 'string')
    || (value.exposure_food_id !== null && typeof value.exposure_food_id !== 'string')
    || typeof value.saved_at !== 'string' || !Array.isArray(value.foods) || !Array.isArray(value.suggestions)) {
    throw new Error('Invalid meal detail');
  }
  let review: MealLogReview | null = null;
  if (value.review !== null) {
    if (!record(value.review) || typeof value.review.after_photo_uri !== 'string' || !Array.isArray(value.review.outcomes)
      || !record(value.review.difficulties) || typeof value.review.saved_at !== 'string') {
      throw new Error('Invalid meal review');
    }
    review = {
      afterPhotoUri: value.review.after_photo_uri,
      outcomes: value.review.outcomes.map(parseOutcome),
      difficulties: value.review.difficulties as AfterMealReview['difficulties'],
      goalFeedback: (value.review.goal_feedback as AfterMealReview['goalFeedback']) ?? null,
      savedAt: value.review.saved_at,
    };
  }
  return {
    id: value.id,
    childId: value.child_id,
    mealDate: value.meal_date,
    mealType: asMealType(value.meal_type),
    setting: asSetting(value.setting),
    beforePhotoUri: value.before_photo_uri,
    exposureFoodId: value.exposure_food_id,
    savedAt: value.saved_at,
    foods: value.foods.map(parseFood),
    review,
    suggestions: value.suggestions.map((item) => {
      if (!record(item) || typeof item.id !== 'string' || typeof item.food_id !== 'string' || typeof item.title !== 'string'
        || typeof item.description !== 'string' || !strings(item.ingredients)
        || (item.serving_tip !== null && typeof item.serving_tip !== 'string')) throw new Error('Invalid suggestion');
      return {
        id: item.id, foodId: item.food_id, title: item.title, description: item.description,
        servingTip: item.serving_tip, ingredients: item.ingredients,
      };
    }),
  };
}

const mealsPath = (childId: string) => `/api/v1/children/${encodeURIComponent(childId)}/meals`;

export function mealToUpsertBody(meal: Meal) {
  return {
    meal_date: meal.mealDate,
    meal_type: meal.mealType,
    setting: meal.setting,
    before_photo_uri: meal.photo?.uri ?? null,
    exposure_food_id: meal.exposureFoodId,
    saved_at: meal.savedAt,
    foods: meal.foods.map((food) => ({
      id: food.id,
      name: food.name,
      ingredients: food.ingredients,
      preparation: food.preparation,
      serving_note: food.servingNote,
      traits: food.traits,
      history: food.history,
      source: food.source,
    })),
  };
}

export function reviewToBody(review: AfterMealReview) {
  return {
    after_photo_uri: review.afterPhoto?.uri ?? '',
    outcomes: review.outcomes.map((food) => ({
      food_id: food.foodId,
      decision: food.decision,
      ingredients: food.ingredients,
    })),
    difficulties: review.difficulties,
    goal_feedback: review.goalFeedback,
    saved_at: review.savedAt,
  };
}

export function suggestionToBody(suggestion: SavedSuggestion) {
  return {
    id: suggestion.id,
    food_id: suggestion.recommendation?.foodId ?? '',
    title: suggestion.title,
    description: suggestion.description,
    serving_tip: suggestion.servingTip ?? null,
    ingredients: suggestion.ingredients,
  };
}

export const upsertMeal = async (meal: Meal): Promise<MealDetail> =>
  parseDetail(await apiRequest(`${mealsPath(meal.childId)}/${encodeURIComponent(meal.id)}`, {
    method: 'PUT',
    body: JSON.stringify(mealToUpsertBody(meal)),
  }));

export const listMeals = async (childId: string, date?: string | null): Promise<MealListItem[]> => {
  let remote: MealListItem[] = [];
  try {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const value = await apiRequest<unknown>(`${mealsPath(childId)}${query}`);
    if (!Array.isArray(value)) throw new Error('Invalid meal list');
    remote = value.map(parseListItem);
  } catch {
    remote = [];
  }
  return mergeDemoMealList(remote, date);
};

export const getMealCalendar = async (childId: string, month: string): Promise<MealCalendarDay[]> => {
  const meals = await listMeals(childId, null);
  const counts = new Map<string, number>();
  for (const meal of meals) {
    if (!meal.mealDate.startsWith(`${month}-`)) continue;
    counts.set(meal.mealDate, (counts.get(meal.mealDate) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
};

export const getMealDetail = async (childId: string, mealId: string): Promise<MealDetail> => {
  try {
    return parseDetail(await apiRequest(`${mealsPath(childId)}/${encodeURIComponent(mealId)}`));
  } catch (error) {
    const demo = demoMealDetail(childId, mealId);
    if (demo) return demo;
    throw error;
  }
};

export const saveMealReview = async (review: AfterMealReview): Promise<MealDetail> =>
  parseDetail(await apiRequest(`${mealsPath(review.childId)}/${encodeURIComponent(review.mealId)}/review`, {
    method: 'PUT',
    body: JSON.stringify(reviewToBody(review)),
  }));

export const saveMealSuggestion = async (suggestion: SavedSuggestion): Promise<MealLogSuggestion> => {
  const mealId = suggestion.recommendation?.mealId;
  if (!mealId) throw new Error('Suggestion is missing meal id');
  const value = await apiRequest<unknown>(`${mealsPath(suggestion.childId)}/${encodeURIComponent(mealId)}/suggestions`, {
    method: 'POST',
    body: JSON.stringify(suggestionToBody(suggestion)),
  });
  if (!record(value) || typeof value.id !== 'string' || typeof value.food_id !== 'string') throw new Error('Invalid suggestion');
  return {
    id: value.id,
    foodId: value.food_id,
    title: String(value.title),
    description: String(value.description),
    servingTip: typeof value.serving_tip === 'string' ? value.serving_tip : null,
    ingredients: strings(value.ingredients) ? value.ingredients : [],
  };
};

export const deleteMeal = (childId: string, mealId: string): Promise<void> =>
  apiRequest(`${mealsPath(childId)}/${encodeURIComponent(mealId)}`, { method: 'DELETE' });
