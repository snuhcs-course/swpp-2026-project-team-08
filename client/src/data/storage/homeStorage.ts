import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeRecords } from '../../types/home';

const keyFor = (childId: string) => `nurturebites.home.${childId}.v1`;
const writeQueues = new Map<string, Promise<unknown>>();

export function updateHomeRecords<T>(childId: string, change: (records: HomeRecords) => T | Promise<T>): Promise<T> {
  const next = (writeQueues.get(childId) ?? Promise.resolve()).catch(() => undefined).then(async () => {
    const records = await readHomeRecords(childId);
    const result = await change(records);
    await AsyncStorage.setItem(keyFor(childId), JSON.stringify(records));
    return result;
  });
  writeQueues.set(childId, next);
  void next.finally(() => { if (writeQueues.get(childId) === next) writeQueues.delete(childId); }).catch(() => undefined);
  return next;
}

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
    && ((item as Record<string, unknown>).servingTip === undefined || typeof (item as Record<string, unknown>).servingTip === 'string')
    && Array.isArray((item as Record<string, unknown>).ingredients)
    && ((item as Record<string, unknown>).ingredients as unknown[]).every((ingredient) => typeof ingredient === 'string')
    && typeof (item as Record<string, unknown>).isSaved === 'boolean'
    && typeof (item as Record<string, unknown>).safetyVerifiedForProfileAt === 'string'
    && ((item as Record<string, unknown>).recommendation === undefined || (() => {
      const evidence = (item as Record<string, unknown>).recommendation;
      if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return false;
      const value = evidence as Record<string, unknown>;
      return ['mealId', 'foodId', 'foodName', 'foodFormKey', 'reviewSavedAt']
        .every((key) => typeof value[key] === 'string')
        && (value.outcome === 'tasted' || value.outcome === 'untouched')
        && (value.difficulty === undefined || value.difficulty === 'shape' || value.difficulty === 'visibility')
        && value.kind === 'small-separate-portion';
    })()));
  if (!mealsValid || !exposuresValid || !suggestionsValid) throw new Error('Invalid home records');
  return records as HomeRecords;
}
