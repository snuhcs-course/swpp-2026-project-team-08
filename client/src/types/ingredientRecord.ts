import type { IngredientId } from './recordValues';

export type Ingredient = {
  id: IngredientId;
  name: string;
};

export type IngredientDraft = {
  id: IngredientId | null;
  name: string;
};
