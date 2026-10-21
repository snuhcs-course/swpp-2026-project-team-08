// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
import type { Outcome } from '../../types/afterMealReview';

export type FoodResponseCard = {
  foodId: string;
  kind: 'food' | 'ingredient';
  parentName: string | null;
  name: string;
  ingredients: string[];
  preparation: string;
  servingNote: string;
  outcome: Outcome | null;
  reasons: { category: string; value: string; note?: string }[];
  suggestion: { id: string; title: string; description: string; servingTip: string | null } | null;
};
