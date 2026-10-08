export type MealSummary = { id: string; childId: string; mealDate: string };
export type ExposureSummary = { id: string; childId: string; foodName: string; stage: string; description?: string };
export type SavedSuggestion = { id: string; childId: string; title: string; description: string; ingredients: string[]; isSaved: boolean; safetyVerifiedForProfileAt: string };
export type HomeRecords = { meals: MealSummary[]; exposures: ExposureSummary[]; suggestions: SavedSuggestion[] };
