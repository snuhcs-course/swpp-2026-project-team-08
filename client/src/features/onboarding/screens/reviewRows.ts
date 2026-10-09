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
    { step: 'allergies', title: s.onboarding.reviewSafety, value: `${s.onboarding.titles.allergies}: ${listValue('allergies', draft.allergies)}` },
    { step: 'family', title: s.onboarding.reviewFamily, value: listValue('family', draft.familyFoods) },
    { step: 'approaches', title: s.onboarding.reviewApproaches, value: listValue('approaches', draft.approaches) },
    { step: 'texture', title: s.onboarding.reviewSensory, value: listValue('texture', draft.texture) },
    {
      step: 'safe-foods',
      title: s.onboarding.reviewSafeFoods,
      value: draft.noSafeFoods
        ? s.onboarding.noSafeFoods
        : draft.safeFoods.length
          ? draft.safeFoods.map((food) => `${food.name} · ${food.preparation}`).join(', ')
          : s.common.notEntered,
    },
    { step: 'child', title: s.onboarding.reviewChild, value: `${draft.childName || s.common.notEntered} · ${selectedValue('age', draft.ageRange)}` },
    { step: 'restrictions', title: s.onboarding.titles.restrictions, value: listValue('restrictions', draft.restrictions) },
    { step: 'presentation', title: s.onboarding.titles.presentation, value: listValue('presentation', draft.presentation) },
    { step: 'temperature', title: s.onboarding.titles.temperature, value: selectedValue('temperature', draft.temperature) },
    { step: 'taste', title: s.onboarding.titles.taste, value: listValue('taste', draft.taste) },
    { step: 'smell', title: s.onboarding.titles.smell, value: selectedValue('smell', draft.smell) },
    { step: 'familiarity', title: s.onboarding.reviewFamiliarity, value: selectedValue('familiarity', draft.familiarity) },
  ];
}
