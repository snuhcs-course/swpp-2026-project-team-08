// This Code is generated with AI

import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { formStyles as ui } from '../../../components/formStyles';
import { copyFor } from '../../../util/strings';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

type Props = Pick<MealCheckinViewProps, 'draft' | 'language' | 'onAfterMeal' | 'onHome'>;

export function MealCompleteStepView({ p }: { p: Props }) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  return (
    <>
      <View style={styles.card}>
        <View style={styles.icon}><UiAssetIcon name="meal-check" /></View>
        <Text style={ui.title}>{m.titles.complete}</Text>
        <Text style={ui.text}>{m.done}</Text>
        <Text style={styles.status}>{m.awaitingReview}</Text>
        <Text style={ui.muted}>{d.mealDate} · {d.mealType && m.types[d.mealType]} · {d.setting && m.settings[d.setting]} · {m.foodCount(d.foods.length)}</Text>
      </View>
      <AppButton variant="meal" label={m.afterMeal} disabled={!d.savedMealId} onPress={p.onAfterMeal} />
      <AppButton variant="meal" secondary label={m.backToHome} onPress={p.onHome} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 20, padding: 20, gap: 10, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.homePrimary, alignItems: 'center', justifyContent: 'center' },
  status: { color: colors.homePrimary, backgroundColor: colors.homeSelected, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, fontSize: 10, fontFamily: fonts.poppinsSemiBold },
});
