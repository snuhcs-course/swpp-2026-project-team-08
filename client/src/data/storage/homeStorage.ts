// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeRecords, SavedSuggestion } from '../../types/home';

export type SuggestionSavedDraft = {
  id: string;
  title: string;
  description: string;
  servingTip: string | null;
  ingredients: string[];
};

export function applySuggestionSaved(
  records: HomeRecords,
  childId: string,
  suggestion: SuggestionSavedDraft,
  saved: boolean,
  profileUpdatedAt: string,
): boolean {
  const existing = records.suggestions.find((item) => item.id === suggestion.id);
  if (existing) {
    existing.isSaved = saved;
    return existing.isSaved;
  }
  if (!saved) return false;
  const next: SavedSuggestion = {
    id: suggestion.id,
    childId,
    title: suggestion.title,
    description: suggestion.description,
    ingredients: suggestion.ingredients,
    isSaved: true,
    safetyVerifiedForProfileAt: profileUpdatedAt,
  };
  if (suggestion.servingTip) next.servingTip = suggestion.servingTip;
  records.suggestions.push(next);
  return true;
}

export function setSuggestionSaved(
  childId: string,
  suggestion: SuggestionSavedDraft,
  saved: boolean,
  profileUpdatedAt: string,
): Promise<boolean> {
  return updateHomeRecords(childId, (records) =>
    applySuggestionSaved(records, childId, suggestion, saved, profileUpdatedAt),
  );
}

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
  if (!raw) return { meals: [], suggestions: [] };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid home records');
  const records = value as Record<string, unknown>;
  if (!Array.isArray(records.meals) || !Array.isArray(records.suggestions)) {
    throw new Error('Invalid home records');
  }
  const mealsValid = records.meals.every((meal: unknown) => meal && typeof meal === 'object'
    && typeof (meal as Record<string, unknown>).id === 'string'
    && typeof (meal as Record<string, unknown>).childId === 'string'
    && typeof (meal as Record<string, unknown>).mealDate === 'string');
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
  if (!mealsValid || !suggestionsValid) throw new Error('Invalid home records');
  return { meals: records.meals, suggestions: records.suggestions } as HomeRecords;
}
