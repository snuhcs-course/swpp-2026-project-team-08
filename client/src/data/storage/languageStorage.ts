import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../../types/profile';

const LANGUAGE_KEY = 'nurturebites.language.v1';

export async function readLanguage(): Promise<Language | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  return value === 'ko' || value === 'en' ? value : null;
}

export async function saveLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
