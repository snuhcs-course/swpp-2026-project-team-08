// AI-generated with Grok 4.6, 2026-10-19, reviewed by Doyeon Kim

import { Redirect } from 'expo-router';
import { PreviewMealHistoryScreen } from '../features/meal-log/screens/PreviewMealHistoryScreen';

export default function PreviewMealHistoryRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <PreviewMealHistoryScreen />;
}
