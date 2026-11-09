// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 식사 기록 화면 디자인 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 식사 기록의 어려움 사유에 세부 항목 보존

import type { Outcome } from '../../types/afterMealReview';
import type { Meal } from '../../types/meal';

export type MealRecord = {
  id: string;
  mealDate: string;
  mealType: Meal['mealType'];
  setting: Meal['setting'];
  beforePhotoUri: string | null;
  afterPhotoUri: string | null;
  foods: { name: string; ingredients: string[] }[];
  reviewStatus: 'awaiting_review' | 'reviewed';
};

export type FoodResponseCard = {
  foodId: string;
  kind: 'food' | 'ingredient';
  parentName: string | null;
  name: string;
  ingredients: string[];
  preparation: string;
  servingNote: string;
  outcome: Outcome | null;
  reasons: { category: string; value: string; subcategory?: string | null; note?: string }[];
  suggestion: { managed?: boolean; id: string; title: string; description: string; servingTip: string | null } | null;
};
