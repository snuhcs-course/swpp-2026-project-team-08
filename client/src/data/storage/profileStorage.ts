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
    || !Array.isArray(profile.safeFoods)) throw new Error('Invalid profile');
  return parsed as ChildProfile;
}

export async function saveProfile(profile: ChildProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
