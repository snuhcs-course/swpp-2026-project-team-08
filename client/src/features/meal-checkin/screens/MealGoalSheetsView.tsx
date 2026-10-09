import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { BottomSheet } from '../../../components/BottomSheet';
import { formStyles as ui } from '../../../components/formStyles';
import { copyFor } from '../../../util/strings';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

type Props = Pick<MealCheckinViewProps,
  'draft' | 'language' | 'sheet' | 'saving' | 'error' |
  'onSheet' | 'onGo' | 'onUpdate' | 'onSave'>;

export function MealGoalSheetsView({ p }: { p: Props }) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  return (
    <>
      {d.step === 'goal' && (
        <BottomSheet
          variant={p.sheet === 'help' ? 'sheet' : 'dialog'}
          title={p.sheet === 'help' ? m.tracker : m.titles.goal}
          closeLabel={s.common.back}
          onClose={() => {
            if (p.saving) return;
            if (p.sheet) p.onSheet(null);
            else p.onGo('foods');
          }}
          footer={p.sheet === 'help' ? undefined : <View style={goalStyles.actions}>
            <AppButton variant="meal" label={p.saving ? s.common.saving : m.selectGoal} disabled={!d.exposureFoodId || p.saving} onPress={() => p.onSave(false)} />
            <Pressable accessibilityRole="button" disabled={p.saving} onPress={() => p.onSave(true)} style={goalStyles.skip}><Text style={goalStyles.skipText}>{m.skipGoal}</Text></Pressable>
          </View>}
        >
          {p.sheet === 'help' ? (
            <>
              <Text style={ui.text}>{m.trackerBody}</Text>
              {m.ladder.map((name, i) => (
                <View key={name} style={ui.row}>
                  <View style={ui.tag}><Text style={ui.label}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={ui.label}>{name}</Text>
                    <Text style={ui.muted}>{m.ladderDetails[i]}</Text>
                  </View>
                </View>
              ))}
              <AppButton variant="meal" secondary label={s.common.back} onPress={() => p.onSheet(null)} />
            </>
          ) : (
            <View pointerEvents={p.saving ? 'none' : 'auto'} style={ui.stack}>
              <View style={ui.row}>
                <Text style={[ui.text, { flex: 1 }]}>{m.goalIntro}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={m.tracker}
                  onPress={() => p.onSheet('help')}
                  style={ui.close}
                >
                  <Text style={ui.link}>{m.optional}</Text>
                </Pressable>
              </View>
              {d.foods.map((food) => (
                <Pressable key={food.id} accessibilityRole="radio" accessibilityState={{ checked: d.exposureFoodId === food.id }} onPress={() => p.onUpdate({ exposureFoodId: food.id })} style={[goalStyles.food, d.exposureFoodId === food.id && goalStyles.selectedFood]}>
                  <View style={[goalStyles.radio, d.exposureFoodId === food.id && goalStyles.selectedRadio]}>
                    {d.exposureFoodId === food.id && <View style={goalStyles.dot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={goalStyles.foodName}>{food.name}</Text>
                    <Text style={goalStyles.foodHistory}>{m.foodForm(food.preparation || s.common.notEntered, food.servingNote)}</Text>
                    <Text style={goalStyles.foodHistory}>{m.currentComfort}</Text>
                    <Text style={goalStyles.goalPractice}>{m.goalPractice}</Text>
                  </View>
                </Pressable>
              ))}
              <Text style={goalStyles.noGoalNote}>{m.noGoalSelected}</Text>
              {p.error === 'save' && <Text accessibilityRole="alert" style={ui.error}>{m.saveFailed}</Text>}
            </View>
          )}
        </BottomSheet>
      )}
      {p.sheet === 'privacy' && (
        <BottomSheet title={m.privacy} closeLabel={s.common.close} onClose={() => p.onSheet(null)}>
          <Text style={ui.text}>{m.privacyBody}</Text>
        </BottomSheet>
      )}
    </>
  );
}

const goalStyles = StyleSheet.create({
  actions: { gap: 7 },
  skip: { height: 40, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: colors.homeText, fontSize: 12, fontFamily: fonts.poppinsSemiBold },
  food: { minHeight: 112, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  selectedFood: { backgroundColor: colors.homeBackground, borderColor: colors.homePrimary, borderWidth: 2 },
  foodName: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  foodHistory: { color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  goalPractice: { color: colors.homePrimary, fontSize: 10, fontFamily: fonts.poppinsSemiBold },
  noGoalNote: { color: colors.homeMuted, fontSize: 9, fontFamily: fonts.poppinsRegular },
  radio: { width: 12, height: 12, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  selectedRadio: { borderColor: colors.homePrimary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.homePrimary },
});
