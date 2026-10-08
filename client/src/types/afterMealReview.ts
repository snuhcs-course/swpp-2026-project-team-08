import type { MealPhoto } from './meal';

export const outcomeValues = ['eaten', 'tasted', 'untouched', 'unclear'] as const;
export type Outcome = (typeof outcomeValues)[number];
export type OutcomeDecision = { confirmed: Outcome | null; suggested: Outcome | null };
export type IngredientOutcome = { id: string; name: string; decision: OutcomeDecision };
export type FoodOutcome = {
  foodId: string;
  decision: OutcomeDecision;
  ingredients: IngredientOutcome[];
};

export const difficultyCategories = [
  'texture', 'tasteType', 'tasteIntensity', 'smell', 'color',
  'shape', 'visibility', 'temperature', 'notSure',
] as const;
export type DifficultyCategory = (typeof difficultyCategories)[number];
export type DifficultyTag = {
  id: string;
  category: DifficultyCategory;
  value: string;
  note?: string;
};

export const reviewSteps = [
  'photo', 'preview', 'compare', 'comparing', 'comparison-error',
  'outcomes', 'difficulties', 'goal', 'suggestions', 'complete',
] as const;
export type ReviewStep = (typeof reviewSteps)[number];
export type GoalFeedback = 'achieved' | 'tried' | 'notYet' | null;
export type SuggestionFeedback = 'tried' | 'notTried';

export type AfterMealReviewDraft = {
  mealId: string;
  childId: string;
  step: ReviewStep;
  afterPhoto: MealPhoto | null;
  comparisonMethod: 'ai' | 'manual' | null;
  outcomes: FoodOutcome[];
  difficulties: Record<string, DifficultyTag[]>;
  difficultyInputs: Record<string, { category: DifficultyCategory | null; value: string; note: string }>;
  goalFeedback: GoalFeedback;
  suggestionFeedback: Record<string, SuggestionFeedback>;
};

export type AfterMealReview = Omit<AfterMealReviewDraft, 'step' | 'difficultyInputs'> & {
  savedAt: string;
  foodFormKeys?: Record<string, string>;
};
