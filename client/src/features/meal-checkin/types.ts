// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo

export type IngredientCatalogStatus = 'loading' | 'error' | 'ready';
export type IngredientInputStatus = IngredientCatalogStatus | 'empty' | 'choose' | 'no-match' | 'duplicate';

export type MealSuggestionOption = {
  id: string;
  title: string;
  description: string;
  servingTip?: string;
  ingredientId?: string | null;
  ingredientName?: string;
  mealDate?: string;
  mealType?: string;
};

export type MealSuggestionLinking = {
  step: 0 | 1 | 2;
  selectedSuggestion?: MealSuggestionOption;
  selectedFoodId: string;
  canContinue: boolean;
  onOpen: () => void;
  onBack: () => void;
  onSelectSuggestion: (id: string) => void;
  onSelectFood: (id: string) => void;
  onContinue: () => void;
  onUnlink: (id: string) => void;
};
