// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 응답·요청과 대문자 상태·사유 변환으로 재작성

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 추가 추천 응답 검증과 이전 서버 호환

// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 기존 추천 조리법 통합값을 미입력으로 변환
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 음식명·원본 ID 변환과 사유 없는 제외 지원
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 홈 추천 응답의 준비 방법 필드 변환

import type { DismissReason, Suggestion } from '../../types/suggestionRecord';
import {
  array, fromApiEnum, id, nullable, object, text, timestamp, toApiEnum,
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
    whatToTry: text(dto.what_to_try),
    whyThisMayHelp: text(dto.why_this_may_help),
    ingredients: array(dto.ingredients, text),
    preparationMethod: nullable(dto.preparation_method, text),
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
  if ((status === 'saved' && values.length) || new Set(values).size !== values.length) {
    throw new Error('Invalid suggestion decision');
  }
  return { status: toApiEnum(status, ['saved', 'dismissed'] as const) as 'SAVED' | 'DISMISSED', dismiss_reasons: values };
}
