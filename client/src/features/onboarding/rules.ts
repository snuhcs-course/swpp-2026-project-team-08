// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 온보딩
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 온보딩 단계 간소화 및 감각 프로필 순서
// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 프로필 질문·초안 복원·식생활 유형 및 익숙한 음식의 선택 조리 방법
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 단계 선택 사항 처리, 직접 입력·카탈로그 규칙 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계 규칙을 새 프로필 구조 위에 반영
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 익숙한 음식 응답 필수 조건과 없음 초안 복원

// AI-generated with GPT-6, 2026-11-18, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 중복 검증

import { emptyDraft, isStep, type OnboardingDraft, type OnboardingStep } from './types';
import type { Language, SafeFood } from '../../types/profile';
import { cookingMethodIds } from '../../types/recordValues';
import { difficultyOptions, textureQuestions } from '../../util/difficultyOptions';
import { isDietaryPattern } from '../../util/dietaryPattern';
import { labelFor } from '../../util/strings';

export function validEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

export function validPassword(value: string): boolean {
  return value.length >= 8;
}

export function canAddSafeFood(input: OnboardingDraft['safeFoodInput'], foods: SafeFood[] = []): boolean {
  return !!input.name.trim() && !foods.some((food) =>
    food.name === input.name.trim()
    && food.preparation === input.preparation.trim()
    && food.presentationNote === input.presentationNote.trim());
}

export function toggleExclusive(values: string[], value: string, noneValue = 'none'): string[] {
  if (value === noneValue) return values.includes(noneValue) ? [] : [noneValue];
  const withoutNone = values.filter((item) => item !== noneValue);
  return withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value];
}

export function canContinue(step: OnboardingStep, draft: OnboardingDraft, password: string): boolean {
  switch (step) {
    case 'account': return !!draft.caregiverName.trim() && validEmail(draft.caregiverEmail) && validPassword(password);
    case 'consent': return draft.consent.accountPrivacy && draft.consent.photoAnalysis;
    case 'child': return !!draft.childName.trim() && !!draft.ageRange;
    case 'allergies': return draft.allergies.length > 0;
    case 'restrictions': return draft.restrictions.length > 0;
    case 'family': return draft.dietaryPattern == null || isDietaryPattern(draft.dietaryPattern);
    case 'safe-foods': return draft.noSafeFoods || draft.safeFoods.length > 0;
    default: return true;
  }
}

export function canFinish(draft: OnboardingDraft): boolean {
  return !!draft.caregiverName.trim()
    && validEmail(draft.caregiverEmail)
    && draft.consent.accountPrivacy && draft.consent.photoAnalysis
    && !!draft.childName.trim() && !!draft.ageRange
    && draft.allergies.length > 0
    && (draft.dietaryPattern == null || isDietaryPattern(draft.dietaryPattern));
}

export function matchingSafeFoods(draft: OnboardingDraft, language: Language): string[] {
  if (draft.noSafeFoods) return [];
  const restricted = [
    ...draft.allergies.filter((item) => item !== 'none').flatMap((item) => [labelFor('allergies', item, language), labelFor('allergies', item, 'en')]),
    ...draft.restrictions.filter((item) => item !== 'none').flatMap((item) => [labelFor('restrictions', item, language), labelFor('restrictions', item, 'en')]),
  ].map((item) => item.toLocaleLowerCase());
  return draft.safeFoods.filter((food) => {
    const description = `${food.name} ${food.preparation}`.toLocaleLowerCase();
    return restricted.some((item) => description.includes(item));
  }).map((food) => food.name);
}

function validRefusedFood(value: unknown, needsId: boolean): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const food = value as Record<string, unknown>;
  if (typeof food.name !== 'string' || (needsId && (typeof food.id !== 'string' || !food.id || !food.name.trim()))) return false;
  if (food.cookingMethod !== null && !(cookingMethodIds as readonly unknown[]).includes(food.cookingMethod)) return false;
  if (!Array.isArray(food.reasons)) return false;
  return food.reasons.every((reason: unknown) => {
    if (!reason || typeof reason !== 'object') return false;
    const item = reason as Record<string, unknown>;
    if (typeof item.category !== 'string' || typeof item.value !== 'string') return false;
    if (item.category === 'texture') return typeof item.subcategory === 'string'
      && !!textureQuestions[item.subcategory]?.includes(item.value);
    return item.subcategory === null && !!difficultyOptions[item.category as keyof typeof difficultyOptions]?.includes(item.value);
  });
}

export function isDraft(value: unknown): value is OnboardingDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  const consent = draft.consent && typeof draft.consent === 'object'
    ? draft.consent as Record<string, unknown> : null;
  const safeFoodInput = draft.safeFoodInput && typeof draft.safeFoodInput === 'object'
    ? draft.safeFoodInput as Record<string, unknown> : null;
  return typeof draft.step === 'string' && isStep(draft.step)
    && typeof draft.caregiverName === 'string'
    && typeof draft.caregiverEmail === 'string'
    && typeof draft.childName === 'string'
    && typeof draft.ageRange === 'string'
    && !!consent && typeof consent.accountPrivacy === 'boolean'
    && typeof consent.photoAnalysis === 'boolean' && typeof consent.aiTraining === 'boolean'
    && ['allergies', 'restrictions', 'vegetarianRestrictions', 'safeFoods']
      .every((key) => Array.isArray(draft[key]))
    && (draft.dietaryPattern == null || isDietaryPattern(draft.dietaryPattern))
    && Array.isArray(draft.sensoryTextures) && draft.sensoryTextures.every((item) => typeof item === 'string')
    && typeof draft.sensoryNote === 'string'
    && Array.isArray(draft.refusedFoods) && draft.refusedFoods.every((item) => validRefusedFood(item, true))
    && validRefusedFood(draft.refusedFoodInput, false)
    && typeof draft.noSafeFoods === 'boolean'
    && !!safeFoodInput && ['name', 'preparation', 'presentationNote'].every((key) => typeof safeFoodInput[key] === 'string');
}

export function restoreDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const stored = value as Record<string, unknown>;
  if (typeof stored.step !== 'string') return null;
  // 저장된 초안의 단계가 옛 이름(`vegetarian`)이거나 모르는 값이면 식생활 유형 단계에서 이어간다.
  const draft = {
    ...stored,
    dietaryPattern: stored.dietaryPattern ?? null,
    noSafeFoods: stored.noSafeFoods ?? false,
    refusedFoods: stored.refusedFoods ?? [],
    refusedFoodInput: stored.refusedFoodInput ?? { name: '', cookingMethod: null, reasons: [] },
    sensoryTextures: stored.sensoryTextures ?? [], sensoryNote: stored.sensoryNote ?? '',
    step: stored.step === 'restrictions' ? 'family' : stored.step === 'safe-foods' ? 'sensory' : isStep(stored.step) ? stored.step : 'family',
  };
  if (!isDraft(draft)) return null;
  return Object.fromEntries(
    Object.keys(emptyDraft()).map((key) => [key, draft[key as keyof OnboardingDraft]]),
  ) as OnboardingDraft;
}
