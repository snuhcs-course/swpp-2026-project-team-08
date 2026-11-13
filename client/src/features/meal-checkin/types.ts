// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 선택지에서 재료 필드 제거
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결

export type MealSuggestionOption = {
  id: string;
  title: string;
  description: string;
  servingTip?: string;
  mealDate?: string;
  mealType?: string;
};

export type MealSuggestionLinking = {
  pickerOpen: boolean;
  selectedSuggestionId: string;
  canOpenPicker: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelectSuggestion: (id: string) => void;
  onLink: (foodId: string) => void;
  onUnlink: (suggestionId: string) => void;
};
