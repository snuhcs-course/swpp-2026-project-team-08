// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import type { Meal } from './meal';

export type SuggestionTry = {
  id: string;
  meal_id: string;
  target_id: string;
  tried_on: string;
  meal_type: Meal['mealType'] | null;
  feedback: 'helpful' | 'not_helpful' | 'not_sure' | null;
  linked_available: boolean;
};
export type Suggestion = {
  id: string;
  child_id: string;
  meal_id: string;
  food_id: string;
  revision: string;
  content: {
    food_id: string;
    food_name: string;
    ingredients: string[];
    preparation: string;
    meal_date: string;
    meal_type: string;
    what_to_try: string;
    why_this_may_help: string;
    serving_tip: string;
    linked_reason: { category?: string; value?: string; note?: string }[];
  };
  status: 'pending' | 'saved' | 'dismissed';
  dismiss_reasons: string[];
  saved_at: string | null;
  created_at: string;
  version: number;
  tries: SuggestionTry[];
};
export type SuggestionBatch = {
  revision: string;
  selected_food_ids: string[];
  items: Suggestion[];
};
export type EligibleMeal = {
  id: string;
  meal_date: string;
  meal_type: string;
  reviewed: boolean;
  foods: string[];
  targets: { id: string; name: string; food_id: string }[];
};
export type DismissReason = 'restriction_conflict' | 'disliked_food_or_form' | 'food_preferences'
  | 'too_much_preparation' | 'ingredient_unavailable' | 'already_tried';
export type SuggestionDecision = {
  action_id: string;
  version: number;
  status: 'saved' | 'dismissed';
  reasons: DismissReason[];
};
