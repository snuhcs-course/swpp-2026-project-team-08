// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 조리법 열 가지 ID와 타입을 한 목록으로 정의

export type Id = string;
export type IngredientId = Id;
export type DateString = string;
export type TimestampString = string;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealLocation = 'home' | 'restaurant' | 'school' | 'others';
export const cookingMethodIds = [
  'raw', 'boiled', 'steamed', 'pan_fried', 'stir_fried',
  'baked', 'roasted', 'mashed', 'blended', 'other',
] as const;
export type CookingMethod = (typeof cookingMethodIds)[number];
