// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Three-height native sheet with instant transitions and safe navigation

import { useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';
import { topBarLayout } from '../../../components/AppHeader';
import { bottomNavigationHeight } from '../../../components/BottomNavigation';
import { colors } from '../../../util/colors';
import { styles } from '../screens/mealLogStyles';
import { useMealLogSheetDismissal } from '../hooks/useMealLogSheetDismissal';
import type { MealLogSheetLayoutProps } from './MealLogSheetLayout';

export function MealLogSheetLayout({
  children, sheet, controlsHeight, filtersHeight, onMinimumChange, active, onBack, ref,
}: MealLogSheetLayoutProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [stackHeight, setStackHeight] = useState(0);
  const dismissal = useMealLogSheetDismissal(active && stackHeight > 0 && controlsHeight > 0, ref);
  // UIKit presents in the window; Android's BottomSheetBehavior uses this stack's bounds.
  const availableHeight = Platform.OS === 'ios' ? height - insets.top : stackHeight;
  // UIKit supplies the home-indicator inset separately from the detent's content height.
  const navigationInset = Platform.OS === 'ios'
    ? bottomNavigationHeight(insets.bottom) - insets.bottom : 0;
  const minimumHeight = styles.sheetContent.paddingTop + filtersHeight
    + styles.sheetFilters.paddingBottom + navigationInset;
  const minimumDetent = availableHeight > 0 ? Math.min(0.7, minimumHeight / availableHeight) : 0.2;
  const previousCompactDetent = availableHeight > 0
    ? Math.min(0.5, Math.max(270 / availableHeight,
      (availableHeight - topBarLayout.height - controlsHeight - 16) / availableHeight))
    : 0.3;
  const compactDetent = Math.min(0.85, Math.max(minimumDetent + 0.05, previousCompactDetent));

  return (
    <View style={layout.root} onLayout={event => setStackHeight(event.nativeEvent.layout.height)}>
      <ScreenStack style={layout.root} onFinishTransitioning={dismissal.onFinishTransitioning}>
        <ScreenStackItem screenId="meal-history-calendar" activityState={2}
          headerConfig={{ hidden: true }} contentStyle={layout.root}>
          {children}
        </ScreenStackItem>
        {dismissal.visible && (
          <ScreenStackItem screenId="meal-history-logs" activityState={2}
            headerConfig={{ hidden: true }} contentStyle={layout.root}
            stackPresentation="formSheet"
            stackAnimation="none"
            sheetAllowedDetents={[minimumDetent, compactDetent, 0.9]}
            sheetInitialDetentIndex={0}
            onSheetDetentChanged={({ nativeEvent }) => {
              if (nativeEvent.index >= 0) onMinimumChange(nativeEvent.index === 0);
            }}
            sheetLargestUndimmedDetentIndex="last"
            sheetGrabberVisible
            sheetCornerRadius={24}
            sheetExpandsWhenScrolledToEdge
            gestureEnabled={false}
            preventNativeDismiss
            onAppear={dismissal.onAppear}
            onDismissed={() => {
              if (dismissal.onNativeDismissed()) onBack();
            }}>
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
