// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import { emptyDraft, isStep, type OnboardingDraft, type OnboardingStep } from './types';
import type { Language } from '../../types/profile';
import { labelFor } from '../../util/strings';

export function validEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

export function validPassword(value: string): boolean {
  return value.length >= 8;
}

export function canAddSafeFood(input: OnboardingDraft['safeFoodInput']): boolean {
  return !!input.name.trim() && !!input.preparation.trim();
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
    case 'family': return draft.familyFoods.length > 0;
    default: return true;
  }
}

export function canFinish(draft: OnboardingDraft): boolean {
  return !!draft.caregiverName.trim()
    && validEmail(draft.caregiverEmail)
    && draft.consent.accountPrivacy && draft.consent.photoAnalysis
    && !!draft.childName.trim() && !!draft.ageRange
    && draft.allergies.length > 0 && draft.restrictions.length > 0
    && draft.familyFoods.length > 0;
}

export function addUnique(values: string[], value: string): string[] {
  const normalized = value.trim();
  if (!normalized || values.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return values;
  return [...values.filter((item) => item !== 'none'), normalized];
}

export function matchingSafeFoods(draft: OnboardingDraft, language: Language): string[] {
  const restricted = [
    ...draft.allergies.filter((item) => item !== 'none').flatMap((item) => [item, labelFor('allergies', item, language), labelFor('allergyCatalog', item, language)]),
    ...draft.restrictions.filter((item) => item !== 'none').flatMap((item) => [item, labelFor('restrictions', item, language), labelFor('restrictionCatalog', item, language)]),
  ].map((item) => item.toLocaleLowerCase());
  return draft.safeFoods.filter((food) => {
    const description = `${food.name} ${food.preparation}`.toLocaleLowerCase();
    return restricted.some((item) => description.includes(item));
  }).map((food) => food.name);
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
    && ['allergies', 'restrictions', 'familyFoods', 'safeFoods']
      .every((key) => Array.isArray(draft[key]))
    && typeof draft.noSafeFoods === 'boolean'
    && !!safeFoodInput && ['name', 'preparation', 'presentationNote'].every((key) => typeof safeFoodInput[key] === 'string');
}

export function restoreDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const stored = value as Record<string, unknown>;
  if (typeof stored.step !== 'string') return null;
  const draft = { ...stored, step: isStep(stored.step) ? stored.step : 'family' };
  if (!isDraft(draft)) return null;
  return Object.fromEntries(
    Object.keys(emptyDraft()).map((key) => [key, draft[key as keyof OnboardingDraft]]),
  ) as OnboardingDraft;
}
