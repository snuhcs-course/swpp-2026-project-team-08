// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 사진 안내·미리보기 버튼 조정 및 식전·식후 사진 선택 디자인 통일

import { useState } from 'react';
import { HeightFitPhoto } from '../../../components/HeightFitPhoto';
import { AppIcon } from '../../../components/AppIcon';
import { formStyles as ui } from '../../../components/formStyles';
import { MealPhotoIntroCard } from '../../../components/MealPhotoIntroCard';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
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

  if (p.draft.step === 'preview') return (
    <View style={styles.stack}>
      <Text style={styles.title}>{m.photoLabel}</Text>
      {p.draft.afterPhoto && (
        <Pressable accessibilityRole="button" accessibilityLabel={m.enlarge} onPress={() => p.onFullPhoto('after')}>
          <View style={styles.preview}><HeightFitPhoto uri={p.draft.afterPhoto.uri} height={316} onError={p.onImageError} /></View>
          <View style={styles.enlargeRow}><UiAssetIcon name="meal-maximize" /><Text style={styles.enlarge}>{s.mealCheckin.fullPhoto}</Text></View>
        </Pressable>
      )}
      <View style={styles.actions}>
        <MealTextButton icon={<UiAssetIcon name="meal-refresh" />} label={m.replace} onPress={() => setReplaceOpen((value) => !value)} />
        <MealTextButton icon={<UiAssetIcon name="meal-trash" />} label={m.removePhoto} onPress={p.onRemovePhoto} labelStyle={{ color: colors.error }} />
      </View>
      {replaceOpen && picker}
      {!p.meal.photo && <View style={styles.info}><UiAssetIcon name="meal-lock" /><Text style={styles.infoText}>{m.photoLocal}</Text></View>}
      {photoError}
    </View>
  );

  const comparison = p.meal.photo && p.draft.afterPhoto
    ? <PhotoComparisonCard before={p.meal.photo} after={p.draft.afterPhoto} beforeLabel={m.before} afterLabel={m.after} enlargeLabel={m.enlarge} onEnlarge={p.onFullPhoto} />
    : <Text style={styles.error}>{m.missingBefore}</Text>;

  return (
    <View style={styles.stack}>
      {comparison}
    </View>
  );
}

const styles = StyleSheet.create({
  enlargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  manualRoute: { height: 60, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  manualRouteLabel: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  stack: { flex: 1, gap: 12, paddingBottom: 8 },
  photoStack: { gap: 16 },
  title: { color: colors.homeText, fontSize: 24, fontFamily: fonts.poppinsSemiBold },
  autoSave: { marginTop: 'auto', paddingTop: 24, color: colors.mealReviewMuted, textAlign: 'center', fontSize: 14, fontFamily: fonts.interRegular },
  preview: { height: 318, overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, width: '100%' },
  enlarge: { color: colors.homePrimary, textAlign: 'center', fontSize: 14, fontFamily: fonts.interMedium, marginTop: 5 },
  actions: { gap: 10 },
  info: { flexDirection: 'row', gap: 8, backgroundColor: colors.calendarEmpty, padding: 11, borderRadius: 11 },
  infoText: { flex: 1, color: colors.homeText, fontSize: 14, lineHeight: 20, fontFamily: fonts.interRegular },
  error: { color: colors.error, fontSize: 14, fontFamily: fonts.interMedium },
  center: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  failure: { backgroundColor: colors.safetySurface, borderRadius: 13, padding: 12, gap: 4 },
  failureTitle: { color: colors.error, fontFamily: fonts.interBold, fontSize: 16 },
});
