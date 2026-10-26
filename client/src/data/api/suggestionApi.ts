// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import type {
  EligibleMeal,
  Suggestion,
  SuggestionBatch,
  SuggestionDecision,
  SuggestionTry,
} from '../../types/suggestion';
import { apiRequest } from '../network/apiClient';

const root = (child: string) => `/api/v1/children/${encodeURIComponent(child)}/suggestions`;
const path = (child: string, id: string) => `${root(child)}/${encodeURIComponent(id)}`;
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);

export function parseSuggestion(value: unknown): Suggestion {
  if (
    !object(value) ||
    !text(value.id) ||
    !text(value.child_id) ||
    !text(value.meal_id) ||
    !text(value.food_id) ||
    !text(value.revision) ||
    !object(value.content) ||
    !['pending', 'saved', 'dismissed'].includes(String(value.status)) ||
    !Number.isInteger(value.version) ||
    !texts(value.dismiss_reasons) ||
    !(value.saved_at === null || text(value.saved_at)) ||
    !text(value.created_at) ||
    !Array.isArray(value.tries)
  )
    throw new Error('Invalid suggestion');
  const content = value.content;
  for (const key of [
    'food_id',
    'food_name',
    'meal_date',
    'meal_type',
    'what_to_try',
    'why_this_may_help',
    'serving_tip',
  ]) {
    if (!text(content[key])) throw new Error('Incomplete suggestion');
  }
  if (
    !texts(content.ingredients) ||
    typeof content.preparation !== 'string' ||
    !Array.isArray(content.linked_reason)
  )
    throw new Error('Invalid food details');
  value.tries.forEach(parseTry);
  return value as unknown as Suggestion;
}
export function parseTry(value: unknown): SuggestionTry {
  if (
    !object(value) ||
    !text(value.id) ||
    !text(value.meal_id) ||
    !text(value.target_id) ||
    !text(value.tried_on) ||
    !(value.meal_type === null || ['breakfast', 'lunch', 'dinner', 'snack'].includes(String(value.meal_type))) ||
    typeof value.linked_available !== 'boolean' ||
    !(
      value.feedback === null ||
      ['helpful', 'not_helpful', 'not_sure'].includes(String(value.feedback))
    )
  ) {
    throw new Error('Invalid try record');
  }
  return value as SuggestionTry;
}
export function parseBatch(value: unknown): SuggestionBatch {
  if (
    !object(value) ||
    !text(value.revision) ||
    !texts(value.selected_food_ids) ||
    !value.selected_food_ids.length ||
    value.selected_food_ids.length > 3 ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Invalid recommendation batch');
  }
  const selected = value.selected_food_ids;
  const items = value.items.map(parseSuggestion);
  if (
    items.length !== value.selected_food_ids.length ||
    new Set(items.map((i) => i.food_id)).size !== items.length ||
    items.some((i) => !selected.includes(i.food_id) || i.revision !== value.revision)
  ) {
    throw new Error('Incomplete recommendation batch');
  }
  return { revision: value.revision, selected_food_ids: value.selected_food_ids, items };
}

export async function generateSuggestions(
  child: string,
  meal: string,
  selected?: string[],
  signal?: AbortSignal,
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 60_000);
  try {
    const batch = parseBatch(
      await apiRequest(`${root(child)}/meals/${encodeURIComponent(meal)}/generate`, {
        method: 'POST',
        body: JSON.stringify({ selected_food_ids: selected }),
        signal: controller.signal,
      }),
    );
    if (batch.items.some((i) => i.child_id !== child || i.meal_id !== meal))
      throw new Error('Invalid source scope');
    return batch;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
export async function savedSuggestions(child: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const value = await apiRequest<unknown>(root(child), { signal });
  if (!Array.isArray(value)) throw new Error('Invalid saved suggestions');
  const items = value.map(parseSuggestion);
  if (items.some((i) => i.child_id !== child || !i.saved_at))
    throw new Error('Invalid child scope');
  return items;
}
export const getSuggestion = async (child: string, id: string, signal?: AbortSignal) =>
  parseSuggestion(await apiRequest(path(child, id), { signal }));
export const decideSuggestion = async (child: string, id: string, decision: SuggestionDecision) =>
  parseSuggestion(
    await apiRequest(`${path(child, id)}/decision`, {
      method: 'PUT',
      body: JSON.stringify(decision),
    }),
  );
export const undoSuggestion = async (child: string, id: string, actionId: string) =>
  parseSuggestion(
    await apiRequest(`${path(child, id)}/undo`, {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId }),
    }),
  );
export const setSuggestionSaved = async (child: string, id: string, saved: boolean) =>
  parseSuggestion(
    await apiRequest(`${path(child, id)}/saved`, {
      method: 'PUT',
      body: JSON.stringify({ saved }),
    }),
  );
export async function eligibleMeals(
  child: string,
  id: string,
  signal?: AbortSignal,
): Promise<EligibleMeal[]> {
  const value = await apiRequest<unknown>(`${path(child, id)}/eligible-meals`, { signal });
  if (
    !Array.isArray(value) ||
    value.some(
      (m) =>
        !object(m) ||
        !text(m.id) ||
        !text(m.meal_date) ||
        !text(m.meal_type) ||
        typeof m.reviewed !== 'boolean' ||
        !texts(m.foods) ||
        !Array.isArray(m.targets) ||
        m.targets.some((t) => !object(t) || !text(t.id) || !text(t.name) || !text(t.food_id)),
    )
  ) {
    throw new Error('Invalid eligible meals');
  }
  return value as EligibleMeal[];
}
export const recordSuggestionTry = async (
  child: string,
  id: string,
  mealId: string,
  targetId: string,
) =>
  parseTry(
    await apiRequest(`${path(child, id)}/tries`, {
      method: 'POST',
      body: JSON.stringify({ meal_id: mealId, target_id: targetId }),
    }),
  );
export const saveSuggestionFeedback = async (
  child: string,
  id: string,
  tryId: string,
  feedback: NonNullable<SuggestionTry['feedback']>,
) =>
  parseTry(
    await apiRequest(`${path(child, id)}/tries/${encodeURIComponent(tryId)}/feedback`, {
      method: 'PUT',
      body: JSON.stringify({ feedback }),
    }),
  );
