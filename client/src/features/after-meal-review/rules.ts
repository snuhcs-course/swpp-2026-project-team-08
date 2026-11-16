// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Separate difficulty targets and restore saved selections and notes
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버가 받지 않는 난이도 선택지 제거
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 대상의 어려움·추천 제외 및 빈 단계 건너뛰기
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 최종 저장에 추가 버튼을 누르지 않은 어려움 입력 반영

import type { AfterMealReview, AfterMealReviewDraft, DifficultyCategory, DifficultyTag, FoodOutcome, Outcome, ReviewStep } from '../../types/afterMealReview';
import type { FoodItem, Meal } from '../../types/meal';
import type { Difficulty } from '../../types/reviewRecord';
import type { MealDetail } from '../../types/mealRecord';
import { ingredientId } from '../../rules/ingredientIds';
import { foodFormKey } from '../../rules/recommendationSafety';

// Legacy draft steps resume at the final editable Figma screen without submitting.
export function normalizeReviewStep(step: ReviewStep): ReviewStep {
  return step === 'suggestions' ? 'difficulties' : step;
}

export const difficultyOptions: Record<DifficultyCategory, readonly string[]> = {
  texture: ['soft', 'firm', 'hard'],
  tasteType: ['sweet', 'salty', 'sour', 'bitter', 'savory'],
  smell: ['fruit', 'herb', 'mushroom', 'toasted', 'vanilla', 'dairy', 'meaty', 'sulfur', 'sea', 'fermented', 'spice', 'mint', 'smoke'],
  color: ['red', 'yellow', 'green', 'brown', 'white', 'other'],
  temperature: ['hot', 'warm', 'cool', 'room'],
  pieceSize: ['fine', 'small', 'large'],
  arrangement: ['even', 'uneven', 'clustered', 'other'],
  notSure: ['notSure'],
};

export function reconcileOutcomes(previous: FoodOutcome[], foods: FoodItem[]): FoodOutcome[] {
  return foods.map((food) => {
    const existing = previous.find((entry) => entry.foodId === food.id);
    const occurrences = new Map<string, number>();
    return {
      foodId: food.id,
      decision: { confirmed: existing?.decision.confirmed ?? null, suggested: null },
      ingredients: food.ingredients.map((name) => {
        const normalized = name.trim().toLocaleLowerCase();
        const occurrence = occurrences.get(normalized) ?? 0;
        occurrences.set(normalized, occurrence + 1);
        const id = ingredientId(food.id, name, occurrence);
        const old = existing?.ingredients.find((item) => item.id === id);
        return { id, name, selected: old ? old.selected !== false : false, decision: { confirmed: old?.decision.confirmed ?? null, suggested: null } };
      }),
    };
  });
}

/** Selected ingredients are targets within their own food, even when names repeat. */
export function difficultyTargets(foods: FoodItem[], outcomes: FoodOutcome[]) {
  return foods.flatMap(food => [
    ...(outcomes.find(outcome => outcome.foodId === food.id)?.decision.confirmed === 'eaten'
      ? [] : [{ id: food.id, name: food.name, parentName: null as string | null }]),
    ...(outcomes.find(outcome => outcome.foodId === food.id)?.ingredients ?? [])
      .filter(ingredient => ingredient.selected !== false && ingredient.decision.confirmed !== 'eaten')
      .map(ingredient => ({ id: ingredient.id, name: ingredient.name, parentName: food.name })),
  ]);
}

/** Preserve deselected ingredients in drafts; discard entries for removed foods/ingredients. */
export function reconcileDifficultyEntries<T>(entries: Record<string, T>, outcomes: FoodOutcome[]): Record<string, T> {
  const ids = new Set(outcomes.flatMap(food => [food.foodId, ...food.ingredients.map(ingredient => ingredient.id)]));
  return Object.fromEntries(Object.entries(entries).filter(([id]) => ids.has(id)));
}

function restoredDifficulties(targetId: string, tags: Difficulty[]): DifficultyTag[] {
  return tags.map((tag, index) => {
    // The API stores selection and note together; keep any later separators in the note.
    const separator = tag.value.indexOf(': ');
    return {
      id: `${targetId}:${index}`,
      category: tag.category,
      value: separator < 0 ? tag.value : tag.value.slice(0, separator),
      ...(separator < 0 ? {} : { note: tag.value.slice(separator + 2) }),
      ...(tag.subcategory ? { subcategory: tag.subcategory } : {}),
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
    suggestionFeedback: {},
  };
}

export function reviewDraftFromServer(meal: Meal, detail: MealDetail): AfterMealReviewDraft {
  const base = newReviewDraft(meal);
  const review = detail.review;
  if (!review) return base;
  const ingredientDifficulties: Record<string, DifficultyTag[]> = {};
  const outcomes = base.outcomes.map((food) => {
    const result = review.foodResults.find((item) => item.foodId === food.foodId);
    const recordFood = detail.foods.find((item) => item.id === food.foodId);
    const occurrences = new Map<string, number>();
    const names = new Map(recordFood?.ingredients.map((ingredient) => {
      const key = ingredient.name.trim().toLocaleLowerCase();
      const occurrence = occurrences.get(key) ?? 0;
      occurrences.set(key, occurrence + 1);
      return [ingredientId(food.foodId, ingredient.name, occurrence), ingredient.id];
    }) ?? []);
    return {
      ...food,
      decision: { confirmed: result?.outcome ?? null, suggested: null },
      ingredients: food.ingredients.map((ingredient) => {
        const saved = review.ingredientResults.find((item) =>
          item.foodId === food.foodId && item.ingredientId === names.get(ingredient.id));
        if (saved) ingredientDifficulties[ingredient.id] = restoredDifficulties(ingredient.id, saved.difficulties);
        return {
          ...ingredient,
          selected: !!saved,
          decision: { confirmed: saved?.outcome ?? null, suggested: null },
        };
      }),
    };
  });
  return {
    ...base,
    step: 'complete',
    afterPhoto: detail.afterPhotoUri
      ? { id: detail.afterPhotoUri, uri: detail.afterPhotoUri, mimeType: 'image/jpeg' }
      : null,
    comparisonMethod: 'manual',
    outcomes,
    difficulties: {
      ...Object.fromEntries(review.foodResults.map(food => [food.foodId, restoredDifficulties(food.foodId, food.difficulties)])),
      ...ingredientDifficulties,
    },
  };
}

export function allOutcomesConfirmed(outcomes: FoodOutcome[]): boolean {
  return outcomes.length > 0 && outcomes.every((food) =>
    food.decision.confirmed !== null && food.ingredients.every((ingredient) => ingredient.selected === false || ingredient.decision.confirmed !== null),
  );
}

export function setOutcome(
  outcomes: FoodOutcome[], foodId: string, value: Outcome, ingredientKey?: string,
): FoodOutcome[] {
  return outcomes.map((food) => food.foodId !== foodId ? food : ingredientKey
    ? {
      ...food,
      ingredients: food.ingredients.map((ingredient) => ingredient.id === ingredientKey
        ? { ...ingredient, selected: true, decision: { ...ingredient.decision, confirmed: value } }
        : ingredient),
    }
    : { ...food, decision: { ...food.decision, confirmed: value } });
}

/** Preserve caregiver answers while dropping legacy photo suggestions. */
export function clearOutcomeSuggestions(outcomes: FoodOutcome[]): FoodOutcome[] {
  return outcomes.map((food) => ({
    ...food,
    decision: { confirmed: food.decision.confirmed, suggested: null },
    ingredients: food.ingredients.map((ingredient) => ({
      ...ingredient, decision: { confirmed: ingredient.decision.confirmed, suggested: null },
    })),
  }));
}

/** Legacy data helper; the app no longer requests or displays photo suggestions. */
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
  tags: DifficultyTag[], category: DifficultyCategory, value: string, note?: string, subcategory?: string,
): DifficultyTag[] {
  const normalized = value.trim();
  const normalizedNote = note?.trim();
  if (!normalized && !normalizedNote) return tags;
  const tag: DifficultyTag = {
    id: `${category}:${subcategory ?? ''}:${encodeURIComponent(normalized.toLocaleLowerCase())}:${encodeURIComponent(normalizedNote?.toLocaleLowerCase() ?? '')}`,
    category,
    ...(subcategory ? { subcategory } : {}),
    value: normalized,
    ...(normalizedNote ? { note: normalizedNote } : {}),
  };
  const single = category === 'smell' || category === 'temperature' || category === 'notSure' || category === 'pieceSize' || category === 'arrangement';
  const retained = single ? tags.filter((item) => item.category !== category) : tags;
  return retained.some((item) => item.id === tag.id) ? retained : [...retained, tag];
}

export function difficultyNeedsNote(category: DifficultyCategory | null, value: string): boolean {
  return value === 'other';
}

export function canAddDifficulty(category: DifficultyCategory | null, value: string, note: string, subcategory?: string): boolean {
  if (category === 'texture' && subcategory !== undefined && (!subcategory || !textureQuestions[subcategory]?.includes(value))) return false;
  return !!category && !!value && (!difficultyNeedsNote(category, value) || !!note.trim());
}

export function reviewFromDraft(draft: AfterMealReviewDraft, meal: Meal): AfterMealReview {
  if (draft.mealId !== meal.id || draft.childId !== meal.childId) throw new Error('Review does not match meal');
  const outcomes = reconcileOutcomes(draft.outcomes, meal.foods);
  if (!allOutcomesConfirmed(outcomes)) throw new Error('Unanswered outcomes');
  return {
    mealId: meal.id,
    childId: meal.childId,
    afterPhoto: draft.afterPhoto,
    comparisonMethod: 'manual',
    outcomes: outcomes.map((food) => ({ ...food, ingredients: food.ingredients.filter((ingredient) => ingredient.selected !== false) })),
    difficulties: Object.fromEntries(difficultyTargets(meal.foods, outcomes).map(target => {
      const tags = draft.difficulties[target.id] ?? [];
      const input = draft.difficultyInputs[target.id];
      const subcategory = input?.category === 'texture' ? input.subcategory ?? '' : undefined;
      const complete = input && canAddDifficulty(input.category, input.value, input.note, subcategory);
      return [target.id, complete
        ? addDifficulty(tags, input.category!, input.value, input.note, subcategory)
        : tags];
    })),
    suggestionFeedback: draft.suggestionFeedback,
    savedAt: new Date().toISOString(),
    foodFormKeys: Object.fromEntries(meal.foods.map((food) => [food.id, foodFormKey(food)])),
  };
}


export const textureQuestions: Record<string, readonly string[]> = {
  hardness: ['soft', 'firm', 'hard'], breaking: ['crumbly', 'crunchy', 'brittle'],
  chewing: ['tender', 'chewy', 'tough'], stickiness: ['nonSticky', 'sticky', 'gummy'],
  springiness: ['springy', 'rubbery'], thickness: ['fluid', 'thin', 'thick', 'viscous'],
  moisture: ['dry', 'moist', 'juicy', 'wet'], oiliness: ['nonFatty', 'oily', 'greasy'],
  graininess: ['grainy', 'gritty', 'sandy', 'mealy', 'powdery'], density: ['dense', 'airy'],
  surface: ['smooth', 'rough', 'bumpy', 'crusty', 'fuzzy'], structure: ['fibrous', 'fleshy', 'layered', 'spongy'],
};
export function toggleIngredient(outcomes: FoodOutcome[], foodId: string, ingredientId: string): FoodOutcome[] {
  return outcomes.map((food) => food.foodId === foodId ? { ...food, ingredients: food.ingredients.map((ingredient) => ingredient.id === ingredientId ? { ...ingredient, selected: ingredient.selected === false } : ingredient) } : food);
}
