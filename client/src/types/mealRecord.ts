import type { Ingredient, IngredientDraft } from './ingredientRecord';
import type { MealReview } from './reviewRecord';
import type { SuggestionMealLink } from './suggestionRecord';
import type {
  CookingMethod,
  DateString,
  Id,
  IngredientId,
  MealLocation,
  MealType,
  TimestampString,
} from './recordValues';

export type FoodItem = {
  id: Id;
  mealId: Id;
  name: string;
  ingredients: Ingredient[];
  cookingMethod: CookingMethod | null;
  servingNote: string | null;
  acceptance: number | null;
};

export type FoodDraft = {
  id: Id;
  name: string;
  ingredients: IngredientDraft[];
  cookingMethod: CookingMethod | null;
  servingNote: string | null;
  acceptance: number | null;
};

export type SuggestionLinkDraft = {
  suggestionId: Id;
  foodId: Id;
  ingredientId: IngredientId | null;
};

export type MealDraft = {
  mealDate: DateString;
  mealType: MealType;
  setting: MealLocation;
  beforePhotoUri: string | null;
  foods: FoodDraft[];
  suggestionLinks: SuggestionLinkDraft[];
};

export type Meal = {
  id: Id;
  userId: Id;
  mealDate: DateString;
  mealType: MealType;
  setting: MealLocation;
  beforePhotoUri: string | null;
  afterPhotoUri: string | null;
  savedAt: TimestampString;
};

export type MealDetail = Meal & {
  foods: FoodItem[];
  review: MealReview | null;
  suggestionLinks: SuggestionMealLink[];
};
