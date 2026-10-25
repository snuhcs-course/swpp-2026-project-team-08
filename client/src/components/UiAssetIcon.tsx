// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import { Image } from 'expo-image';

const iconAssets = {
  'outcome-help': require('../../assets/ui/outcome-help.svg'),
  'meal-save-error': require('../../assets/ui/meal-save-error.svg'),
  'difficulty-texture': require('../../assets/ui/difficulty-texture.svg'),
  'difficulty-taste': require('../../assets/ui/difficulty-taste.svg'),
  'difficulty-smell': require('../../assets/ui/difficulty-smell.svg'),
  'difficulty-color': require('../../assets/ui/difficulty-color.svg'),
  'difficulty-piece': require('../../assets/ui/difficulty-piece.svg'),
  'difficulty-arrangement': require('../../assets/ui/difficulty-arrangement.svg'),
  'difficulty-temperature': require('../../assets/ui/difficulty-temperature.svg'),
  'difficulty-unsure': require('../../assets/ui/difficulty-unsure.svg'),

  'meal-saved-check': require('../../assets/ui/meal-saved-check.svg'),
  'onboarding-edit': require('../../assets/ui/onboarding-edit.png'),
  'abc-add-food': require('../../assets/ui/abc-add-food.svg'),
  'abc-select': require('../../assets/ui/abc-select.svg'),
  'abc-utensils': require('../../assets/ui/abc-utensils.svg'),
  'abc-chevron': require('../../assets/ui/abc-chevron.svg'),
  'abc-trash': require('../../assets/ui/abc-trash.svg'),
  'abc-edit': require('../../assets/ui/abc-edit.svg'),
  'abc-open': require('../../assets/ui/abc-open.svg'),
  'suggestion-close': require('../../assets/ui/suggestion-close.svg'),
  'suggestion-checked': require('../../assets/ui/suggestion-checked.svg'),
  'suggestion-complete': require('../../assets/ui/suggestion-complete.svg'),
  'suggestion-empty': require('../../assets/ui/suggestion-empty.svg'),
  'suggestion-success': require('../../assets/ui/suggestion-success.svg'),
  'suggestion-alert': require('../../assets/ui/suggestion-alert.svg'),
  'suggestion-loader': require('../../assets/ui/suggestion-loader.svg'),

  'suggestion-back': require('../../assets/ui/suggestion-back.svg'),
  'suggestion-open': require('../../assets/ui/suggestion-open.svg'),
  'suggestion-dismiss': require('../../assets/ui/suggestion-dismiss.svg'),
  'suggestion-save': require('../../assets/ui/suggestion-save.svg'),
  'suggestion-edit': require('../../assets/ui/suggestion-edit.svg'),
  'suggestion-link': require('../../assets/ui/suggestion-link.svg'),
  'meal-maximize': require('../../assets/ui/meal-maximize.svg'),
  'meal-refresh': require('../../assets/ui/meal-refresh.svg'),
  'meal-trash': require('../../assets/ui/meal-trash.svg'),
  'meal-lock': require('../../assets/ui/meal-lock.svg'),
  'meal-check': require('../../assets/ui/meal-check.svg'),
  'meal-sparkles': require('../../assets/ui/meal-sparkles.svg'),
  'meal-arrow-right': require('../../assets/ui/meal-arrow-right.svg'),
  'meal-plus': require('../../assets/ui/meal-plus.svg'),
  'meal-manual': require('../../assets/ui/meal-manual.svg'),
  'meal-selection-check': require('../../assets/ui/meal-selection-check.svg'),
  'onboarding-cloud-check': require('../../assets/ui/onboarding-cloud-check.svg'),
  'onboarding-shield': require('../../assets/ui/onboarding-shield.svg'),
  'onboarding-calendar': require('../../assets/ui/onboarding-calendar.svg'),
  'review-shield': require('../../assets/ui/review-shield.svg'),
  'review-users': require('../../assets/ui/review-users.svg'),
  'review-filter': require('../../assets/ui/review-filter.svg'),
  'review-sparkles': require('../../assets/ui/review-sparkles.svg'),
  'review-heart': require('../../assets/ui/review-heart.svg'),
  'review-utensils': require('../../assets/ui/review-utensils.svg'),
  'review-info': require('../../assets/ui/review-info.svg'),
  'review-route': require('../../assets/ui/review-route.svg'),
  'review-calendar': require('../../assets/ui/review-calendar.svg'),
} as const;

export type UiAssetIconName = keyof typeof iconAssets;

const size: Record<UiAssetIconName, number> = {
  'outcome-help': 20,
  'meal-save-error': 28,
  'difficulty-texture': 12,
  'difficulty-taste': 12,
  'difficulty-smell': 12,
  'difficulty-color': 12,
  'difficulty-piece': 12,
  'difficulty-arrangement': 12,
  'difficulty-temperature': 12,
  'difficulty-unsure': 12,

  'meal-saved-check': 28, 'onboarding-edit': 15, 'abc-add-food': 12.3333, 'abc-select': 14, 'abc-utensils': 13,
  'abc-chevron': 16, 'abc-trash': 16, 'abc-edit': 16, 'abc-open': 16,
  'suggestion-close': 20,
  'suggestion-checked': 15,
  'suggestion-complete': 28,
  'suggestion-empty': 48,
  'suggestion-success': 28,
  'suggestion-alert': 28,
  'suggestion-loader': 18,

  'suggestion-back': 18, 'suggestion-open': 14,
  'suggestion-dismiss': 20, 'suggestion-save': 20,
  'suggestion-edit': 14,
  'suggestion-link': 13,
  'meal-maximize': 15, 'meal-refresh': 17, 'meal-trash': 17, 'meal-lock': 15,
  'meal-check': 17, 'meal-sparkles': 17, 'meal-arrow-right': 17, 'meal-plus': 17,
  'meal-manual': 18,
  'meal-selection-check': 12,
  'onboarding-cloud-check': 13, 'onboarding-shield': 13, 'onboarding-calendar': 13,
  'review-shield': 14, 'review-users': 14, 'review-filter': 14,
  'review-sparkles': 14, 'review-heart': 14, 'review-utensils': 14,
  'review-info': 14, 'review-route': 14, 'review-calendar': 14,
};

export function UiAssetIcon({ name }: { name: UiAssetIconName }) {
  return <Image source={iconAssets[name]} style={{ width: size[name], height: size[name] }} contentFit="contain" />;
}
