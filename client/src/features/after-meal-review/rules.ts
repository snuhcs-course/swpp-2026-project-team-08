// This Code is generated with AI

import type { AfterMealReview, AfterMealReviewDraft, DifficultyCategory, DifficultyTag, FoodOutcome, Outcome } from '../../types/afterMealReview';
import type { FoodItem, Meal } from '../../types/meal';
import { ingredientId } from '../../rules/ingredientIds';
import { foodFormKey } from '../../rules/recommendationSafety';

export const difficultyOptions: Record<DifficultyCategory, readonly string[]> = {
  texture: ['smooth', 'soft', 'lumpy', 'crunchy', 'chewy', 'wet', 'mixed', 'other'],
  tasteType: ['sweet', 'salty', 'sour', 'bitter', 'spicy', 'other'],
  tasteIntensity: ['mild', 'strong'],
  smell: ['strong', 'mild', 'none', 'notSure'],
  color: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white', 'gray', 'other'],
  shape: ['consistent', 'varied', 'notSure', 'note'],
  visibility: ['visible', 'hidden', 'mixed'],
  temperature: ['warm', 'cool', 'room'],
  notSure: ['notSure'],
};

export function reconcileOutcomes(previous: FoodOutcome[], foods: FoodItem[]): FoodOutcome[] {
  return foods.map((food) => {
    const existing = previous.find((entry) => entry.foodId === food.id);
    const occurrences = new Map<string, number>();
    return {
      foodId: food.id,
      decision: existing?.decision ?? { confirmed: null, suggested: null },
      ingredients: food.ingredients.map((name) => {
        const normalized = name.trim().toLocaleLowerCase();
        const occurrence = occurrences.get(normalized) ?? 0;
        occurrences.set(normalized, occurrence + 1);
        const id = ingredientId(food.id, name, occurrence);
        const old = existing?.ingredients.find((item) => item.id === id);
        return { id, name, decision: old?.decision ?? { confirmed: null, suggested: null } };
      }),
    };
  });
}

export function newReviewDraft(meal: Meal): AfterMealReviewDraft {
  return {
    mealId: meal.id,
    childId: meal.childId,
    step: 'photo',
    afterPhoto: null,
    comparisonMethod: null,
    outcomes: reconcileOutcomes([], meal.foods),
    difficulties: {},
    difficultyInputs: {},
    goalFeedback: null,
    suggestionFeedback: {},
  };
}

export function allOutcomesConfirmed(outcomes: FoodOutcome[]): boolean {
  return outcomes.length > 0 && outcomes.every((food) =>
    food.decision.confirmed !== null && food.ingredients.every((ingredient) => ingredient.decision.confirmed !== null),
  );
}

export function setOutcome(
  outcomes: FoodOutcome[], foodId: string, value: Outcome, ingredientKey?: string,
): FoodOutcome[] {
  return outcomes.map((food) => food.foodId !== foodId ? food : ingredientKey
    ? {
      ...food,
      ingredients: food.ingredients.map((ingredient) => ingredient.id === ingredientKey
        ? { ...ingredient, decision: { ...ingredient.decision, confirmed: value } }
        : ingredient),
    }
    : { ...food, decision: { ...food.decision, confirmed: value } });
}

export function applySuggestions(
  outcomes: FoodOutcome[], suggestions: { foodId: string; ingredientId?: string; outcome: Outcome }[],
): FoodOutcome[] {
  return outcomes.map((food) => ({
    ...food,
    decision: {
      ...food.decision,
      suggested: suggestions.find((item) => item.foodId === food.foodId && !item.ingredientId)?.outcome ?? null,
    },
    ingredients: food.ingredients.map((ingredient) => ({
      ...ingredient,
      decision: {
        ...ingredient.decision,
        suggested: suggestions.find((item) => item.foodId === food.foodId && item.ingredientId === ingredient.id)?.outcome ?? null,
      },
    })),
  }));
}

export function addDifficulty(
  tags: DifficultyTag[], category: DifficultyCategory, value: string, note?: string,
): DifficultyTag[] {
  const normalized = value.trim();
  const normalizedNote = note?.trim();
  if (!normalized && !normalizedNote) return tags;
  const tag: DifficultyTag = {
    id: `${category}:${encodeURIComponent(normalized.toLocaleLowerCase())}:${encodeURIComponent(normalizedNote?.toLocaleLowerCase() ?? '')}`,
    category,
    value: normalized,
    ...(normalizedNote ? { note: normalizedNote } : {}),
  };
  const single = category === 'smell' || category === 'tasteIntensity' || category === 'visibility' || category === 'temperature' || category === 'notSure';
  const retained = single ? tags.filter((item) => item.category !== category) : tags;
  return retained.some((item) => item.id === tag.id) ? retained : [...retained, tag];
}

export function difficultyNeedsNote(category: DifficultyCategory | null, value: string): boolean {
  return value === 'other' || value === 'note' || (category === 'shape' && value === 'notSure');
}

export function canAddDifficulty(category: DifficultyCategory | null, value: string, note: string): boolean {
  return !!category && !!value && (!difficultyNeedsNote(category, value) || !!note.trim());
}

export function reviewFromDraft(draft: AfterMealReviewDraft, meal: Meal): AfterMealReview {
  if (draft.mealId !== meal.id || draft.childId !== meal.childId) throw new Error('Review does not match meal');
  if (!draft.afterPhoto) throw new Error('After-meal photo is required');
  const outcomes = reconcileOutcomes(draft.outcomes, meal.foods);
  if (!allOutcomesConfirmed(outcomes)) throw new Error('Unanswered outcomes');
  return {
    mealId: meal.id,
    childId: meal.childId,
    afterPhoto: draft.afterPhoto,
    comparisonMethod: draft.comparisonMethod,
    outcomes,
    difficulties: Object.fromEntries(meal.foods.map((food) => [food.id, draft.difficulties[food.id] ?? []])),
    goalFeedback: meal.exposureFoodId ? draft.goalFeedback : null,
    suggestionFeedback: draft.suggestionFeedback,
    savedAt: new Date().toISOString(),
    foodFormKeys: Object.fromEntries(meal.foods.map((food) => [food.id, foodFormKey(food)])),
  };
}
