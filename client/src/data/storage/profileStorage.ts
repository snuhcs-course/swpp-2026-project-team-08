// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 제한 필드가 없는 예전 프로필 캐시 거부

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChildProfile } from '../../types/profile';

const PROFILE_KEY = 'nurturebites.profile.v1';

export async function readProfile(): Promise<ChildProfile | null> {
  const value = await AsyncStorage.getItem(PROFILE_KEY);
  if (!value) return null;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid profile');
  const profile = parsed as Record<string, unknown>;
  if (typeof profile.id !== 'string' || typeof profile.caregiverName !== 'string'
    || typeof profile.caregiverEmail !== 'string' || typeof profile.childName !== 'string'
    || typeof profile.ageRange !== 'string' || typeof profile.updatedAt !== 'string'
    || !Array.isArray(profile.allergies) || !Array.isArray(profile.restrictions)
    || !Array.isArray(profile.vegetarianRestrictions) || !Array.isArray(profile.safeFoods)) throw new Error('Invalid profile');
  return parsed as ChildProfile;
}

export async function saveProfile(profile: ChildProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
