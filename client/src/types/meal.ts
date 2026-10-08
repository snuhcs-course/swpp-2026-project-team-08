export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const mealSettings = ['home', 'restaurant', 'school', 'others'] as const;
export const histories = ['usually', 'sometimes', 'unsure'] as const;
export const traitOptions = {
  texture: ['soft', 'crunchy', 'chewy', 'smooth', 'mixed'],
  tasteType: ['sweet', 'salty', 'sour', 'bitter', 'savory'],
  tasteIntensity: ['mild', 'medium', 'strong'],
  smell: ['mild', 'strong'],
  shape: ['small', 'large', 'sliced', 'whole'],
  visibility: ['visible', 'hidden', 'mixed'],
  temperature: ['warm', 'cool', 'room'],
  color: ['red', 'orange', 'yellow', 'green', 'white', 'brown'],
} as const;
export type TraitGroup = keyof typeof traitOptions;
export type FoodTraits = Record<TraitGroup, string[]>;
export type FoodItem = {
  id: string; name: string; ingredients: string[]; preparation: string; servingNote: string;
  traits: FoodTraits; history: typeof histories[number] | null; source: 'ai' | 'parent';
};
export type MealPhoto = { id: string; uri: string; mimeType: string };
export type Meal = {
  id: string; childId: string; mealDate: string;
  mealType: typeof mealTypes[number]; setting: typeof mealSettings[number];
  photo: MealPhoto | null; foods: FoodItem[]; exposureFoodId: string | null; savedAt: string;
};

export const mealSteps = ['details', 'photo', 'preview', 'method', 'analyzing', 'analysis-error', 'foods', 'goal', 'complete'] as const;
export type MealStep = typeof mealSteps[number];
export type MealDraft = Omit<Meal, 'mealType' | 'setting' | 'savedAt'> & {
  mealType: Meal['mealType'] | null; setting: Meal['setting'] | null; step: MealStep;
  editingFood: FoodItem | null; savedMealId: string | null;
};
