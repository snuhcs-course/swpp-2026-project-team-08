// AI-generated with Grok 4.6, 2026-10-19, reviewed by Doyeon Kim

import { emptyTraits } from '../../rules/foodDraft';
import type { DifficultyTag } from '../../types/afterMealReview';
import type { FoodItem } from '../../types/meal';
import type { MealDetail, MealListItem, MealLogSuggestion } from './mealLogApi';

const traits = emptyTraits();

function food(id: string, name: string, ingredients: string[], extras: Partial<FoodItem> = {}): FoodItem {
  return {
    id,
    name,
    ingredients,
    preparation: extras.preparation ?? '',
    servingNote: extras.servingNote ?? '',
    traits: extras.traits ?? traits,
    history: extras.history ?? null,
    source: extras.source ?? 'parent',
  };
}

function eaten(foodId: string, ingredients: { id: string; name: string }[]) {
  return {
    foodId,
    decision: { confirmed: 'eaten' as const, suggested: 'eaten' as const },
    ingredients: ingredients.map((item) => ({
      id: item.id,
      name: item.name,
      decision: { confirmed: 'eaten' as const, suggested: null },
    })),
  };
}

function linked(
  id: string,
  food: FoodItem,
  title: string,
  description: string,
  servingTip: string,
): MealLogSuggestion {
  return {
    id,
    foodId: food.id,
    title,
    description,
    servingTip,
    ingredients: food.ingredients,
  };
}

function meal(
  id: string,
  mealDate: string,
  mealType: MealDetail['mealType'],
  setting: MealDetail['setting'],
  foods: FoodItem[],
  review: MealDetail['review'] = null,
  suggestions: MealLogSuggestion[] = [],
): MealDetail {
  return {
    id,
    childId: 'demo-child',
    mealDate,
    mealType,
    setting,
    beforePhotoUri: null,
    exposureFoodId: foods[0]?.id ?? null,
    savedAt: `${mealDate}T12:00:00.000Z`,
    foods,
    review,
    suggestions,
  };
}

function reviewed(
  mealDate: string,
  foodId: string,
  ingredients: { id: string; name: string }[],
  difficulties: DifficultyTag[] = [],
): MealDetail['review'] {
  return {
    afterPhotoUri: `file:///demo-after-${mealDate}.png`,
    outcomes: [eaten(foodId, ingredients)],
    difficulties: { [foodId]: difficulties },
    goalFeedback: 'tried',
    savedAt: `${mealDate}T13:00:00.000Z`,
  };
}

const omelet = food('food-omelet', 'Rolled omelet', ['Egg', 'Carrot'], { preparation: 'Pan-fried', history: 'usually' });
const rice = food('food-kimchi-rice', 'Kimchi fried rice', ['Rice', 'Kimchi'], { preparation: 'Stir-fried' });
const soup = food('food-seaweed-soup', 'Seaweed soup', ['Seaweed', 'Tofu'], { preparation: 'Simmered' });
const oats = food('food-oatmeal', 'Banana oatmeal', ['Oats', 'Banana'], { preparation: 'Cooked' });
const eggs = food('food-eggs', 'Scrambled eggs', ['Egg'], { preparation: 'Scrambled' });
const yogurt = food('food-yogurt', 'Yogurt cup', ['Yogurt', 'Blueberry']);
const beef = food('food-beef-rice', 'Rice and beef', ['Rice', 'Beef'], { preparation: 'Braised' });
const pasta = food('food-pasta', 'Butter pasta', ['Pasta', 'Butter'], { preparation: 'Boiled' });
const apple = food('food-apple', 'Apple slices', ['Apple']);
const pancake = food('food-pancake', 'Mini pancakes', ['Flour', 'Egg'], { preparation: 'Griddled' });
const bibimbap = food('food-bibimbap', 'Bibimbap', ['Rice', 'Spinach', 'Egg'], { preparation: 'Mixed' });
const stew = food('food-soy-stew', 'Soybean stew', ['Tofu', 'Soybean paste'], { preparation: 'Simmered' });

const demoMeals: MealDetail[] = [
  meal('demo-2026-10-09-breakfast', '2026-10-09', 'breakfast', 'home', [oats]),
  meal('demo-2026-10-12-breakfast', '2026-10-12', 'breakfast', 'home', [eggs]),
  meal(
    'demo-2026-10-12-lunch',
    '2026-10-12',
    'lunch',
    'school',
    [soup],
    reviewed('2026-10-12', soup.id, [{ id: 'ing-seaweed', name: 'Seaweed' }]),
    [linked(
      'sug-2026-10-12-lunch',
      soup,
      'Offer a smaller sip first',
      'Seaweed soup was eaten. A smaller first sip keeps the same form.',
      'Serve in a small cup beside a safe food.',
    )],
  ),
  meal('demo-2026-10-16-lunch', '2026-10-16', 'lunch', 'home', [rice]),
  meal(
    'demo-2026-10-16-dinner',
    '2026-10-16',
    'dinner',
    'home',
    [omelet],
    reviewed('2026-10-16', omelet.id, [{ id: 'ing-egg', name: 'Egg' }], [
      { id: 'diff-omelet-intensity', category: 'tasteIntensity', value: 'sour' },
      { id: 'diff-omelet-texture', category: 'texture', value: 'chewy' },
    ]),
    [linked(
      'sug-2026-10-16-dinner',
      omelet,
      'Offer a smaller piece beside a familiar food.',
      'Rolled omelet was eaten last time, so a similar texture may feel safer.',
      'Keep the slices thin and serve warm.',
    )],
  ),
  meal('demo-2026-10-17-breakfast', '2026-10-17', 'breakfast', 'home', [yogurt]),
  meal(
    'demo-2026-10-17-lunch',
    '2026-10-17',
    'lunch',
    'school',
    [beef],
    reviewed('2026-10-17', beef.id, [{ id: 'ing-beef', name: 'Beef' }]),
    [linked(
      'sug-2026-10-17-lunch',
      beef,
      'Keep beef in a familiar rice bowl',
      'Rice and beef was eaten at school. Repeat the same bowl with a slightly smaller beef piece.',
      'Place the beef on the side, not mixed in.',
    )],
  ),
  meal('demo-2026-10-17-dinner', '2026-10-17', 'dinner', 'home', [pasta]),
  meal('demo-2026-10-21-snack', '2026-10-21', 'snack', 'home', [apple]),
  meal('demo-2026-10-24-breakfast', '2026-10-24', 'breakfast', 'home', [pancake]),
  meal('demo-2026-10-24-lunch', '2026-10-24', 'lunch', 'restaurant', [bibimbap]),
  meal(
    'demo-2026-10-24-dinner',
    '2026-10-24',
    'dinner',
    'home',
    [stew],
    reviewed('2026-10-24', stew.id, [{ id: 'ing-tofu', name: 'Tofu' }]),
    [linked(
      'sug-2026-10-24-dinner',
      stew,
      'Serve tofu in a familiar stew',
      'Soybean stew was eaten. Keep the same stew and add one extra tofu cube next time.',
      'Cut tofu smaller than last time.',
    )],
  ),
];

export function demoMealList(date?: string | null): MealListItem[] {
  return demoMeals
    .filter((item) => !date || item.mealDate === date)
    .map((item) => ({
      id: item.id,
      mealDate: item.mealDate,
      mealType: item.mealType,
      setting: item.setting,
      beforePhotoUri: item.beforePhotoUri,
      afterPhotoUri: item.review?.afterPhotoUri ?? null,
      foods: item.foods.map((entry) => ({ name: entry.name, ingredients: entry.ingredients })),
      reviewStatus: item.review ? 'reviewed' : 'awaiting_review',
    }));
}

export function demoMealCounts(month: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of demoMeals) {
    if (!item.mealDate.startsWith(`${month}-`)) continue;
    counts[item.mealDate] = (counts[item.mealDate] ?? 0) + 1;
  }
  return counts;
}

export function demoMealDetail(childId: string, mealId: string): MealDetail | undefined {
  const item = demoMeals.find((mealItem) => mealItem.id === mealId);
  return item ? { ...item, childId } : undefined;
}

export function mergeDemoMealList(remote: MealListItem[], date?: string | null): MealListItem[] {
  const ids = new Set(remote.map((item) => item.id));
  const merged = [...remote, ...demoMealList(date).filter((item) => !ids.has(item.id))];
  return merged.sort((a, b) => b.mealDate.localeCompare(a.mealDate) || a.mealType.localeCompare(b.mealType));
}
