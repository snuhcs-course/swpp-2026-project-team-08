// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import type { Language, SafeFood } from '../../types/profile';
import { copyFor, labelFor, type OptionGroup } from '../../util/strings';
import { validEmail } from '../onboarding/rules';

export function optionSummary(ids: string[], group: OptionGroup, language: Language): string {
  const labels = ids
    .filter((id) => id && id !== 'none')
    .map((id) => labelFor(group, id, language));
  return labels.length ? labels.join(', ') : copyFor(language).myPage.nothing;
}

export function safetySummary(allergies: string[], restrictions: string[], language: Language): string {
  const labels = [
    ...allergies.filter((id) => id && id !== 'none').map((id) => labelFor('allergies', id, language)),
    ...restrictions.filter((id) => id && id !== 'none').map((id) => labelFor('restrictions', id, language)),
  ];
  return labels.length ? labels.join(', ') : copyFor(language).myPage.nothing;
}

export function familySummary(familyFoods: string[], language: Language): string {
  return optionSummary(familyFoods, 'family', language);
}

export function safeFoodSummary(foods: SafeFood[], noSafeFoods: boolean, language: Language): string {
  if (noSafeFoods || !foods.length) return copyFor(language).myPage.nothing;
  return foods.map((food) => {
    const detail = [food.preparation, food.presentationNote].filter((value) => value.trim()).join(', ');
    return detail ? `${food.name} (${detail})` : food.name;
  }).join('\n');
}

export function caregiverLine(name: string, email: string): string {
  if (name.trim() && email.trim()) return `${name.trim()} - ${email.trim()}`;
  return name.trim() || email.trim();
}

export function canSendEmailCode(current: string, next: string): boolean {
  const email = next.trim();
  return validEmail(email) && email.toLocaleLowerCase() !== current.trim().toLocaleLowerCase();
}
