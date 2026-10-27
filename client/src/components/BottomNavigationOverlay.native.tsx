// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Keep existing bottom navigation visible above iOS native sheets

import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { bottomNavigationHeight } from './BottomNavigation';
import type { BottomNavigationOverlayProps } from './BottomNavigationOverlay';

export function BottomNavigationOverlay({ children, overSheet }: BottomNavigationOverlayProps) {
  const insets = useSafeAreaInsets();
  if (!overSheet || Platform.OS !== 'ios') return <>{children}</>;

  return (
    <>
      <View style={{ height: bottomNavigationHeight(insets.bottom) }} />
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal={false}>
        <View style={styles.bar}>{children}</View>
      </FullWindowOverlay>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
