// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 사진 안내·미리보기 버튼 조정 및 식전·식후 사진 선택 디자인 통일
// AI-generated with GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 사진 확인에 비교 사진과 공통 교체·삭제 버튼 표시

import { useState } from 'react';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { AppIcon } from '../../../components/AppIcon';
import { formStyles as ui } from '../../../components/formStyles';
import { MealPhotoIntroCard } from '../../../components/MealPhotoIntroCard';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MealTextButton } from '../../../components/MealTextButton';
import { AfterMealPhotoPicker } from '../components/AfterMealPhotoPicker';
import { PhotoComparisonCard } from '../components/PhotoComparisonCard';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'picking' | 'photoError' |
  'onPick' | 'onRemovePhoto' | 'onFullPhoto' | 'onImageError' |
  'onManual' | 'onSaveExit'>;

export function AfterMealPhotoStepsView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const [replaceOpen, setReplaceOpen] = useState(false);
  const photoLabels = { camera: s.mealCheckin.camera, gallery: s.mealCheckin.gallery, files: s.mealCheckin.files };
  const picker = <AfterMealPhotoPicker labels={photoLabels} fileHint={m.fileHint} picking={p.picking} onPick={(source) => { setReplaceOpen(false); p.onPick(source); }} />;
  const photoError = p.photoError && (
    <Text accessibilityRole="alert" style={styles.error}>{p.photoError === 'permission' ? m.permission : m.imageError}</Text>
  );

  if (p.draft.step === 'photo') return (
    <View style={[styles.stack, styles.photoStack]}>
      <MealPhotoIntroCard title={m.photoIntro} subtitle={m.photoRequirement} />
      {picker}
      {photoError}
      <Pressable accessibilityRole="button" onPress={p.onManual} style={styles.manualRoute}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.manualRouteLabel}>{m.noPhoto}</Text>
          <Text style={ui.muted}>{abcCopyFor(p.language).enterOutcomes}</Text>
        </View>
        <AppIcon name="next" size={16} />
      </Pressable>
      <MealTextButton label={abcCopyFor(p.language).saveExit} onPress={p.onSaveExit} />
      <Text style={styles.autoSave}>{m.draftSaved}</Text>
    </View>
  );

  if (!p.draft.afterPhoto) return null;

  return (
    <View style={styles.stack}>
      <PhotoComparisonCard
        before={p.meal.photo} after={p.draft.afterPhoto}
        beforeLabel={s.mealCheckin.beforeMealBadge} afterLabel={s.mealCheckin.afterMealBadge}
        missingBeforeLabel={m.missingBefore} enlargeLabel={m.enlarge}
        onEnlarge={p.onFullPhoto} onAfterImageError={p.onImageError}
      />
      <View style={styles.actions}>
        <MealTextButton icon={<UiAssetIcon name="meal-refresh" />} label={m.replace} onPress={() => setReplaceOpen((value) => !value)} />
        <MealTextButton icon={<UiAssetIcon name="meal-trash" />} label={m.removePhoto} onPress={p.onRemovePhoto} labelStyle={{ color: colors.error }} />
      </View>
      {replaceOpen && picker}
      {photoError}
    </View>
  );
}

const styles = StyleSheet.create({
  manualRoute: { height: 60, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  manualRouteLabel: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  stack: { flex: 1, gap: 12, paddingBottom: 8 },
  photoStack: { gap: 16 },
  autoSave: { marginTop: 'auto', paddingTop: 24, color: colors.mealReviewMuted, textAlign: 'center', fontSize: 14, fontFamily: fonts.interRegular },
  actions: { gap: 10 },
  error: { color: colors.error, fontSize: 14, fontFamily: fonts.interMedium },
});
