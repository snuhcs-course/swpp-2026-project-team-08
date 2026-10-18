// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match optional photo source and preview screens
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; revised manual after-meal flow
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { useState } from 'react';
import { HeightFitPhoto } from '../../../components/HeightFitPhoto';
import { AppIcon } from '../../../components/AppIcon';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { AfterMealPhotoPicker } from '../components/AfterMealPhotoPicker';
import { PhotoComparisonCard } from '../components/PhotoComparisonCard';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'picking' | 'photoError' |
  'onPick' | 'onRemovePhoto' | 'onFullPhoto' | 'onImageError' |
  'onManual' | 'onGo' | 'onSaveExit'>;

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
    <View style={styles.stack}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{m.photoIntro}</Text>
        <Text style={styles.heroSubtitle}>{m.photoRequirement}</Text>

      </View>
      {picker}
      {photoError}
      <Pressable accessibilityRole="button" onPress={p.onManual} style={styles.manualRoute}>
        <View style={styles.sourceIcon}><AppIcon name="gallery" size={18} /></View>
        <View style={{ flex: 1 }}><Text style={styles.manualLabel}>{m.noPhoto}</Text><Text style={styles.manualHint}>{abcCopyFor(p.language).enterOutcomes}</Text></View>
        <AppIcon name="next" size={16} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={p.onSaveExit} style={styles.saveExit}><Text style={styles.saveExitText}>{abcCopyFor(p.language).saveExit}</Text></Pressable>
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
        <AppButton variant="meal" secondary icon={<UiAssetIcon name="meal-refresh" />} label={m.replace} onPress={() => setReplaceOpen((value) => !value)} style={styles.actionButton} />
        <AppButton variant="meal" secondary icon={<UiAssetIcon name="meal-trash" />} label={m.removePhoto} onPress={p.onRemovePhoto} style={[styles.actionButton, { backgroundColor: colors.safetySurface }]} labelStyle={{ color: colors.error, fontSize: 14 }} />
      </View>
      {replaceOpen && picker}
      {!p.meal.photo && <View style={styles.info}><UiAssetIcon name="meal-lock" /><Text style={styles.infoText}>{m.photoLocal}</Text></View>}
      {photoError}
      <View style={styles.bottom}><AppButton variant="meal" icon={<UiAssetIcon name="meal-check" />} label={m.usePhoto} onPress={() => p.meal.photo ? p.onGo('compare') : p.onManual()} disabled={!p.draft.afterPhoto || !!p.photoError} /></View>
    </View>
  );

  const comparison = p.meal.photo && p.draft.afterPhoto
    ? <PhotoComparisonCard before={p.meal.photo} after={p.draft.afterPhoto} beforeLabel={m.before} afterLabel={m.after} enlargeLabel={m.enlarge} onEnlarge={p.onFullPhoto} />
    : <Text style={styles.error}>{m.missingBefore}</Text>;

  return (
    <View style={styles.stack}>
      {comparison}
      <View style={styles.bottom}>
        <AppButton variant="meal" label={m.manual} onPress={p.onManual} style={{ marginHorizontal: 14 }} labelStyle={{ fontSize: 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  enlargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  manualRoute: { minHeight: 60, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sourceIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.homeSelected, alignItems: 'center', justifyContent: 'center' },
  manualLabel: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  manualHint: { color: colors.mealReviewMuted, fontSize: 9, fontFamily: fonts.poppinsRegular },
  saveExit: { alignItems: 'center', padding: 16 },
  saveExitText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 16 },
  stack: { flex: 1, gap: 12, paddingBottom: 8 },
  title: { color: colors.homeText, fontSize: 20, fontFamily: fonts.poppinsSemiBold },
  hero: { backgroundColor: colors.navy, borderRadius: 20, padding: 16, gap: 5 },
  heroTitle: { color: colors.homeBorder, fontFamily: fonts.poppinsSemiBold, fontSize: 20, lineHeight: 26 },
  heroSubtitle: { color: colors.surface, fontFamily: fonts.poppinsRegular, fontSize: 11 },
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  example: { width: 105, height: 105, borderRadius: 11 },
  tips: { flex: 1, gap: 9 },
  tip: { color: colors.surface, fontSize: 9, fontFamily: fonts.interMedium },
  autoSave: { marginTop: 'auto', paddingTop: 24, color: colors.mealReviewMuted, textAlign: 'center', fontSize: 9, fontFamily: fonts.interRegular },
  preview: { height: 318, overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, width: '100%' },
  enlarge: { color: colors.homePrimary, textAlign: 'center', fontSize: 9, fontFamily: fonts.interMedium, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
  info: { flexDirection: 'row', gap: 8, backgroundColor: colors.calendarEmpty, padding: 11, borderRadius: 11 },
  infoText: { flex: 1, color: colors.homeText, fontSize: 10, lineHeight: 15, fontFamily: fonts.interRegular },
  error: { color: colors.error, fontSize: 11, fontFamily: fonts.interMedium },
  bottom: { marginTop: 'auto', gap: 8, paddingTop: 18 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  failure: { backgroundColor: colors.safetySurface, borderRadius: 13, padding: 12, gap: 4 },
  failureTitle: { color: colors.error, fontFamily: fonts.interBold, fontSize: 13 },
});
