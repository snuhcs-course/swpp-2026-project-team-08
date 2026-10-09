// This Code is generated with AI

import { Image } from 'expo-image';

const iconAssets = {
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
  'trait-leaf': require('../../assets/ui/trait-leaf.svg'),
  'trait-droplet': require('../../assets/ui/trait-droplet.svg'),
  'trait-sparkles': require('../../assets/ui/trait-sparkles.svg'),
  'trait-wind': require('../../assets/ui/trait-wind.svg'),
  'trait-square': require('../../assets/ui/trait-square.svg'),
  'trait-check-circle': require('../../assets/ui/trait-check-circle.svg'),
  'trait-eye': require('../../assets/ui/trait-eye.svg'),
  'trait-sun': require('../../assets/ui/trait-sun.svg'),
} as const;

export type UiAssetIconName = keyof typeof iconAssets;

const size: Record<UiAssetIconName, number> = {
  'meal-maximize': 15, 'meal-refresh': 17, 'meal-trash': 17, 'meal-lock': 15,
  'meal-check': 17, 'meal-sparkles': 17, 'meal-arrow-right': 17, 'meal-plus': 17,
  'meal-manual': 18,
  'meal-selection-check': 12,
  'onboarding-cloud-check': 13, 'onboarding-shield': 13, 'onboarding-calendar': 13,
  'review-shield': 14, 'review-users': 14, 'review-filter': 14,
  'review-sparkles': 14, 'review-heart': 14, 'review-utensils': 14,
  'review-info': 14, 'review-route': 14, 'review-calendar': 14,
  'trait-leaf': 10, 'trait-droplet': 10, 'trait-sparkles': 10, 'trait-wind': 10,
  'trait-square': 10, 'trait-check-circle': 10, 'trait-eye': 10, 'trait-sun': 10,
};

export function UiAssetIcon({ name }: { name: UiAssetIconName }) {
  return <Image source={iconAssets[name]} style={{ width: size[name], height: size[name] }} contentFit="contain" />;
}
