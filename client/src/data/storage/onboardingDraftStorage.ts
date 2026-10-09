// This Code is generated with AI

import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'nurturebites.onboarding.v1';

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
