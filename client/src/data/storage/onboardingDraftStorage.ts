// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 계정별 온보딩 초안 보관
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

const accountDraftKey = (userId: string) => `${DRAFT_KEY}.account.${userId}`;

export async function archiveDraft(userId: string, draft: unknown): Promise<void> {
  await AsyncStorage.setItem(accountDraftKey(userId), JSON.stringify(draft));
}

export async function readArchivedDraft(userId: string): Promise<unknown> {
  const value = await AsyncStorage.getItem(accountDraftKey(userId));
  return value ? JSON.parse(value) as unknown : null;
}

export async function clearArchivedDraft(userId: string): Promise<void> {
  await AsyncStorage.removeItem(accountDraftKey(userId));
}
