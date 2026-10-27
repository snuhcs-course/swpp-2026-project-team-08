// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// // Changed: 마이페이지·자녀 프로필 추가

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
    allergies: [], restrictions: [], familyFoods: [],
    safeFoods: [], noSafeFoods: false,
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
