// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 응답·요청과 대문자 상태·사유 변환으로 재작성

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 추가 추천 응답 검증과 이전 서버 호환

// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 기존 추천 조리법 통합값을 미입력으로 변환
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 추천 음식명과 선택적 원본 ID를 읽고 식사별 생성 요청 제거

import type { DismissReason, Suggestion } from '../../types/suggestionRecord';
import {
  array, fromApiCookingMethod, fromApiEnum, id, nullable, object, text, timestamp, toApiEnum,
} from './values';

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
    mealId: nullable(dto.meal_id, id),
    foodId: nullable(dto.origin_food_id, id),
    foodName: text(dto.food_name),
    whatToTry: text(dto.what_to_try),
    whyThisMayHelp: text(dto.why_this_may_help),
    servingTip: nullable(dto.serving_tip, text),
    ingredients: array(dto.ingredients, text),
    cookingMethod: fromApiCookingMethod(dto.cooking_method),
    causes: text(dto.causes),
    status: fromApiEnum(dto.status, statuses),
    dismissReasons: array(dto.dismiss_reasons, (reason) => fromApiEnum(reason, dismissReasons)),
    savedAt: nullable(dto.saved_at, timestamp),
    createdAt: timestamp(dto.created_at),
  };
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
