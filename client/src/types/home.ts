// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 근거의 난이도 카테고리 타입을 문자열로 확장

export type MealSummary = { id: string; childId: string; mealDate: string };
export type RecommendationEvidence = {
  mealId: string;
  foodId: string;
  foodName: string;
  foodFormKey: string;
  reviewSavedAt: string;
  outcome: 'tasted' | 'untouched';
  // 저장된 옛 근거는 'shape'·'visibility' 를 담는다. 이 카테고리는 더 이상 없으므로 현재 추천으로 보지 않는다.
  difficulty?: string;
  kind: 'small-separate-portion';
};
export type SavedSuggestion = {
  id: string;
  childId: string;
  title: string;
  description: string;
  servingTip?: string;
  ingredients: string[];
  isSaved: boolean;
  safetyVerifiedForProfileAt: string;
  recommendation?: RecommendationEvidence;
};
export type HomeRecords = { meals: MealSummary[]; suggestions: SavedSuggestion[] };
