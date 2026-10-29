// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

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
