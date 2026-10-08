import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChildProfile, Language } from '../../types/profile';

const PROFILE_KEY = 'nurturebites.profile.v1';
const DRAFT_KEY = 'nurturebites.onboarding.v1';
const LANGUAGE_KEY = 'nurturebites.language.v1';

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

export async function readDraft(): Promise<unknown> {
  const value = await AsyncStorage.getItem(DRAFT_KEY);
  return value ? JSON.parse(value) as unknown : null;
}

export async function saveDraft(draft: unknown): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export async function readLanguage(): Promise<Language | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  return value === 'ko' || value === 'en' ? value : null;
}

export async function saveLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
