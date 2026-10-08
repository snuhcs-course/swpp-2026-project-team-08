import { Text } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { formStyles as ui } from '../../../components/formStyles';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

export function MealCompleteStepView({ p }: { p: MealCheckinViewProps }) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  return (
    <>
      <Text style={ui.title}>{m.titles.complete}</Text>
      <Text style={ui.text}>{m.done}</Text>
      <Text style={ui.muted}>
        {d.mealDate} · {d.mealType && m.types[d.mealType]} · {d.setting && m.settings[d.setting]}
      </Text>
      <Text style={ui.text}>{m.foodCount(d.foods.length)}</Text>
      <AppButton variant="meal" label={m.afterMeal} disabled={!d.savedMealId} onPress={p.onAfterMeal} />
      <AppButton variant="meal" secondary label={s.common.home} onPress={p.onHome} />
    </>
  );
}
