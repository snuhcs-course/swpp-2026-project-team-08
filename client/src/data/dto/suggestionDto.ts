import type {
  DismissReason,
  Suggestion,
  SuggestionMealLink,
  SuggestionTarget,
} from '../../types/suggestionRecord';
import type { FoodSnapshotDto } from './reviewDto';
import { toFoodSnapshot } from './reviewDto';
import { array, choice, id, nullable, object, text, timestamp } from './values';

export type SuggestionDto = {
  id: string;
  user_id: string;
  meal_id: string;
  food_id: string;
  ingredient_id: string | null;
  food_snapshot: FoodSnapshotDto;
  what_to_try: string;
  why_this_may_help: string;
  serving_tip: string | null;
  status: Suggestion['status'];
  dismiss_reasons: DismissReason[];
  saved_at: string | null;
  created_at: string;
};
export type SuggestionMealLinkDto = {
  id: string;
  suggestion_id: string;
  meal_id: string;
  food_id: string;
  ingredient_id: string | null;
  feedback: SuggestionMealLink['feedback'];
  created_at: string;
  updated_at: string;
  suggestion: { what_to_try: string; why_this_may_help: string; serving_tip: string | null };
};
export type SuggestionGenerateDto = {
  targets: { food_id: string; ingredient_id: string | null }[];
};
export type SuggestionDecisionDto = {
  status: 'saved' | 'dismissed';
  dismiss_reasons: DismissReason[];
};

const statuses = ['pending', 'saved', 'dismissed'] as const;
const feedbackValues = ['helpful', 'not_helpful', 'not_sure'] as const;
const dismissReasons = [
  'restriction_conflict', 'disliked_food_or_form', 'food_preferences',
  'too_much_preparation', 'ingredient_unavailable', 'already_tried',
] as const;

export function toSuggestion(value: unknown): Suggestion {
  const dto = object(value);
  return {
    id: id(dto.id),
    userId: id(dto.user_id),
    mealId: id(dto.meal_id),
    foodId: id(dto.food_id),
    ingredientId: nullable(dto.ingredient_id, id),
    foodSnapshot: toFoodSnapshot(dto.food_snapshot),
    whatToTry: text(dto.what_to_try),
    whyThisMayHelp: text(dto.why_this_may_help),
    servingTip: nullable(dto.serving_tip, text),
    status: choice(dto.status, statuses),
    dismissReasons: array(dto.dismiss_reasons, (reason) => choice(reason, dismissReasons)),
    savedAt: nullable(dto.saved_at, timestamp),
    createdAt: timestamp(dto.created_at),
  };
}

export function toSuggestionMealLink(value: unknown): SuggestionMealLink {
  const dto = object(value);
  const suggestion = object(dto.suggestion);
  return {
    id: id(dto.id),
    suggestionId: id(dto.suggestion_id),
    mealId: id(dto.meal_id),
    foodId: id(dto.food_id),
    ingredientId: nullable(dto.ingredient_id, id),
    feedback: nullable(dto.feedback, (feedback) => choice(feedback, feedbackValues)),
    createdAt: timestamp(dto.created_at),
    updatedAt: timestamp(dto.updated_at),
    suggestion: {
      whatToTry: text(suggestion.what_to_try),
      whyThisMayHelp: text(suggestion.why_this_may_help),
      servingTip: nullable(suggestion.serving_tip, text),
    },
  };
}

export function toSuggestionGenerate(targets: SuggestionTarget[]): SuggestionGenerateDto {
  if (!targets.length) throw new Error('No suggestion targets');
  const values = targets.map((target) => ({
    food_id: id(target.foodId),
    ingredient_id: nullable(target.ingredientId, id),
  }));
  if (new Set(values.map((target) => `${target.food_id}:${target.ingredient_id ?? ''}`)).size !== values.length) {
    throw new Error('Duplicate suggestion target');
  }
  return { targets: values };
}

export function toSuggestionDecision(
  status: SuggestionDecisionDto['status'],
  reasons: DismissReason[] = [],
): SuggestionDecisionDto {
  const values = reasons.map((reason) => choice(reason, dismissReasons));
  if ((status === 'saved' && values.length) || (status === 'dismissed' && !values.length)
    || new Set(values).size !== values.length) throw new Error('Invalid suggestion decision');
  return { status, dismiss_reasons: values };
}
