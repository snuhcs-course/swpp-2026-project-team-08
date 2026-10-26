import { apiRequest } from '../network/apiClient';
import { isUserId, type AuthUser } from '../storage/authStorage';
import type { ChildProfile } from '../../types/profile';
import { optionsFor, type OptionGroup } from '../../util/strings';

type Choice = { code: string | null; custom_name: string | null };
type ConsentKind = 'account_privacy' | 'photo_analysis' | 'ai_training';
type Consent = { kind: ConsentKind; granted: boolean };

type ProfileResponse = {
  user_id: string;
  child_name: string;
  age_group: string;
  safety: {
    allergies: { status: string; items: Choice[] };
    restrictions: { status: string; items: Choice[] };
  };
  food_preferences: {
    family_foods: Choice[];
    difficult_textures: Choice[];
    smell_sensitivity: string | null;
    difficult_tastes: Choice[];
    presentation_preferences: Choice[];
    preferred_temperature: string | null;
    new_food_response: string | null;
  };
  safe_foods: {
    status: string;
    items: { id: string; name: string; preparation: string; presentation_note: string | null }[];
  };
  updated_at: string;
};

export type OnboardingResponse = {
  profile: ProfileResponse | null;
  consents: (Consent & { id: string; user_id: string; document_version: string; recorded_at: string })[];
};

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function choiceItems(value: unknown): value is Choice[] {
  return Array.isArray(value) && value.every((item) => record(item)
    && ((typeof item.code === 'string' && item.custom_name === null)
      || (item.code === null && typeof item.custom_name === 'string')));
}

function parseResponse(value: unknown): OnboardingResponse {
  if (!record(value) || !Array.isArray(value.consents)) throw new Error('Invalid onboarding response');
  if (!value.consents.every((item: unknown) => record(item) && isUserId(item.id)
    && isUserId(item.user_id) && typeof item.kind === 'string'
    && typeof item.granted === 'boolean' && typeof item.document_version === 'string'
    && typeof item.recorded_at === 'string')) throw new Error('Invalid onboarding consents');
  if (value.profile === null) return value as OnboardingResponse;
  const profile = value.profile;
  if (!record(profile) || !isUserId(profile.user_id) || typeof profile.child_name !== 'string'
    || typeof profile.age_group !== 'string' || typeof profile.updated_at !== 'string'
    || !record(profile.safety) || !record(profile.food_preferences) || !record(profile.safe_foods)) {
    throw new Error('Invalid onboarding profile');
  }
  const allergies = profile.safety.allergies;
  const restrictions = profile.safety.restrictions;
  const preferences = profile.food_preferences;
  const safeFoods = profile.safe_foods;
  if (!record(allergies) || !choiceItems(allergies.items)
    || !record(restrictions) || !choiceItems(restrictions.items)
    || !choiceItems(preferences.family_foods)
    || !choiceItems(preferences.difficult_textures) || !choiceItems(preferences.difficult_tastes)
    || !choiceItems(preferences.presentation_preferences) || !Array.isArray(safeFoods.items)
    || !safeFoods.items.every((food: unknown) => record(food) && isUserId(food.id)
      && typeof food.name === 'string' && typeof food.preparation === 'string')) {
    throw new Error('Invalid onboarding profile details');
  }
  return value as OnboardingResponse;
}

const knownOptions = (groups: OptionGroup[]) => new Set(
  groups.flatMap((group) => optionsFor(group, 'en').map((option) => option.id)),
);

function choices(values: string[], groups: OptionGroup[]): Choice[] {
  const known = knownOptions(groups);
  return values.filter((value) => value !== 'none').map((value) => known.has(value)
    ? { code: value, custom_name: null }
    : { code: null, custom_name: value });
}

function selected(values: Choice[]): string[] {
  return values.map((item) => item.code ?? item.custom_name).filter((value): value is string => !!value);
}

export function toOnboardingWrite(profile: ChildProfile) {
  const allergies = choices(profile.allergies, ['allergies', 'allergyCatalog']);
  const restrictions = choices(profile.restrictions, ['restrictions', 'restrictionCatalog']);
  return {
    profile: {
      child_name: profile.childName,
      age_group: profile.ageRange,
      safety: {
        allergies: { status: allergies.length ? 'specified' : 'none_known', items: allergies },
        restrictions: { status: restrictions.length ? 'specified' : 'none', items: restrictions },
      },
      food_preferences: {
        family_foods: choices(profile.familyFoods, ['family', 'familyCatalog']),
        difficult_textures: choices(profile.texture, ['texture']),
        smell_sensitivity: profile.smell || null,
        difficult_tastes: choices(profile.taste, ['taste']),
        presentation_preferences: choices(profile.presentation, ['presentation']),
        preferred_temperature: profile.temperature || null,
        new_food_response: profile.familiarity || null,
      },
      safe_foods: {
        status: profile.safeFoods.length ? 'listed' : 'none',
        items: profile.safeFoods.map((food) => ({
          ...(isUserId(food.id) ? { id: food.id } : {}),
          name: food.name,
          preparation: food.preparation,
          presentation_note: food.presentationNote || null,
        })),
      },
    },
    consents: [
      { kind: 'account_privacy', granted: profile.consent.accountPrivacy },
      { kind: 'photo_analysis', granted: profile.consent.photoAnalysis },
      { kind: 'ai_training', granted: profile.consent.aiTraining },
    ] satisfies Consent[],
  };
}

export function fromOnboardingResponse(
  response: OnboardingResponse,
  user: AuthUser,
): ChildProfile | null {
  const source = response.profile;
  if (!source) return null;
  if (source.user_id !== user.id) throw new Error('Onboarding profile belongs to another user');
  const latest = new Map(response.consents.map((item) => [item.kind, item.granted]));
  return {
    id: source.user_id,
    caregiverName: user.fullName,
    caregiverEmail: user.email,
    childName: source.child_name,
    ageRange: source.age_group,
    consent: {
      accountPrivacy: latest.get('account_privacy') ?? false,
      photoAnalysis: latest.get('photo_analysis') ?? false,
      aiTraining: latest.get('ai_training') ?? false,
    },
    allergies: source.safety.allergies.status === 'specified'
      ? selected(source.safety.allergies.items) : ['none'],
    restrictions: source.safety.restrictions.status === 'specified'
      ? selected(source.safety.restrictions.items) : ['none'],
    familyFoods: selected(source.food_preferences.family_foods),
    texture: selected(source.food_preferences.difficult_textures),
    smell: source.food_preferences.smell_sensitivity ?? '',
    taste: selected(source.food_preferences.difficult_tastes),
    presentation: selected(source.food_preferences.presentation_preferences),
    temperature: source.food_preferences.preferred_temperature ?? '',
    familiarity: source.food_preferences.new_food_response ?? '',
    safeFoods: source.safe_foods.items.map((food) => ({
      id: food.id, name: food.name, preparation: food.preparation,
      presentationNote: food.presentation_note ?? '',
    })),
    noSafeFoods: source.safe_foods.status === 'none',
    updatedAt: source.updated_at,
  };
}

export async function readOnboarding(): Promise<OnboardingResponse> {
  return parseResponse(await apiRequest<unknown>('/api/v1/onboarding'));
}

export async function writeOnboarding(profile: ChildProfile): Promise<OnboardingResponse> {
  return parseResponse(await apiRequest<unknown>('/api/v1/onboarding', {
    method: 'PUT',
    body: JSON.stringify(toOnboardingWrite(profile)),
  }));
}
