import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { BottomSheet } from '../../../components/BottomSheet';
import { SelectionChoice } from '../../../components/SelectionChoice';
import { formStyles as ui } from '../../../components/formStyles';
import { copyFor } from '../../../util/strings';
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
          title={p.sheet === 'help' ? m.tracker : m.titles.goal}
          closeLabel={s.common.back}
          onClose={() => {
            if (p.saving) return;
            if (p.sheet) p.onSheet(null);
            else p.onGo('foods');
          }}
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
                <Text style={[ui.text, { flex: 1 }]}>{m.goalOptional}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={m.tracker}
                  onPress={() => p.onSheet('help')}
                  style={ui.close}
                >
                  <Text style={ui.link}>?</Text>
                </Pressable>
              </View>
              {d.foods.map((food) => (
                <SelectionChoice
                  key={food.id}
                  label={food.name}
                  selected={d.exposureFoodId === food.id}
                  onPress={() => p.onUpdate({ exposureFoodId: food.id })}
                />
              ))}
              {p.error === 'save' && <Text accessibilityRole="alert" style={ui.error}>{m.saveFailed}</Text>}
              <AppButton
                variant="meal"
                label={p.saving ? s.common.saving : m.selectGoal}
                disabled={!d.exposureFoodId || p.saving}
                onPress={() => p.onSave(false)}
              />
              <AppButton variant="meal" secondary label={m.skipGoal} disabled={p.saving} onPress={() => p.onSave(true)} />
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
