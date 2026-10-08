import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeRecords } from '../../types/home';

const keyFor = (childId: string) => `nurturebites.home.${childId}.v1`;

export async function readHomeRecords(childId: string): Promise<HomeRecords> {
  const raw = await AsyncStorage.getItem(keyFor(childId));
  if (!raw) return { meals: [], exposures: [], suggestions: [] };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid home records');
  const records = value as Record<string, unknown>;
  if (!Array.isArray(records.meals) || !Array.isArray(records.exposures) || !Array.isArray(records.suggestions)) {
    throw new Error('Invalid home records');
  }
  const mealsValid = records.meals.every((meal: unknown) => meal && typeof meal === 'object'
    && typeof (meal as Record<string, unknown>).id === 'string'
    && typeof (meal as Record<string, unknown>).childId === 'string'
    && typeof (meal as Record<string, unknown>).mealDate === 'string');
  const exposuresValid = records.exposures.every((entry: unknown) => entry && typeof entry === 'object'
    && typeof (entry as Record<string, unknown>).id === 'string'
    && typeof (entry as Record<string, unknown>).childId === 'string'
    && typeof (entry as Record<string, unknown>).foodName === 'string'
    && typeof (entry as Record<string, unknown>).stage === 'string');
  const suggestionsValid = records.suggestions.every((item: unknown) => item && typeof item === 'object'
    && typeof (item as Record<string, unknown>).id === 'string'
    && typeof (item as Record<string, unknown>).childId === 'string'
    && typeof (item as Record<string, unknown>).title === 'string'
    && typeof (item as Record<string, unknown>).description === 'string'
    && Array.isArray((item as Record<string, unknown>).ingredients)
    && ((item as Record<string, unknown>).ingredients as unknown[]).every((ingredient) => typeof ingredient === 'string')
    && typeof (item as Record<string, unknown>).isSaved === 'boolean'
    && typeof (item as Record<string, unknown>).safetyVerifiedForProfileAt === 'string');
  if (!mealsValid || !exposuresValid || !suggestionsValid) throw new Error('Invalid home records');
  return records as HomeRecords;
}
