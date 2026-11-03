// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식별자를 서버 StrEnum 과 맞는 소문자 snake_case 로 변경

// 앱 안의 값은 소문자 snake_case 이고, 서버와는 DTO 경계에서 대문자 값(`LACTO_VEGETARIAN`)으로 바꾼다.
export const dietaryPatternIds = [
  'vegan',
  'lacto_vegetarian',
  'ovo_vegetarian',
  'lacto_ovo_vegetarian',
  'pescatarian',
  'flexitarian',
  'no_specific_pattern',
] as const;

export type DietaryPattern = (typeof dietaryPatternIds)[number];
