// This Code is generated with AI

import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../util/colors';
import { formStyles as styles } from './formStyles';
export function BottomSheet({
  title,
  children,
  onClose,
  closeLabel,
  variant = 'sheet',
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  variant?: 'sheet' | 'dialog';
  footer?: ReactNode;
}) {
  return (
    <Modal transparent animationType={variant === 'dialog' ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.scrim, variant === 'dialog' && styles.dialogScrim]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {variant === 'sheet' && <Pressable
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
        />}
        <SafeAreaView style={[styles.sheet, variant === 'dialog' && styles.dialog]} edges={variant === 'dialog' ? [] : ['bottom']}>
          <View style={styles.handle} />
          <View style={styles.row}>
            <Text
              accessibilityRole="header"
              style={[styles.heading, variant === 'dialog' && styles.dialogHeading, { flex: 1 }]}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={styles.close}
            >
              <Feather name="x" size={20} color={colors.homeText} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            {children}
          </ScrollView>
          {footer && <View style={styles.sheetFooter}>{footer}</View>}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
