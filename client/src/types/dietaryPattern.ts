// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장

export const dietaryPatternIds = [
  'vegan',
  'lacto-vegetarian',
  'ovo-vegetarian',
  'lacto-ovo-vegetarian',
  'pescatarian',
  'flexitarian',
  'no-specific-pattern',
] as const;

export type DietaryPattern = (typeof dietaryPatternIds)[number];
