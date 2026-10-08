import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { FormField } from './FormField';
import {
  histories,
  traitOptions,
  type FoodItem,
  type FoodTraits,
  type TraitGroup,
} from '../types/meal';
import type { copyFor } from '../util/strings';
import { SelectionChoice } from './SelectionChoice';
import { BottomSheet } from './BottomSheet';
import { FoodTraitsTags } from './FoodTraitsTags';
import { formStyles as styles } from './formStyles';
export function FoodEditor({
  food,
  labels,
  traits,
  ingredient,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  custom,
  onCustomChange,
  onAddCustomTrait,
  onChange,
  onSave,
  onCancel,
  onEditTraits,
  onToggleTrait,
  onSaveTraits,
  onCancelTraits,
}: {
  food: FoodItem;
  labels: { meal: ReturnType<typeof copyFor>['mealCheckin']; common: Pick<ReturnType<typeof copyFor>['common'], 'add' | 'remove' | 'notEntered' | 'close'> };
  traits: FoodTraits | null;
  ingredient: string;
  onIngredientChange: (value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (value: string) => void;
  custom: { color: string; shape: string };
  onCustomChange: (group: 'color' | 'shape', value: string) => void;
  onAddCustomTrait: (group: 'color' | 'shape') => void;
  onChange: (value: Partial<FoodItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditTraits: () => void;
  onToggleTrait: (group: TraitGroup, value: string) => void;
  onSaveTraits: () => void;
  onCancelTraits: () => void;
}) {
  const s = labels;
  const m = labels.meal;
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <BottomSheet
      title={traits ? m.traits : food.name || m.addFood}
      closeLabel={s.common.close}
      onClose={traits ? onCancelTraits : onCancel}
    >
      {traits ? (
        <>
          {(Object.keys(traitOptions) as TraitGroup[]).map((group) => (
            <View key={group} style={styles.stack}>
              <Text style={styles.label}>{m.groups[group]}</Text>
              <View style={styles.grid}>
                {[
                  ...traitOptions[group],
                  ...traits[group].filter(
                    (v) =>
                      !(traitOptions[group] as readonly string[]).includes(v),
                  ),
                ].map((value) => (
                  <SelectionChoice
                    key={value}
                    label={
                      m.traitLabels[value as keyof typeof m.traitLabels] ??
                      value
                    }
                    selected={traits[group].includes(value)}
                    onPress={() => onToggleTrait(group, value)}
                  />
                ))}
              </View>
              {(group === 'color' || group === 'shape') && (
                <>
                  <FormField
                    variant="meal"
                    label={m.customTrait}
                    value={custom[group]}
                    onChangeText={(value) => onCustomChange(group, value)}
                  />
                  <AppButton
                    secondary
                    label={s.common.add}
                    disabled={!custom[group].trim()}
                    onPress={() => onAddCustomTrait(group)}
                  />
                </>
              )}
            </View>
          ))}
          <AppButton
            variant="meal"
            label={m.saveTraits}
            onPress={onSaveTraits}
          />
          <AppButton
            variant="meal"
            secondary
            label={m.cancel}
            onPress={onCancelTraits}
          />
        </>
      ) : (
        <>
          <FormField
            variant="meal"
            label={m.name}
            value={food.name}
            onChangeText={(name) => onChange({ name })}
          />
          <Text style={styles.label}>{m.ingredients}</Text>
          <View style={styles.grid}>
            {food.ingredients.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`${s.common.remove}: ${item}`}
                onPress={() => onRemoveIngredient(item)}
                style={styles.tag}
              >
                <Text style={styles.text}>{item} ×</Text>
              </Pressable>
            ))}
          </View>
          <FormField
            variant="meal"
            label={m.addIngredient}
            value={ingredient}
            onChangeText={onIngredientChange}
          />
          <AppButton
            label={s.common.add}
            secondary
            disabled={!ingredient.trim()}
            onPress={onAddIngredient}
          />
          <FormField
            variant="meal"
            label={m.preparation}
            value={food.preparation}
            onChangeText={(preparation) => onChange({ preparation })}
          />
          <FormField
            variant="meal"
            label={m.servingNote}
            value={food.servingNote}
            onChangeText={(servingNote) => onChange({ servingNote })}
          />
          <Text style={styles.label}>{m.traits}</Text>
          <FoodTraitsTags
            traits={food.traits}
            labels={{
              trait: (value) => m.traitLabels[value as keyof typeof m.traitLabels] ?? value,
              empty: s.common.notEntered,
            }}
          />
          <AppButton secondary label={m.editTraits} onPress={onEditTraits} />
          <Text style={styles.label}>{m.history}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: historyOpen }}
            onPress={() => setHistoryOpen(!historyOpen)}
            style={styles.choice}
          >
            <Text style={styles.text}>
              {food.history ? m.histories[food.history] : s.common.notEntered} ▾
            </Text>
          </Pressable>
          {historyOpen && (
            <View style={styles.card}>
              {[null, ...histories].map((value) => (
                <SelectionChoice
                  key={value ?? 'none'}
                  label={value ? m.histories[value] : s.common.notEntered}
                  selected={food.history === value}
                  onPress={() => {
                    onChange({ history: value });
                    setHistoryOpen(false);
                  }}
                />
              ))}
            </View>
          )}
          <AppButton
            variant="meal"
            label={m.saveFood}
            disabled={!food.name.trim()}
            onPress={onSave}
          />
          <AppButton
            variant="meal"
            secondary
            label={m.cancel}
            onPress={onCancel}
          />
        </>
      )}
    </BottomSheet>
  );
}
