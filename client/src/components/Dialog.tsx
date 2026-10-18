// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

/** Centered modal. Sheet gestures and grab handles do not belong to a dialog. */
export function Dialog({ title, closeLabel, onClose, children, footer, compact = false, titleStyle }: {
  title: string; closeLabel: string; onClose: () => void; children: ReactNode;
  footer?: ReactNode; compact?: boolean; titleStyle?: StyleProp<TextStyle>;
}) {
  return <Modal transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View accessibilityViewIsModal style={[styles.dialog, compact && styles.compact]}>
        <View style={[styles.header, compact && styles.compactHeader]}>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle, titleStyle]}>{title}</Text>
          {!compact && <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={[styles.content, compact && styles.compactContent]}>{children}</ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, backgroundColor: colors.overlay },
  dialog: { width: '100%', maxWidth: 374, maxHeight: '88%', borderRadius: 28, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.surface, paddingHorizontal: 15, paddingVertical: 17, gap: 21, shadowColor: colors.navy, shadowOpacity: 0.31, shadowRadius: 28, shadowOffset: { width: 0, height: -8 }, elevation: 12 },
  compact: { maxWidth: 342, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 24, gap: 12 },
  header: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactHeader: { minHeight: 0 },
  title: { flex: 1, color: colors.homeText, fontFamily: fonts.poppinsBold, fontSize: 18, lineHeight: 26 },
  compactTitle: { textAlign: 'center', fontFamily: fonts.poppinsSemiBold, lineHeight: 25.2 },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.homeText, fontFamily: fonts.poppinsMedium, fontSize: 32, lineHeight: 35 },
  scroll: { flexShrink: 1 },
  content: { gap: 21 },
  compactContent: { gap: 12 },
  footer: { gap: 8 },
});
