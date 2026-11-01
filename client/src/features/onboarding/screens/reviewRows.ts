// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 행 이름 변경, 안심 음식 없음 표시 제거

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
    { step: 'vegetarian', title: s.onboarding.reviewVegetarian, value: listValue('vegetarian', draft.vegetarianRestrictions) },
    {
      step: 'safe-foods',
      title: s.onboarding.reviewSafeFoods,
      value: draft.safeFoods.length
        ? draft.safeFoods.map((food) => `${food.name} · ${food.preparation}`).join(', ')
        : s.common.notEntered,
    },
  ];
}
