export type Id = string;
export type IngredientId = Id;
export type DateString = string;
export type TimestampString = string;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealLocation = 'home' | 'restaurant' | 'school' | 'others';
export type CookingMethod =
  | 'raw'
  | 'boiled'
  | 'steamed'
  | 'pan_fried'
  | 'stir_fried'
  | 'baked_roasted'
  | 'mashed_blended'
  | 'other';
