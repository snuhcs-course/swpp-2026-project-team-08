// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Present meal logs with the OS native sheet and interactive background

import { useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';
import { topBarLayout } from '../../../components/AppHeader';
import { colors } from '../../../util/colors';
import type { MealLogSheetLayoutProps } from './MealLogSheetLayout';

export function MealLogSheetLayout({
  children, sheet, controlsHeight, active, onBack,
}: MealLogSheetLayoutProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [stackHeight, setStackHeight] = useState(0);
  // UIKit presents in the window; Android's BottomSheetBehavior uses this stack's bounds.
  const availableHeight = Platform.OS === 'ios' ? height - insets.top : stackHeight;
  const compactDetent = availableHeight > 0
    ? Math.min(0.5, Math.max(200 / availableHeight,
      (availableHeight - topBarLayout.height - controlsHeight - 16) / availableHeight))
    : 0.3;

  return (
    <View style={layout.root} onLayout={event => setStackHeight(event.nativeEvent.layout.height)}>
      <ScreenStack style={layout.root}>
        <ScreenStackItem screenId="meal-history-calendar" activityState={2}
          headerConfig={{ hidden: true }} contentStyle={layout.root}>
          {children}
        </ScreenStackItem>
        {active && stackHeight > 0 && controlsHeight > 0 && (
          <ScreenStackItem screenId="meal-history-logs" activityState={2}
            headerConfig={{ hidden: true }} contentStyle={layout.root}
            stackPresentation="formSheet"
            sheetAllowedDetents={[compactDetent, 0.9]}
            sheetInitialDetentIndex={0}
            sheetLargestUndimmedDetentIndex="last"
            sheetGrabberVisible
            sheetCornerRadius={24}
            sheetExpandsWhenScrolledToEdge
            gestureEnabled={false}
            preventNativeDismiss
            onDismissed={onBack}>
            {Platform.OS === 'android' ? (
              <View style={layout.root}>
                {sheet}
                <View pointerEvents="none" style={layout.androidGrabber} />
              </View>
            ) : sheet}
          </ScreenStackItem>
        )}
      </ScreenStack>
    </View>
  );
}

const layout = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  androidGrabber: {
    position: 'absolute', top: 10, alignSelf: 'center',
    width: 36, height: 5, borderRadius: 3, backgroundColor: colors.homeText,
  },
});
