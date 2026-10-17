// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import type { Suggestion, SuggestionBatch, SuggestionTry } from '../../types/suggestion';

export const nextSuggestion = (batch?: SuggestionBatch) =>
  batch?.items.find((i) => i.status === 'pending') ?? null;
export function canUpdateFoods(current: string[], selected: string[]) {
  return (
    selected.length >= 1 &&
    selected.length <= 3 &&
    new Set(selected).size === selected.length &&
    (current.length !== selected.length || current.some((id) => !selected.includes(id)))
  );
}
export function toggleFood(current: string[], id: string) {
  return current.includes(id)
    ? current.filter((v) => v !== id)
    : current.length < 3
      ? [...current, id]
      : current;
}
export function latestLinkedTry(item: Suggestion) {
  return (
    [...item.tries]
      .filter((t) => t.linked_available)
      .sort((a, b) => b.tried_on.localeCompare(a.tried_on))[0] ?? null
  );
}
export function suggestionTryChips(tries: SuggestionTry[]) {
  const dates = new Map<string, number>();
  for (const trial of tries) dates.set(trial.tried_on, (dates.get(trial.tried_on) ?? 0) + 1);
  return [...tries]
    .sort((a, b) => b.tried_on.localeCompare(a.tried_on))
    .map((trial) => ({ trial, showMealType: (dates.get(trial.tried_on) ?? 0) > 1 }));
}
export function suggestionPreview(text: string) {
  return text.match(/^.*?[.!?](?:\s|$)/s)?.[0].trim() ?? text;
}
export const actionId = () =>
  `suggestion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
