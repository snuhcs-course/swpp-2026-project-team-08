// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 입력 없는 첫 단계 식사 초안 저장 및 복원 방지
import type { MealDraft } from '../types/meal';
import { localDate } from '../util/date';

export function hasMealDraftInput(draft: MealDraft): boolean {
  if (draft.step !== 'details' || draft.mealType || draft.setting || draft.photo ||
      draft.foods.length || draft.editingFood || draft.suggestionLinks?.length || draft.savedMealId) return true;
  if (draft.initialMealDate) return draft.mealDate !== draft.initialMealDate;
  // Legacy generated IDs retain the creation time; unknown IDs are kept to avoid data loss.
  const timestamp = /^(\d{13})-/.exec(draft.id)?.[1];
  if (!timestamp) return true;
  return draft.mealDate !== localDate(new Date(Number(timestamp)));
}
