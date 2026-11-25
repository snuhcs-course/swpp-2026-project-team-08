// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천(재료 id·음식 스냅샷 제거, 재료·조리법·원인 추가)과 새 상태·사유 값

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 추가 추천 가능 여부와 원본 관계 타입

// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 기존 추천의 조리법 미입력 허용
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 추천 음식명과 선택적 원본 ID 정의 및 식사별 생성 대상 제거

import type { CookingMethod, Id, TimestampString } from './recordValues';

export type SuggestionStatus = 'pending' | 'saved' | 'dismissed' | 'tried';
export type SuggestionFeedback = 'helpful' | 'not_helpful' | 'not_sure';
export type DismissReason =
  | 'restriction'
  | 'dislike'
  | 'not_fit'
  | 'too_much_preparation'
  | 'ingredient_hard_to_get'
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
  feedback: SuggestionFeedback | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
  suggestion: LinkedSuggestion;
};

export type Suggestion = {
  id: Id;
  userId: Id;
  mealId: Id | null;
  foodId: Id | null;
  foodName: string;
  whatToTry: string;
  whyThisMayHelp: string;
  servingTip: string | null;
  /** 제안하는 음식에 들어가는 재료 이름 */
  ingredients: string[];
  cookingMethod: CookingMethod | null;
  /** 식후 리뷰에서 참고한 특성(아이가 어려워한 원인)을 서술한 문장 */
  causes: string;
  status: SuggestionStatus;
  dismissReasons: DismissReason[];
  savedAt: TimestampString | null;
  createdAt: TimestampString;
};
