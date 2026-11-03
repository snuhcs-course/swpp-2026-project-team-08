// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 연결에서 재료 id 제거

export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const mealSettings = ['home', 'restaurant', 'school', 'others'] as const;
export type FoodItem = {
  id: string;
  name: string;
  ingredients: string[];
  preparation: string;
  servingNote: string;
  source: 'ai' | 'parent';
  confirmed: boolean;
  acceptance?: number | null;
};
export type MealPhoto = { id: string; uri: string; mimeType: string };
export type PhotoSource = 'camera' | 'gallery' | 'files';
export type MealSuggestionLink = {
  suggestionId: string;
  foodId: string;
  title: string;
  description: string;
  servingTip?: string;
};
export type Meal = {
  id: string;
  childId: string;
  mealDate: string;
  mealType: (typeof mealTypes)[number];
  setting: (typeof mealSettings)[number];
  photo: MealPhoto | null;
  foods: FoodItem[];
  suggestionLinks?: MealSuggestionLink[];
  savedAt: string;
};

export const mealSteps = [
  'details',
  'photo',
  'preview',
  'method',
  'analyzing',
  'analysis-error',
  'foods',
  'complete',
] as const;
export type MealStep = (typeof mealSteps)[number];
export type MealDraft = Omit<Meal, 'mealType' | 'setting' | 'savedAt'> & {
  mealType: Meal['mealType'] | null;
  setting: Meal['setting'] | null;
  step: MealStep;
  editingFood: FoodItem | null;
  savedMealId: string | null;
};
