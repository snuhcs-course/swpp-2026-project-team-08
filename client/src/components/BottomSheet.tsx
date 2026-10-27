// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { useMemo, type ReactNode } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../util/colors';
import { formStyles as styles } from './formStyles';
import { fonts } from '../util/fonts';
import { UiAssetIcon } from './UiAssetIcon';
export function BottomSheet({
  title,
  children,
  onClose,
  closeLabel,
  variant = 'sheet',
  footer,
  headerContent,
  appearance,
  height,
  overlay,
  titleStyle,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  variant?: 'sheet' | 'dialog';
  footer?: ReactNode;
  headerContent?: ReactNode;
  appearance?: 'suggestion';
  height?: number;
  overlay?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
}) {
  const dismissGesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx),
    onPanResponderRelease: (_, gesture) => { if (gesture.dy > 72 || gesture.vy > 0.8) onClose(); },
  }), [onClose]);
  return (
    <Modal transparent animationType={variant === 'dialog' ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.scrim, appearance && design.scrim, variant === 'dialog' && styles.dialogScrim]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {variant === 'sheet' && <Pressable
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
        />}
        <SafeAreaView style={[styles.sheet, variant === 'dialog' && styles.dialog, appearance && design.sheet, height ? { height } : undefined]} edges={variant === 'dialog' ? [] : ['bottom']}>
          {variant === 'sheet' && <View {...dismissGesture.panHandlers} style={{ paddingVertical: 8, alignSelf: 'stretch', alignItems: 'center' }}><View style={styles.handle} /></View>}
          <View style={styles.row}>
            <Text
              accessibilityRole="header"
              style={[styles.heading, variant === 'dialog' && styles.dialogHeading, { flex: 1 }, appearance && design.title, titleStyle]}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={[styles.close, appearance && design.close]}
            >
              {appearance ? <UiAssetIcon name="suggestion-close" /> : <Feather name="x" size={20} color={colors.homeText} />}
            </Pressable>
          </View>
          {headerContent}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={height ? { flex: 1 } : undefined}
            contentContainerStyle={[styles.sheetContent, appearance && design.content]}
          >
            {children}
          </ScrollView>
          {footer && <View style={[styles.sheetFooter, appearance && design.footer]}>{footer}</View>}
          {overlay}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const design = StyleSheet.create({
  scrim: { backgroundColor: colors.suggestionOverlay },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 8 },
  title: { fontFamily: fonts.poppinsSemiBold, fontSize: 21, lineHeight: 27 },
  close: { width: 20, height: 20, borderRadius: 0, backgroundColor: colors.transparent },
  content: { paddingTop: 12, paddingBottom: 16, gap: 12 },
  footer: { paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.homeBorder },
});
