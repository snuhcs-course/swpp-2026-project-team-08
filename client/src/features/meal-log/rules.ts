// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import type { AfterMealReview, FoodOutcome } from '../../types/afterMealReview';
import type { FoodItem } from '../../types/meal';
import type { FoodResponseCard, MealRecord } from './types';

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

export function calendarCells(year: number, month: number): (number | null)[] {
  const days = new Date(year, month + 1, 0).getDate();
  const leading = new Date(year, month, 1).getDay();
  const count = Math.ceil((leading + days) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const day = index - leading + 1;
    return day >= 1 && day <= days ? day : null;
  });
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

export function foodResponseCards(
  foods: FoodItem[],
  review: { outcomes: FoodOutcome[]; difficulties: AfterMealReview['difficulties'] } | null,
  suggestions: { foodId: string; title: string; description: string; servingTip: string | null }[],
): FoodResponseCard[] {
  return foods.map((food) => {
    const outcome = review?.outcomes.find((item) => item.foodId === food.id);
    const tags = review?.difficulties[food.id] ?? [];
    const suggestion = suggestions.find((item) => item.foodId === food.id) ?? null;
    return {
      foodId: food.id,
      name: food.name,
      ingredients: food.ingredients,
      traits: food.traits,
      history: food.history,
      preparation: food.preparation,
      servingNote: food.servingNote,
      outcome: outcome?.decision.confirmed ?? null,
      reasons: tags.map((tag) => ({ category: tag.category, value: tag.value, note: tag.note })),
      suggestion: suggestion
        ? { title: suggestion.title, description: suggestion.description, servingTip: suggestion.servingTip }
        : null,
    };
  });
}
