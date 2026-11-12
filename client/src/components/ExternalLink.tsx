// AI-generated with GPT-6, 2026-11-12, reviewed by Seoyeon Heo
// Changed: 외부 링크 열기 및 실패 안내 공통 UI

import * as Linking from 'expo-linking';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, type StyleProp, type ViewStyle } from 'react-native';

export function ExternalLink({ href, errorMessage, style, children }: {
  href: string;
  errorMessage: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [opening, setOpening] = useState(false);
  async function open() {
    if (opening) return;
    setOpening(true);
    try {
      await Linking.openURL(href);
    } catch {
      Alert.alert(errorMessage);
    } finally {
      setOpening(false);
    }
  }
  return (
    <Pressable accessibilityRole="link" accessibilityState={{ busy: opening, disabled: opening }}
      disabled={opening} style={style} onPress={() => { void open(); }}>
      {children}
    </Pressable>
  );
}
