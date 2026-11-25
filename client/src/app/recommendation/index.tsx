// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 추천 카드 스와이프와 네이티브 뒤로가기 제스처 충돌 방지
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 식사 ID 없이 기존 추천 화면 열기

import { Stack } from 'expo-router';
import { RecommendationScreen } from '../../features/suggestions/screens/RecommendationScreen';

export default function RecommendationRoute() {
  return <>
    <Stack.Screen options={{ gestureEnabled: false }} />
    <RecommendationScreen />
  </>;
}
