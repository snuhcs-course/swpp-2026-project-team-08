// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 선택지에서 재료 필드 제거

export type MealSuggestionOption = {
  id: string;
  title: string;
  description: string;
  servingTip?: string;
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
