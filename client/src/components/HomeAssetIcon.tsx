// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import { Image } from 'expo-image';
const assets = {
  camera: [require('../../assets/ui/home-camera.svg'), 18, 18],
  review: [require('../../assets/ui/home-review-arrow.svg'), 18, 18],
  suggestion: [require('../../assets/ui/home-suggestion.svg'), 40, 40],
  chevron: [require('../../assets/ui/home-chevron.svg'), 16, 16],
  prev: [require('../../assets/ui/home-calendar-prev.svg'), 18, 18],
  next: [require('../../assets/ui/home-calendar-next.svg'), 18, 18],
  caret: [require('../../assets/ui/home-calendar-caret.svg'), 12, 12],
  density1: [require('../../assets/ui/home-density-1.svg'), 15, 15],
  density2: [require('../../assets/ui/home-density-2.svg'), 15, 15],
  density3: [require('../../assets/ui/home-density-3.svg'), 15, 15],
  today: [require('../../assets/ui/home-tab-0.svg'), 20, 20],
  mealLog: [require('../../assets/ui/home-tab-1.svg'), 5.55556, 13],
  ideas: [require('../../assets/ui/home-tab-3.svg'), 20, 20],
  insight: [require('../../assets/ui/home-tab-4.svg'), 21.7, 21.7],
  profile: [require('../../assets/ui/home-tab-5.svg'), 12.5, 11.1111],
} as const;
export function HomeAssetIcon({ name }: { name: keyof typeof assets }) {
  const [source, width, height] = assets[name];
  return <Image source={source} style={{ width, height }} contentFit="contain" />;
}
