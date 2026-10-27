// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo

import AsyncStorage from '@react-native-async-storage/async-storage';

const ALWAYS_REMOVE = ['nurturebites.profile.v1', 'nurturebites.onboarding.v1'];

export async function wipeAccountLocalData(childIds: (string | null | undefined)[]): Promise<void> {
  const ids = [...new Set(childIds.filter((value): value is string => !!value))];
  const keys = await AsyncStorage.getAllKeys();
  const remove = keys.filter((key) => {
    if (ALWAYS_REMOVE.includes(key)) return true;
    if (key.startsWith('nurturebites.auth.')) return false;
    return ids.some((id) => key.includes(`.${id}.`) || key.endsWith(`.${id}.v1`));
  });
  if (remove.length) await AsyncStorage.multiRemove(remove);
}
