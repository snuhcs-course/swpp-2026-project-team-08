// This Code is generated with AI

import type { RecommendationEvidence, SavedSuggestion } from '../types/home';
import type { ChildProfile, Language } from '../types/profile';
import { copyFor } from '../util/strings';

export function recommendationText(evidence: RecommendationEvidence, language: Language, profile: ChildProfile) {
  const s = copyFor(language).recommendation;
  return {
    title: s.action(evidence.foodName),
    description: evidence.difficulty && profile.presentation.includes('separate')
      ? s.whyPresentation(evidence.foodName)
      : evidence.outcome === 'tasted' ? s.whyTasted(evidence.foodName) : s.whyUntouched(evidence.foodName),
    servingTip: s.tip,
  };
}

export function savedSuggestionText(item: SavedSuggestion, language: Language, profile: ChildProfile) {
  return item.recommendation
    ? recommendationText(item.recommendation, language, profile)
    : { title: item.title, description: item.description, servingTip: item.servingTip };
}
