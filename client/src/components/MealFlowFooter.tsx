// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식사 입력·식후 검토 하단 레이아웃 공통화

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export function MealFlowFooter({ children, style }: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0, gap: 10 },
});
