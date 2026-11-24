// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 입력 없는 첫 단계 식사 초안 저장 및 복원 방지
// AI-generated with GPT-6, 2026-11-17, reviewed by Haechan Jung
// Changed: 자동 유형 기본값을 사용자 초안 입력에서 제외

import type { MealDraft } from '../types/meal';
import { localDate } from '../util/date';

export function hasMealDraftInput(draft: MealDraft): boolean {
  const changedType = draft.initialMealType === undefined
    ? !!draft.mealType : draft.mealType !== draft.initialMealType;
  if (draft.step !== 'details' || changedType || draft.setting || draft.photo ||
      draft.foods.length || draft.editingFood || draft.suggestionLinks?.length || draft.savedMealId) return true;
  if (draft.initialMealDate) return draft.mealDate !== draft.initialMealDate;
  // Legacy generated IDs retain the creation time; unknown IDs are kept to avoid data loss.
  const timestamp = /^(\d{13})-/.exec(draft.id)?.[1];
  if (!timestamp) return true;
  return draft.mealDate !== localDate(new Date(Number(timestamp)));
}
