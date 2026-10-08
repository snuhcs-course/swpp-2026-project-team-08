import { Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { FoodTraitsTags } from '../../../components/FoodTraitsTags';
import { formStyles as ui } from '../../../components/formStyles';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

export function MealFoodsStepView({ p }: { p: MealCheckinViewProps }) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  return (
    <>
      <Text style={ui.label}>
        {d.foods.some((food) => food.source === 'ai')
          ? m.aiCount(d.foods.filter((food) => food.source === 'ai').length)
          : m.foodCount(d.foods.length)}
      </Text>
      <Text style={ui.muted}>{m.reviewRequired}</Text>
      {!d.foods.length && <Text style={ui.text}>{m.empty}</Text>}
      {d.foods.map((food) => (
        <View key={food.id} style={ui.card}>
          <View style={ui.row}>
            <Text style={[ui.label, { flex: 1, fontSize: 13 }]}>{food.name}</Text>
            <Text style={[ui.muted, { color: food.source === 'ai' ? colors.error : colors.success }]}>
              {food.source === 'ai' ? m.ai : m.parent}
            </Text>
          </View>
          <Text style={ui.muted}>{m.ingredients}</Text>
          <Text style={ui.text}>{food.ingredients.join(', ') || s.common.notEntered}</Text>
          <View style={ui.row}>
            <View style={{ flex: 1 }}>
              <Text style={ui.muted}>{m.preparation}</Text>
              <Text style={ui.text}>{food.preparation || s.common.notEntered}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ui.muted}>{m.servingNote}</Text>
              <Text style={ui.text}>{food.servingNote || s.common.notEntered}</Text>
            </View>
          </View>
          <Text style={ui.muted}>{m.traits}</Text>
          <FoodTraitsTags
            traits={food.traits}
            labels={{
              trait: (value) => m.traitLabels[value as keyof typeof m.traitLabels] ?? value,
              empty: s.common.notEntered,
            }}
          />
          <Text style={ui.muted}>{m.history}</Text>
          <Text style={ui.text}>{food.history ? m.histories[food.history] : s.common.notEntered}</Text>
          <View style={ui.row}>
            <AppButton style={{ flex: 1 }} secondary label={s.common.edit} onPress={() => p.onEdit(food)} />
            <AppButton style={{ flex: 1 }} secondary label={s.common.remove} onPress={() => p.onRemove(food.id)} />
          </View>
        </View>
      ))}
      <AppButton variant="meal" secondary label={m.addFood} onPress={() => p.onEdit()} />
      <View style={ui.info}><Text style={ui.text}>{m.aiNote}</Text></View>
    </>
  );
}
