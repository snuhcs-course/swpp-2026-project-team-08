// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
import type { FoodResponseCard } from './types';
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

export function mealThumbnail(meal: Pick<MealDetail, 'beforePhotoUri' | 'afterPhotoUri'>): string | null {
  return meal.beforePhotoUri || meal.afterPhotoUri || null;
}

export function densityLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
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
