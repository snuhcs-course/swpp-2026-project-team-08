// This Code is generated with AI

import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { FoodTraitsTags } from '../../../components/FoodTraitsTags';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

type Props = Pick<MealCheckinViewProps, 'draft' | 'language' | 'onEdit' | 'onRemove' | 'onGo' | 'onFullPhoto'>;

export function MealFoodsStepView({ p }: { p: Props }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const hasAi = d.foods.some((food) => food.source === 'ai');
  const [year, month, day] = d.mealDate.split('-').map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString(p.language === 'ko' ? 'ko-KR' : 'en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
  const mealSummary = date + ' · ' + (d.mealType ? m.types[d.mealType] : '') + (d.setting ? ' · ' + m.settings[d.setting] : '');

  return <>
    <View style={styles.mealSummary}>
      <Text style={styles.mealSummaryText}>{mealSummary}</Text>
      <Pressable accessibilityRole="button" onPress={() => p.onGo('details')} style={styles.summaryEdit}><Text style={styles.summaryEditText}>{m.editMealDetails}</Text></Pressable>
    </View>
    {d.photo && <View style={styles.photoCard}>
      <Pressable accessibilityRole="button" accessibilityLabel={m.fullPhoto} onPress={p.onFullPhoto} style={styles.photoOpen}>
        <Image source={{ uri: d.photo.uri }} style={styles.photoThumbnail} contentFit="cover" />
        <Text style={styles.photoTitle}>{m.beforePhoto}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => p.onGo('preview')}><Text style={styles.photoEdit}>{m.editPhoto}</Text></Pressable>
    </View>}
    <View style={styles.legend}>
      {hasAi && <Text style={styles.aiBadge}>• {m.ai}</Text>}
      <Text style={styles.parentBadge}>• {m.parent}</Text>
    </View>
    {!d.foods.length && <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{m.emptyFoodTitle}</Text>
      <Text style={styles.muted}>{m.emptyFoodBody}</Text>
    </View>}
    {d.foods.map((food) => <View key={food.id} style={styles.foodCard}>
      <View style={styles.foodHeading}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.exposure}>{m.goalLabel} · {d.exposureFoodId === food.id ? m.goalSelected : m.goalNotSet}</Text>
      </View>
      <Text style={styles.source}>{food.source === 'ai' ? m.suggestedFood : m.parent}</Text>
      <Text style={styles.sectionLabel}>{m.ingredients}</Text>
      <View style={styles.tags}>
        {food.ingredients.length ? food.ingredients.map((ingredient) => <Text key={ingredient} style={styles.ingredientTag}>{ingredient}</Text>) : <Text style={styles.muted}>{s.common.notEntered}</Text>}
      </View>
      <View style={styles.twoColumns}>
        <View style={{ flex: 1 }}><Text style={styles.sectionLabel}>{m.preparation}</Text><Text style={styles.fieldValue}>{food.preparation || s.common.notEntered}</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.sectionLabel}>{m.servingNote}</Text><Text style={styles.fieldValue}>{food.servingNote || s.common.notEntered}</Text></View>
      </View>
      <Text style={styles.sectionLabel}>{m.traits}</Text>
      <FoodTraitsTags traits={food.traits} labels={{ trait: (value) => m.traitLabels[value as keyof typeof m.traitLabels] ?? value, empty: s.common.notEntered }} />
      <Text style={styles.sectionLabel}>{m.history}</Text>
      <Text style={styles.fieldValue}>{food.history ? m.histories[food.history] : m.noHistory}</Text>
      <View style={styles.actions}>
        <AppButton variant="meal" secondary style={{ flex: 1 }} label={s.common.edit} onPress={() => p.onEdit(food)} />
        <AppButton variant="meal" secondary style={{ flex: 1 }} label={s.common.remove} onPress={() => p.onRemove(food.id)} />
      </View>
    </View>)}
    <AppButton variant="meal" secondary icon={<UiAssetIcon name="meal-plus" />} label={m.addFood} onPress={() => p.onEdit()} />
    {hasAi && <View style={styles.info}><Text style={styles.muted}>{m.reviewAiReminder}</Text></View>}
    <View style={styles.suggestionCard}>
      <Text style={styles.suggestionTitle}>{m.usingSuggestion}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={styles.suggestionButton}><Text style={styles.suggestionButtonText}>{m.chooseSuggestion}</Text></Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen(!moreOpen)} style={styles.moreCard}>
      <Text style={styles.suggestionTitle}>{m.moreAboutMeal} {moreOpen ? '⌃' : '⌄'}</Text>
      <Text style={styles.muted}>{m.optional}</Text>
      {moreOpen && <Text style={styles.muted}>{mealSummary}</Text>}
    </Pressable>
  </>;
}

const styles = StyleSheet.create({
  mealSummary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealSummaryText: { flex: 1, color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  summaryEdit: { borderRadius: 999, backgroundColor: colors.homeSelected, paddingHorizontal: 8, paddingVertical: 4 },
  summaryEditText: { color: colors.homePrimary, fontSize: 9, fontFamily: fonts.poppinsSemiBold },
  photoCard: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 14, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoThumbnail: { width: 48, height: 40, borderRadius: 9 },
  photoTitle: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsSemiBold },
  photoEdit: { color: colors.homePrimary, fontSize: 9, fontFamily: fonts.poppinsSemiBold, paddingHorizontal: 6 },
  legend: { flexDirection: 'row', gap: 5 },
  aiBadge: { color: colors.suggestionText, backgroundColor: colors.suggestionSurface, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontFamily: fonts.poppinsRegular },
  parentBadge: { color: colors.success, backgroundColor: colors.successSurface, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontFamily: fonts.poppinsRegular },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 14, padding: 14, gap: 4 },
  emptyTitle: { color: colors.homeText, fontSize: 12, fontFamily: fonts.poppinsSemiBold },
  muted: { color: colors.homeMuted, fontSize: 10, lineHeight: 14, fontFamily: fonts.poppinsRegular },
  foodCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 14, padding: 12, gap: 8 },
  foodHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodName: { flex: 1, color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  exposure: { color: colors.homeMuted, fontSize: 9, fontFamily: fonts.poppinsRegular },
  source: { color: colors.suggestionText, fontSize: 9, fontFamily: fonts.poppinsRegular },
  sectionLabel: { color: colors.homeMuted, fontSize: 9, fontFamily: fonts.poppinsSemiBold },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientTag: { color: colors.homeText, backgroundColor: colors.suggestionSurface, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontFamily: fonts.poppinsRegular },
  twoColumns: { flexDirection: 'row', gap: 10 },
  fieldValue: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsRegular },
  actions: { flexDirection: 'row', gap: 8 },
  info: { backgroundColor: colors.calendarEmpty, borderRadius: 10, padding: 10 },
  suggestionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 14, padding: 12, gap: 8 },
  suggestionTitle: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsSemiBold },
  suggestionButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.homeBorder, alignItems: 'center', justifyContent: 'center' },
  suggestionButtonText: { color: colors.homePrimary, fontSize: 12, fontFamily: fonts.poppinsSemiBold },
  moreCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 14, padding: 12, gap: 2 },
});
