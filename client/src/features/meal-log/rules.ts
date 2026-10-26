// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 식사 기록 화면 디자인 개선
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import type { AfterMealReview, FoodOutcome } from '../../types/afterMealReview';
import type { FoodItem } from '../../types/meal';
import type { FoodResponseCard, MealRecord } from './types';
import type { MealDetail } from '../../types/mealRecord';

export function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function isoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export type CalendarCell = { day: number; inMonth: boolean; date: string };

export function calendarCells(year: number, month: number): CalendarCell[] {
  const leading = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const count = Math.ceil((leading + days) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month, 1 - leading + index);
    return {
      day: date.getDate(),
      inMonth: date.getMonth() === month && date.getFullYear() === year,
      date: isoDate(date.getFullYear(), date.getMonth(), date.getDate()),
    };
  });
}

const mealTypeRank = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 } as const;

export function sortMealsLatestFirst(meals: MealRecord[]): MealRecord[] {
  return [...meals].sort((a, b) => {
    const byDate = b.mealDate.localeCompare(a.mealDate);
    if (byDate) return byDate;
    return mealTypeRank[b.mealType] - mealTypeRank[a.mealType];
  });
}

export function mealThumbnail(meal: Pick<MealRecord, 'beforePhotoUri' | 'afterPhotoUri'>): string | null {
  return meal.beforePhotoUri || meal.afterPhotoUri || null;
}

export function densityLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

export function matchesMealQuery(meal: MealRecord, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return meal.foods.some(
    (food) =>
      food.name.toLowerCase().includes(needle) ||
      food.ingredients.some((ingredient) => ingredient.toLowerCase().includes(needle)),
  );
}

export function filterMeals(meals: MealRecord[], query: string, unreviewedOnly: boolean): MealRecord[] {
  return meals.filter((meal) => {
    if (unreviewedOnly && meal.reviewStatus !== 'awaiting_review') return false;
    return matchesMealQuery(meal, query);
  });
}

export function sortMealDetailsLatestFirst(meals: MealDetail[]): MealDetail[] {
  return [...meals].sort((a, b) => {
    const byDate = b.mealDate.localeCompare(a.mealDate);
    if (byDate) return byDate;
    const aId = BigInt(a.id);
    const bId = BigInt(b.id);
    return bId > aId ? 1 : bId < aId ? -1 : 0;
  });
}

export function filterMealDetails(meals: MealDetail[], query: string, unreviewedOnly: boolean): MealDetail[] {
  const needle = query.trim().toLocaleLowerCase();
  return meals.filter((meal) => (!unreviewedOnly || meal.review === null)
    && (!needle || meal.foods.some((food) => food.name.toLocaleLowerCase().includes(needle)
      || food.ingredients.some((ingredient) => ingredient.name.toLocaleLowerCase().includes(needle)))));
}

export function foodResponseCardsFromDetail(meal: MealDetail): FoodResponseCard[] {
  const cards: FoodResponseCard[] = [];
  for (const food of meal.foods) {
    const result = meal.review?.foodResults.find((item) => item.foodId === food.id);
    const link = meal.suggestionLinks.find((item) => item.foodId === food.id && item.ingredientId === null);
    cards.push({
      foodId: food.id, kind: 'food', parentName: null, name: food.name,
      ingredients: food.ingredients.map((ingredient) => ingredient.name),
      preparation: food.cookingMethod ?? '', servingNote: food.servingNote ?? '',
      outcome: result?.outcome ?? null,
      reasons: (result?.difficulties ?? []).map((item) => ({ category: item.category, value: item.value })),
      suggestion: link ? { id: link.suggestionId, title: link.suggestion.whatToTry,
        description: link.suggestion.whyThisMayHelp, servingTip: link.suggestion.servingTip } : null,
    });
    for (const ingredient of food.ingredients) {
      const ingredientResult = meal.review?.ingredientResults.find((item) => item.foodId === food.id
        && item.ingredientId === ingredient.id);
      const ingredientLink = meal.suggestionLinks.find((item) => item.foodId === food.id
        && item.ingredientId === ingredient.id);
      if (!ingredientResult && !ingredientLink) continue;
      cards.push({
        foodId: `${food.id}:${ingredient.id}`, kind: 'ingredient', parentName: food.name,
        name: ingredient.name, ingredients: [], preparation: '', servingNote: '',
        outcome: ingredientResult?.outcome ?? null,
        reasons: (ingredientResult?.difficulties ?? []).map((item) => ({ category: item.category, value: item.value })),
        suggestion: ingredientLink ? { id: ingredientLink.suggestionId,
          title: ingredientLink.suggestion.whatToTry,
          description: ingredientLink.suggestion.whyThisMayHelp,
          servingTip: ingredientLink.suggestion.servingTip } : null,
      });
    }
  }
  return cards;
}

export function countsByDate(days: { date: string; count: number }[]): Record<string, number> {
  return Object.fromEntries(days.map((day) => [day.date, day.count]));
}

export function mealDateParts(iso: string, locale: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    monthDay: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date),
    monthTitle: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
    year,
  };
}

export function acceptanceFill(outcome: FoodResponseCard['outcome']): number {
  if (outcome === 'eaten') return 1;
  if (outcome === 'tasted') return 0.55;
  if (outcome === 'unclear') return 0.35;
  if (outcome === 'untouched') return 0.12;
  return 0;
}

function asSuggestion(
  suggestion: { managed?: boolean; id: string; title: string; description: string; servingTip: string | null } | null,
): FoodResponseCard['suggestion'] {
  return suggestion
    ? {
      ...(suggestion.managed ? { managed: true } : {}),
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      servingTip: suggestion.servingTip,
    }
    : null;
}

export function foodResponseCards(
  foods: FoodItem[],
  review: { outcomes: FoodOutcome[]; difficulties: AfterMealReview['difficulties'] } | null,
  suggestions: { managed?: boolean; id: string; foodId: string; title: string; description: string; servingTip: string | null }[],
): FoodResponseCard[] {
  const cards: FoodResponseCard[] = [];
  for (const food of foods) {
    const outcome = review?.outcomes.find((item) => item.foodId === food.id);
    const tags = review?.difficulties[food.id] ?? [];
    const suggestion = suggestions.find((item) => item.foodId === food.id) ?? null;
    cards.push({
      foodId: food.id,
      kind: 'food',
      parentName: null,
      name: food.name,
      ingredients: food.ingredients,
      preparation: food.preparation,
      servingNote: food.servingNote,
      outcome: outcome?.decision.confirmed ?? null,
      reasons: tags.map((tag) => ({ category: tag.category, value: tag.value, note: tag.note })),
      suggestion: asSuggestion(suggestion),
    });
    for (const ingredient of outcome?.ingredients ?? []) {
      if (ingredient.name.trim().toLowerCase() === food.name.trim().toLowerCase()) continue;
      const linked = suggestions.find((item) => item.foodId === ingredient.id) ?? null;
      cards.push({
        foodId: ingredient.id,
        kind: 'ingredient',
        parentName: food.name,
        name: ingredient.name,
        ingredients: [],
        preparation: '',
        servingNote: '',
        outcome: ingredient.decision.confirmed,
        reasons: (review?.difficulties[ingredient.id] ?? []).map((tag) => ({
          category: tag.category, value: tag.value, note: tag.note,
        })),
        suggestion: asSuggestion(linked),
      });
    }
  }
  return cards;
}
