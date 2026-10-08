import { useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { BottomSheet } from '../../../components/BottomSheet';
import { AfterMealPhotoPicker } from '../components/AfterMealPhotoPicker';
import { PhotoComparisonCard } from '../components/PhotoComparisonCard';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'picking' | 'photoError' |
  'elapsedSeconds' | 'onPick' | 'onRemovePhoto' | 'onFullPhoto' | 'onImageError' |
  'onCompare' | 'onCancelComparison' | 'onManual' | 'onGo'>;

export function AfterMealPhotoStepsView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const photoLabels = { camera: s.mealCheckin.camera, gallery: s.mealCheckin.gallery, files: s.mealCheckin.files };
  const picker = <AfterMealPhotoPicker labels={photoLabels} fileHint={s.mealCheckin.fileHint} picking={p.picking} onPick={(source) => { setReplaceOpen(false); p.onPick(source); }} />;
  const photoError = p.photoError && (
    <Text accessibilityRole="alert" style={styles.error}>{p.photoError === 'permission' ? m.permission : m.imageError}</Text>
  );

  if (p.draft.step === 'photo') return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{m.photoIntro}</Text>
        <Text style={styles.heroSubtitle}>{m.photoRequirement}</Text>
        <View style={styles.heroRow}>
          <Image source={require('../../../../assets/meal/example-plate.png')} accessibilityLabel={s.mealCheckin.example} style={styles.example} contentFit="cover" />
          <View style={styles.tips}>{m.photoTips.map((tip) => <Text key={tip} style={styles.tip}>◉  {tip}</Text>)}</View>
        </View>
      </View>
      {picker}
      {photoError}
      <Text style={styles.autoSave}>{s.common.saved}</Text>
    </View>
  );

  if (p.draft.step === 'preview') return (
    <View style={styles.stack}>
      <Text style={styles.title}>{m.photoLabel}</Text>
      {p.draft.afterPhoto && (
        <Pressable accessibilityRole="button" accessibilityLabel={m.enlarge} onPress={() => p.onFullPhoto('after')}>
          <Image source={{ uri: p.draft.afterPhoto.uri }} style={styles.preview} contentFit="cover" onError={p.onImageError} />
          <Text style={styles.enlarge}>↗ {m.enlarge}</Text>
        </Pressable>
      )}
      <View style={styles.actions}>
        <AppButton variant="meal" secondary label={m.replace} onPress={() => setReplaceOpen((value) => !value)} style={styles.actionButton} />
        <AppButton variant="meal" secondary label={m.removePhoto} onPress={p.onRemovePhoto} style={styles.actionButton} />
      </View>
      {replaceOpen && picker}
      <View style={styles.info}><Text style={styles.infoText}>{m.photoLocal}</Text></View>
      {photoError}
      <View style={styles.bottom}><AppButton variant="meal" label={m.usePhoto} onPress={() => p.onGo('compare')} disabled={!p.draft.afterPhoto || !!p.photoError} /></View>
    </View>
  );

  const comparison = p.meal.photo && p.draft.afterPhoto
    ? <PhotoComparisonCard before={p.meal.photo} after={p.draft.afterPhoto} beforeLabel={m.before} afterLabel={m.after} enlargeLabel={m.enlarge} onEnlarge={p.onFullPhoto} />
    : <Text style={styles.error}>{m.missingBefore}</Text>;

  if (p.draft.step === 'compare') return (
    <View style={styles.stack}>
      {comparison}
      <View style={styles.info}>
        <Text style={styles.infoText}>{m.consent}</Text>
        <Pressable accessibilityRole="link" onPress={() => setPrivacyOpen(true)}><Text style={styles.enlarge}>{m.privacy}</Text></Pressable>
      </View>
      <View style={styles.bottom}>
        <AppButton variant="meal" label={m.compare} onPress={p.onCompare} disabled={!p.meal.photo || !p.draft.afterPhoto} />
        <AppButton variant="meal" secondary label={m.manual} onPress={p.onManual} />
      </View>
      {privacyOpen && (
        <BottomSheet title={m.privacy} closeLabel={s.common.close} onClose={() => setPrivacyOpen(false)}>
          <Text style={styles.infoText}>{m.consent}</Text>
        </BottomSheet>
      )}
    </View>
  );

  if (p.draft.step === 'comparing') return (
    <View style={styles.stack}>
      {comparison}
      <View style={styles.center}><ActivityIndicator color={colors.homePrimary} /><Text style={styles.title}>{m.comparing}</Text><Text style={styles.infoText}>{m.elapsed(p.elapsedSeconds)}</Text></View>
      <View style={styles.bottom}><AppButton variant="meal" secondary label={m.cancelSafely} onPress={p.onCancelComparison} /></View>
    </View>
  );

  return (
    <View style={styles.stack}>
      {comparison}
      <View style={styles.failure}><Text style={styles.failureTitle}>{m.titles['comparison-error']}</Text><Text style={styles.infoText}>{m.compareFailed}</Text></View>
      <View style={styles.bottom}>
        <AppButton variant="meal" label={m.retryCompare} onPress={p.onCompare} disabled={!p.meal.photo || !p.draft.afterPhoto} />
        <AppButton variant="meal" secondary label={m.manual} onPress={p.onManual} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1, gap: 12, paddingBottom: 8 },
  title: { color: colors.homeText, fontSize: 17, fontFamily: fonts.poppinsSemiBold },
  hero: { backgroundColor: colors.navy, borderRadius: 17, padding: 16, gap: 8 },
  heroTitle: { color: colors.surface, fontFamily: fonts.poppinsSemiBold, fontSize: 17 },
  heroSubtitle: { color: colors.surface, fontFamily: fonts.interRegular, fontSize: 10 },
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  example: { width: 105, height: 105, borderRadius: 11 },
  tips: { flex: 1, gap: 9 },
  tip: { color: colors.surface, fontSize: 9, fontFamily: fonts.interMedium },
  autoSave: { marginTop: 'auto', color: colors.mealReviewMuted, textAlign: 'center', fontSize: 9, fontFamily: fonts.interRegular },
  preview: { height: 300, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, width: '100%' },
  enlarge: { color: colors.homePrimary, textAlign: 'center', fontSize: 9, fontFamily: fonts.interMedium, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
  info: { backgroundColor: colors.infoSurface, padding: 11, borderRadius: 11, gap: 4 },
  infoText: { color: colors.homeText, fontSize: 10, lineHeight: 15, fontFamily: fonts.interRegular },
  error: { color: colors.error, fontSize: 11, fontFamily: fonts.interMedium },
  bottom: { marginTop: 'auto', gap: 8, paddingTop: 18 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 18 },
  failure: { backgroundColor: colors.safetySurface, borderRadius: 13, padding: 12, gap: 4 },
  failureTitle: { color: colors.error, fontFamily: fonts.interBold, fontSize: 13 },
});
