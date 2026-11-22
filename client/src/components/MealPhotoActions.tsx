// AI-generated with GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 식전·식후 사진 교체·삭제 버튼과 사진 선택 시트 공유

import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Language } from '../types/profile';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { copyFor } from '../util/strings';
import { AppButton } from './AppButton';
import { UiAssetIcon } from './UiAssetIcon';

type Props = {
  language: Language;
  sheetTitle: string;
  sheetOpen: boolean;
  onReplace: () => void;
  onClose: () => void;
  onRemove: () => void;
  children: ReactNode;
};

export function MealPhotoActions({ language, sheetTitle, sheetOpen, onReplace, onClose, onRemove, children }: Props) {
  const { mealCheckin, common } = copyFor(language);
  return (
    <>
      <View style={styles.actions}>
        <AppButton variant="meal" secondary style={styles.fill} icon={<UiAssetIcon name="meal-refresh" />}
          label={mealCheckin.replace} onPress={onReplace} />
        <Pressable accessibilityRole="button" accessibilityLabel={mealCheckin.removePhoto} onPress={onRemove} style={styles.remove}>
          <UiAssetIcon name="meal-trash" />
          <Text style={styles.removeText}>{mealCheckin.removePhoto}</Text>
        </Pressable>
      </View>
      {sheetOpen && (
        <Modal transparent animationType="slide" onRequestClose={onClose}>
          <View style={styles.overlay}>
            <Pressable accessibilityRole="button" accessibilityLabel={common.close} style={styles.fill} onPress={onClose} />
            <SafeAreaView edges={['bottom']} style={styles.sheet}>
              <View style={styles.handle} />
              <Text accessibilityRole="header" style={styles.title}>{sheetTitle}</Text>
              {children}
              <AppButton secondary label={mealCheckin.cancel} onPress={onClose} style={styles.cancel} labelStyle={styles.cancelText} />
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  fill: { flex: 1 },
  remove: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.safetySurface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  removeText: { color: colors.error, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  overlay: { flex: 1, backgroundColor: colors.photoSourceOverlay, justifyContent: 'flex-end' },
  sheet: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 8, gap: 12, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 36, height: 4, borderRadius: 999, backgroundColor: colors.homeBorder, alignSelf: 'center' },
  title: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 16, lineHeight: 24 },
  cancel: { height: 44, minHeight: 44, borderRadius: 10, borderColor: colors.mealReviewBorder },
  cancelText: { color: colors.photoSourceCancel, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
});
