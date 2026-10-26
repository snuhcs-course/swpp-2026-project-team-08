// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; matched onboarding Figma typography and spacing
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; revised for current ABC design
// This Code is generated with AI

import type { Language } from '../../../types/profile';
import { copyFor, labelFor, type OptionGroup } from '../../../util/strings';
import type { OnboardingDraft, OnboardingStep } from '../types';

export type ReviewRow = { step: OnboardingStep; title: string; value: string };

export function reviewRows(draft: OnboardingDraft, language: Language): ReviewRow[] {
  const s = copyFor(language);
  const listValue = (group: OptionGroup, values: string[]) => values.length
    ? values.map((value) => labelFor(group, value, language)).join(', ')
    : s.common.notEntered;
  const selectedValue = (group: OptionGroup, value: string) => value
    ? labelFor(group, value, language)
    : s.common.notEntered;

  return [
    { step: 'child', title: s.onboarding.reviewChild, value: `${draft.childName || s.common.notEntered} · ${selectedValue('age', draft.ageRange)}` },
    { step: 'allergies', title: s.onboarding.reviewSafety, value: `${s.onboarding.reviewAllergies}: ${listValue('allergies', draft.allergies)}${draft.restrictions.some((value) => value !== 'none') ? ` · ${s.onboarding.titles.restrictions}: ${listValue('restrictions', draft.restrictions)}` : ''}` },
    { step: 'family', title: s.onboarding.reviewFamily, value: listValue('family', draft.familyFoods) },
    {
      step: 'safe-foods',
      title: s.onboarding.reviewSafeFoods,
      value: draft.noSafeFoods
        ? s.onboarding.noSafeFoods
        : draft.safeFoods.length
          ? draft.safeFoods.map((food) => `${food.name} · ${food.preparation}`).join(', ')
          : s.common.notEntered,
    },
  ];
}
