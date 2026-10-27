// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

export type MealSummary = { id: string; childId: string; mealDate: string };
export type RecommendationEvidence = {
  mealId: string;
  foodId: string;
  foodName: string;
  foodFormKey: string;
  reviewSavedAt: string;
  outcome: 'tasted' | 'untouched';
  difficulty?: 'shape' | 'visibility';
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
