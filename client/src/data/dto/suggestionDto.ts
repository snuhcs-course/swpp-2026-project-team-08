// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 응답·요청과 대문자 상태·사유 변환으로 재작성

import type {
  DismissReason,
  Suggestion,
  SuggestionTarget,
} from '../../types/suggestionRecord';
import {
  array, cookingMethods, fromApiEnum, id, nullable, object, text, timestamp, toApiEnum,
} from './values';

export type SuggestionGenerateDto = {
  targets: { food_id: string }[];
};
export type SuggestionDecisionDto = {
  status: 'SAVED' | 'DISMISSED';
  dismiss_reasons: string[];
};

const statuses = ['pending', 'saved', 'dismissed', 'tried'] as const;
const dismissReasons = [
  'restriction', 'dislike', 'not_fit', 'too_much_preparation',
  'ingredient_hard_to_get', 'already_tried',
] as const;

export function toSuggestion(value: unknown): Suggestion {
  const dto = object(value);
  return {
    id: id(dto.id),
    userId: id(dto.user_id),
    mealId: id(dto.meal_id),
    foodId: id(dto.origin_food_id),
    whatToTry: text(dto.what_to_try),
    whyThisMayHelp: text(dto.why_this_may_help),
    servingTip: nullable(dto.serving_tip, text),
    ingredients: array(dto.ingredients, text),
    cookingMethod: fromApiEnum(dto.cooking_method, cookingMethods),
    causes: text(dto.causes),
    status: fromApiEnum(dto.status, statuses),
    dismissReasons: array(dto.dismiss_reasons, (reason) => fromApiEnum(reason, dismissReasons)),
    savedAt: nullable(dto.saved_at, timestamp),
    createdAt: timestamp(dto.created_at),
  };
}

export function toSuggestionGenerate(targets: SuggestionTarget[]): SuggestionGenerateDto {
  if (!targets.length) throw new Error('No suggestion targets');
  const values = targets.map((target) => ({ food_id: id(target.foodId) }));
  if (new Set(values.map((target) => target.food_id)).size !== values.length) {
    throw new Error('Duplicate suggestion target');
  }
  return { targets: values };
}

export function toSuggestionDecision(
  status: 'saved' | 'dismissed',
  reasons: DismissReason[] = [],
): SuggestionDecisionDto {
  const values = reasons.map((reason) => toApiEnum(reason, dismissReasons));
  if ((status === 'saved' && values.length) || (status === 'dismissed' && !values.length)
    || new Set(values).size !== values.length) throw new Error('Invalid suggestion decision');
  return { status: toApiEnum(status, ['saved', 'dismissed'] as const) as 'SAVED' | 'DISMISSED', dismiss_reasons: values };
}
