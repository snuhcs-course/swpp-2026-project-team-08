export type MealSummary = { id: string; childId: string; mealDate: string };
export type ExposureSummary = { id: string; childId: string; foodName: string; stage: string; description?: string };
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
export type HomeRecords = { meals: MealSummary[]; exposures: ExposureSummary[]; suggestions: SavedSuggestion[] };
