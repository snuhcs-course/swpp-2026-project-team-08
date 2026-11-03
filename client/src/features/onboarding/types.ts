// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 제외된 온보딩 질문 타입 제거; Dietary Pattern
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: family 단계를 vegetarian 으로 변경, 안심 음식 없음 플래그 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)를 새 프로필 구조(vegetarianRestrictions 보존) 위에 반영

import type { ChildProfile } from '../../types/profile';

export const steps = [
  'account', 'consent', 'child', 'allergies', 'restrictions', 'family',
  'safe-foods', 'review',
] as const;

export type OnboardingStep = (typeof steps)[number];

export type OnboardingDraft = Omit<ChildProfile, 'id' | 'updatedAt'> & {
  step: OnboardingStep;
  safeFoodInput: { name: string; preparation: string; presentationNote: string };
};

export function emptyDraft(): OnboardingDraft {
  return {
    step: 'account', caregiverName: '', caregiverEmail: '', childName: '', ageRange: '',
    consent: { accountPrivacy: false, photoAnalysis: false, aiTraining: false },
    allergies: [], restrictions: [], vegetarianRestrictions: [], dietaryPattern: null,
    safeFoods: [],
    safeFoodInput: { name: '', preparation: '', presentationNote: '' },
  };
}

export function isStep(value: string): value is OnboardingStep {
  return (steps as readonly string[]).includes(value);
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  return steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)];
}

export function previousStep(step: OnboardingStep): OnboardingStep {
  return steps[Math.max(steps.indexOf(step) - 1, 0)];
}
