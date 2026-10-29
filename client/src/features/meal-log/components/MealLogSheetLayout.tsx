// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Three-height sheet interface with dismissal before navigation

import { useImperativeHandle, type ReactNode, type Ref } from 'react';
import { View } from 'react-native';
import { styles } from '../screens/mealLogStyles';

export type MealLogSheetHandle = { dismiss: (onDismissed: () => void) => void };

export type MealLogSheetLayoutProps = {
  ref?: Ref<MealLogSheetHandle>;
  children: ReactNode;
  sheet: ReactNode;
  controlsHeight: number;
  filtersHeight: number;
  onMinimumChange: (minimum: boolean) => void;
  active: boolean;
  onBack: () => void;
};

export function MealLogSheetLayout({ children, sheet, ref }: MealLogSheetLayoutProps) {
  useImperativeHandle(ref, () => ({ dismiss: onDismissed => onDismissed() }), []);
  return (
    <View style={styles.root}>
      {children}
      <View style={styles.webSheet}>{sheet}</View>
    </View>
  );
}
