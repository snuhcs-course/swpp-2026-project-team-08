import type { FoodSnapshot } from './reviewRecord';
import type { Id, IngredientId, TimestampString } from './recordValues';

export type SuggestionStatus = 'pending' | 'saved' | 'dismissed';
export type SuggestionFeedback = 'helpful' | 'not_helpful' | 'not_sure';
export type DismissReason =
  | 'restriction_conflict'
  | 'disliked_food_or_form'
  | 'food_preferences'
  | 'too_much_preparation'
  | 'ingredient_unavailable'
  | 'already_tried';

export type LinkedSuggestion = {
  whatToTry: string;
  whyThisMayHelp: string;
  servingTip: string | null;
};

export type SuggestionMealLink = {
  id: Id;
  suggestionId: Id;
  mealId: Id;
  foodId: Id;
  ingredientId: IngredientId | null;
  feedback: SuggestionFeedback | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
  suggestion: LinkedSuggestion;
};

export type Suggestion = {
  id: Id;
  userId: Id;
  mealId: Id;
  foodId: Id;
  ingredientId: IngredientId | null;
  foodSnapshot: FoodSnapshot;
  whatToTry: string;
  whyThisMayHelp: string;
  servingTip: string | null;
  status: SuggestionStatus;
  dismissReasons: DismissReason[];
  savedAt: TimestampString | null;
  createdAt: TimestampString;
};

export type SuggestionTarget = {
  foodId: Id;
  ingredientId: IngredientId | null;
};
