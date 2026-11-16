// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Grok 4.7, 2026-11-14, reviewed by Doyeon Kim
// Changed: 저장 상태 화면의 식사 카드와 단계 표시

import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { UiAssetIcon } from './UiAssetIcon';

export type SavedMealPhoto = { uri: string; label: string };
export type SavedMealStep = { label: string; state: string; done: boolean };

export function MealSavedPanel({ title, message, photos, mealTypeLabel, date, foodNames, note, steps, actions, status = 'saved' }: {
  status?: 'saved' | 'saving' | 'error';
  title: string;
  message: string;
  photos: readonly SavedMealPhoto[];
  mealTypeLabel: string;
  date: string;
  foodNames: readonly string[];
  note?: string;
  steps?: readonly SavedMealStep[];
  actions: ReactNode;
}) {
  const foods = foodNames.filter(Boolean);
  return <View style={styles.root}>
    <View style={styles.hero}>
      <View style={[styles.halo, status === 'saving' && styles.savingHalo, status === 'error' && styles.errorHalo]}>
        {status === 'saved' && <>
          <View style={[styles.confetti, { left: 8, top: 10, backgroundColor: colors.homePrimary }]} />
          <View style={[styles.confetti, { left: 16, top: 70, width: 6, height: 6, backgroundColor: '#F5B942' }]} />
          <View style={[styles.confetti, { right: 10, top: 8, backgroundColor: '#F27B9B' }]} />
          <View style={[styles.confetti, { right: 14, top: 64, width: 6, height: 6, backgroundColor: colors.homePrimary }]} />
        </>}
        <View style={styles.core}>
          {status === 'saving'
            ? <ActivityIndicator size={28} color={colors.homePrimary} />
            : <UiAssetIcon name={status === 'error' ? 'meal-save-error' : 'meal-saved-check'} />}
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
    <View style={styles.card}>
      {!!photos.length && <View style={styles.photos}>
        {photos.map((photo) => <View key={photo.uri} style={[styles.photo, photos.length > 1 && styles.pairPhoto]}>
          <Image source={{ uri: photo.uri }} contentFit="cover" style={styles.image} />
          <Text style={styles.photoTag}>{photo.label}</Text>
        </View>)}
      </View>}
      <View style={styles.meta}>
        {!!mealTypeLabel && <Text style={styles.mealType}>{mealTypeLabel}</Text>}
        <Text style={styles.date}>{date}</Text>
      </View>
      {!!foods.length && <View style={styles.foods}>
        {foods.map((name, index) => <Text key={`${name}-${index}`} style={styles.food}>{name}</Text>)}
      </View>}
      {!!steps?.length && <View style={styles.journey}>
        {steps.map((step, index) => <View key={step.label} style={styles.stepSlot}>
          {index > 0 && <View style={[styles.connector, !step.done && styles.connectorPending]} />}
          <View style={styles.step}>
            <View style={[styles.stepIcon, step.done ? styles.stepDone : styles.stepNext]}>
              {step.done ? <Text style={styles.stepCheck}>✓</Text> : <View style={styles.stepDot} />}
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={[styles.stepState, !step.done && styles.stepAwaiting]}>{step.state}</Text>
            </View>
          </View>
        </View>)}
      </View>}
    </View>
    {!!note && <View style={styles.note}>
      <UiAssetIcon name={status === 'saving' ? 'review-shield' : 'review-info'} />
      <Text style={styles.noteText}>{note}</Text>
    </View>}
    <View style={styles.spacer} />
    <View style={styles.actions}>{actions}</View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 20, paddingTop: 8 },
  hero: { alignItems: 'center', gap: 10, paddingTop: 12 },
  halo: {
    width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.saveSavedHalo,
  },
  savingHalo: { backgroundColor: colors.saveSavingHalo },
  errorHalo: { backgroundColor: colors.saveErrorHalo },
  core: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.homeShadow, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  confetti: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  title: { fontSize: 22, lineHeight: 31, fontFamily: fonts.poppinsSemiBold, color: colors.homeText, textAlign: 'center' },
  message: {
    fontSize: 14, lineHeight: 21, fontFamily: fonts.poppinsRegular, color: colors.mealReviewMuted,
    textAlign: 'center', maxWidth: 320,
  },
  card: {
    borderRadius: 20, padding: 14, gap: 12, backgroundColor: colors.surface,
    shadowColor: colors.homeShadow, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  photos: { flexDirection: 'row', gap: 8 },
  photo: { flex: 1, height: 148, borderRadius: 14, overflow: 'hidden' },
  pairPhoto: { height: 112 },
  image: { width: '100%', height: '100%' },
  photoTag: {
    position: 'absolute', left: 8, bottom: 8, overflow: 'hidden', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3, backgroundColor: colors.savePhotoTag,
    color: colors.surface, fontSize: 11, lineHeight: 16, fontFamily: fonts.poppinsSemiBold,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealType: {
    overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: colors.homeSelected, color: colors.homePrimary,
    fontSize: 12, lineHeight: 18, fontFamily: fonts.poppinsSemiBold,
  },
  date: { fontSize: 13, lineHeight: 20, fontFamily: fonts.poppinsRegular, color: colors.mealReviewMuted },
  foods: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  food: {
    overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: colors.foodIngredientBackground, color: colors.homeText,
    fontSize: 13, lineHeight: 19, fontFamily: fonts.poppinsMedium,
  },
  journey: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.homeNavBorder,
  },
  stepSlot: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  connector: { width: 36, height: 2, borderRadius: 1, backgroundColor: colors.success, marginHorizontal: 8 },
  connectorPending: { backgroundColor: colors.transparent, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#A9C3F5', height: 0 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  stepCopy: { flexShrink: 1 },
  stepIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: colors.success },
  stepNext: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.homePrimary },
  stepCheck: { color: colors.surface, fontSize: 12, lineHeight: 16, fontFamily: fonts.poppinsSemiBold },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.homePrimary },
  stepLabel: { color: colors.homeText, fontSize: 12, lineHeight: 17, fontFamily: fonts.poppinsSemiBold },
  stepState: { color: colors.mealReviewMuted, fontSize: 11, lineHeight: 15, fontFamily: fonts.poppinsRegular },
  stepAwaiting: { color: colors.homePrimary, fontFamily: fonts.poppinsMedium },
  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 12,
    backgroundColor: colors.homeSelected,
  },
  noteText: { flex: 1, color: colors.homeText, fontFamily: fonts.poppinsRegular, fontSize: 13, lineHeight: 19 },
  spacer: { flex: 1, minHeight: 12 },
  actions: { gap: 6, paddingTop: 4 },
});
