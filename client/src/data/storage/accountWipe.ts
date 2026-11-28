// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 계정 삭제 시 보관한 온보딩 초안 제거
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

import AsyncStorage from '@react-native-async-storage/async-storage';

const ALWAYS_REMOVE = ['nurturebites.profile.v1', 'nurturebites.onboarding.v1'];

export async function wipeAccountLocalData(childIds: (string | null | undefined)[]): Promise<void> {
  const ids = [...new Set(childIds.filter((value): value is string => !!value))];
  const keys = await AsyncStorage.getAllKeys();
  const remove = keys.filter((key) => {
    if (ALWAYS_REMOVE.includes(key)) return true;
    if (key.startsWith('nurturebites.auth.')) return false;
    return ids.some((id) => key.includes(`.${id}.`) || key.endsWith(`.${id}.v1`)
      || key === `nurturebites.onboarding.v1.account.${id}`);
  });
  if (remove.length) await AsyncStorage.multiRemove(remove);
}
