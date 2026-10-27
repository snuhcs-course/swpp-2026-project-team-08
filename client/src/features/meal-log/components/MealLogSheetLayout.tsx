// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Meal History sheet layout with a web fallback

import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from '../screens/mealLogStyles';

export type MealLogSheetLayoutProps = {
  children: ReactNode;
  sheet: ReactNode;
  controlsHeight: number;
  active: boolean;
  onBack: () => void;
};

export function MealLogSheetLayout({ children, sheet }: MealLogSheetLayoutProps) {
  return (
    <View style={styles.root}>
      {children}
      <View style={styles.webSheet}>{sheet}</View>
    </View>
  );
}
