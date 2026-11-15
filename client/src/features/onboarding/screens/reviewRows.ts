// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 식생활 유형 및 선택 조리 방법 없는 익숙한 음식 요약
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 행 이름 변경, 안심 음식 없음 표시 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 검토 화면의 채식 행을 식생활 유형 행으로 되돌려 반영
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 명시적 음식 없음과 제공 설명 및 식이 제한 응답 상태 요약

import { dietaryPatternLabel } from '../../../util/dietaryPattern';
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
  const restrictionsValue = draft.restrictions.length
    ? draft.restrictions.map((value) => value === 'none'
      ? s.onboarding.reviewNone
      : labelFor('restrictions', value, language)).join(', ')
    : s.onboarding.reviewNotAnswered;

  return [
    { step: 'child', title: s.onboarding.reviewChild, value: `${draft.childName || s.common.notEntered} · ${selectedValue('age', draft.ageRange)}` },
    { step: 'allergies', title: s.onboarding.reviewSafety, value: `${s.onboarding.reviewAllergies}: ${listValue('allergies', draft.allergies)} · ${s.onboarding.titles.restrictions}: ${restrictionsValue}` },
    { step: 'family', title: s.onboarding.reviewFamily, value: dietaryPatternLabel(draft.dietaryPattern, language) },
    {
      step: 'safe-foods',
      title: s.onboarding.reviewSafeFoods,
      value: draft.noSafeFoods ? s.onboarding.noSafeFoods : draft.safeFoods.length
        ? draft.safeFoods.map((food) => [food.name, food.preparation, food.presentationNote].filter(Boolean).join(' · ')).join(', ')
        : s.common.notEntered,
    },
  ];
}
