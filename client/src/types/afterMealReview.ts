// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import type { MealPhoto } from './meal';

export const outcomeValues = ['eaten', 'tasted', 'untouched', 'unclear'] as const;
export type Outcome = (typeof outcomeValues)[number];
export type OutcomeDecision = { confirmed: Outcome | null; suggested: Outcome | null };
export type IngredientOutcome = { id: string; name: string; decision: OutcomeDecision; selected?: boolean };
export type FoodOutcome = {
  foodId: string;
  decision: OutcomeDecision;
  ingredients: IngredientOutcome[];
};

export const difficultyCategories = [
  'texture', 'tasteType', 'tasteIntensity', 'smell', 'color',
  'shape', 'visibility', 'temperature', 'notSure', 'pieceSize', 'arrangement',
] as const;
export type DifficultyCategory = (typeof difficultyCategories)[number];
export type DifficultyTag = {
  id: string;
  category: DifficultyCategory;
  value: string;
  note?: string;
  subcategory?: string;
};

export const reviewSteps = [
  'photo', 'preview', 'compare', 'comparing', 'comparison-error',
  'outcomes', 'difficulties', 'suggestions', 'complete',
] as const;
export type ReviewStep = (typeof reviewSteps)[number];
export type SuggestionFeedback = { tried: boolean };

export type AfterMealReviewDraft = {
  mealId: string;
  childId: string;
  step: ReviewStep;
  afterPhoto: MealPhoto | null;
  comparisonMethod: 'ai' | 'manual' | null;
  outcomes: FoodOutcome[];
  difficulties: Record<string, DifficultyTag[]>;
  difficultyInputs: Record<string, { category: DifficultyCategory | null; value: string; note: string; subcategory?: string }>;
  suggestionFeedback: Record<string, SuggestionFeedback>;
};

export type AfterMealReview = Omit<AfterMealReviewDraft, 'step' | 'difficultyInputs'> & {
  savedAt: string;
  foodFormKeys?: Record<string, string>;
};
