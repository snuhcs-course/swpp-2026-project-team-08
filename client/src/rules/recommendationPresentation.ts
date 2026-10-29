// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import type { RecommendationEvidence, SavedSuggestion } from '../types/home';
import type { Language } from '../types/profile';
import { copyFor } from '../util/strings';

export function recommendationText(evidence: RecommendationEvidence, language: Language) {
  const s = copyFor(language).recommendation;
  return {
    title: s.action(evidence.foodName),
    description: evidence.outcome === 'tasted' ? s.whyTasted(evidence.foodName) : s.whyUntouched(evidence.foodName),
    servingTip: s.tip,
  };
}

export function savedSuggestionText(item: SavedSuggestion, language: Language) {
  return item.recommendation
    ? recommendationText(item.recommendation, language)
    : { title: item.title, description: item.description, servingTip: item.servingTip };
}
