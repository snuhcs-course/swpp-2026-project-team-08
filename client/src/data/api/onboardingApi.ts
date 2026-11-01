// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 계약으로 변환 로직 재작성

import { apiRequest } from '../network/apiClient';
import { isUserId, type AuthUser } from '../storage/authStorage';
import type { ChildProfile } from '../../types/profile';

type ConsentKind = 'ACCOUNT_PRIVACY' | 'PHOTO_ANALYSIS' | 'AI_TRAINING';
type Consent = { kind: ConsentKind; granted: boolean };

type ProfileResponse = {
  user_id: string;
  child_name: string;
  age_group: string;
  restrictions: string[];
  safe_foods: { id: string; name: string; preparation: string; presentation_note: string | null }[];
  updated_at: string;
};

export type OnboardingResponse = {
  profile: ProfileResponse | null;
  consents: (Consent & { id: string; user_id: string; document_version: string; recorded_at: string })[];
};

// 클라이언트 선택지 id 는 서버 RestrictionType 값에서 category 를 뺀 것과 같다.
// 서버 값은 `<CATEGORY>.<ID>` 이므로 전송할 때 category 만 붙이고, 받을 때 떼어 낸다.
const CATEGORY = {
  allergies: 'ALLERGY',
  restrictions: 'DIETARY_APPROACH',
  vegetarian: 'VEGETARIAN',
} as const;
type Group = keyof typeof CATEGORY;

const RESTRICTION_PATTERN = /^(ALLERGY|DIETARY_APPROACH|VEGETARIAN)\.[A-Z_]+$/;

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

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
    || !Array.isArray(profile.restrictions) || !Array.isArray(profile.safe_foods)) {
    throw new Error('Invalid onboarding profile');
  }
  if (!profile.restrictions.every((item: unknown) => typeof item === 'string' && RESTRICTION_PATTERN.test(item))
    || !profile.safe_foods.every((food: unknown) => record(food) && isUserId(food.id)
      && typeof food.name === 'string' && typeof food.preparation === 'string'
      && (food.presentation_note === null || typeof food.presentation_note === 'string'))) {
    throw new Error('Invalid onboarding profile details');
  }
  return value as OnboardingResponse;
}

function toRestrictionTypes(group: Group, ids: string[]): string[] {
  return ids.filter((id) => id !== 'none').map((id) => `${CATEGORY[group]}.${id}`);
}

function fromRestrictionTypes(group: Group, values: string[]): string[] {
  const prefix = `${CATEGORY[group]}.`;
  return values.filter((value) => value.startsWith(prefix)).map((value) => value.slice(prefix.length));
}

// 알레르기는 "없음"도 답이므로 ALLERGY.NONE 으로 보낸다. 나머지 분류는 비어 있으면 보내지 않는다.
export function toOnboardingWrite(profile: ChildProfile) {
  const allergies = profile.allergies.includes('none')
    ? ['ALLERGY.NONE'] : toRestrictionTypes('allergies', profile.allergies);
  return {
    profile: {
      child_name: profile.childName,
      age_group: profile.ageRange,
      restrictions: [
        ...allergies,
        ...toRestrictionTypes('restrictions', profile.restrictions),
        ...toRestrictionTypes('vegetarian', profile.vegetarianRestrictions),
      ],
      safe_foods: profile.safeFoods.map((food) => ({
        name: food.name,
        preparation: food.preparation,
        presentation_note: food.presentationNote || null,
      })),
    },
    consents: [
      { kind: 'ACCOUNT_PRIVACY', granted: profile.consent.accountPrivacy },
      { kind: 'PHOTO_ANALYSIS', granted: profile.consent.photoAnalysis },
      { kind: 'AI_TRAINING', granted: profile.consent.aiTraining },
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
  const allergies = fromRestrictionTypes('allergies', source.restrictions);
  const dietary = fromRestrictionTypes('restrictions', source.restrictions);
  return {
    id: source.user_id,
    caregiverName: user.fullName,
    caregiverEmail: user.email,
    childName: source.child_name,
    ageRange: source.age_group,
    consent: {
      accountPrivacy: latest.get('ACCOUNT_PRIVACY') ?? false,
      photoAnalysis: latest.get('PHOTO_ANALYSIS') ?? false,
      aiTraining: latest.get('AI_TRAINING') ?? false,
    },
    allergies: allergies.includes('NONE') ? ['none'] : allergies,
    restrictions: dietary.length ? dietary : ['none'],
    vegetarianRestrictions: fromRestrictionTypes('vegetarian', source.restrictions),
    safeFoods: source.safe_foods.map((food) => ({
      id: food.id, name: food.name, preparation: food.preparation,
      presentationNote: food.presentation_note ?? '',
    })),
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
