import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { FormField } from '../../../components/FormField';
import {
  histories,
  traitOptions,
  type FoodItem,
  type FoodTraits,
  type TraitGroup,
} from '../../../types/meal';
import type { Language } from '../../../types/profile';
import { copyFor } from '../../../util/strings';
import { toggleTrait } from '../rules';
import { MealChoice, MealSheet, styles } from './MealControls';
export function FoodTraitsTags({
  traits,
  language,
}: {
  traits: FoodTraits;
  language: Language;
}) {
  const s = copyFor(language);
  const tags = Object.entries(traits).flatMap(([group, values]) =>
    values.map((value) => ({
      key: `${group}-${value}`,
      label:
        s.mealCheckin.traitLabels[
          value as keyof typeof s.mealCheckin.traitLabels
        ] ?? value,
    })),
  );
  return (
    <View style={styles.grid}>
      {tags.length ? (
        tags.map((tag) => (
          <View key={tag.key} style={styles.tag}>
            <Text style={styles.text}>{tag.label}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{s.common.notEntered}</Text>
      )}
    </View>
  );
}
export function FoodEditor({
  food,
  language,
  traits,
  onChange,
  onSave,
  onCancel,
  onEditTraits,
  onTraits,
  onSaveTraits,
  onCancelTraits,
}: {
  food: FoodItem;
  language: Language;
  traits: FoodTraits | null;
  onChange: (value: Partial<FoodItem>) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditTraits: () => void;
  onTraits: (value: FoodTraits) => void;
  onSaveTraits: () => void;
  onCancelTraits: () => void;
}) {
  const s = copyFor(language);
  const m = s.mealCheckin;
  const [ingredient, setIngredient] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [custom, setCustom] = useState({ color: '', shape: '' });
  return (
    <MealSheet
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
                  <MealChoice
                    key={value}
                    label={
                      m.traitLabels[value as keyof typeof m.traitLabels] ??
                      value
                    }
                    selected={traits[group].includes(value)}
                    onPress={() => onTraits(toggleTrait(traits, group, value))}
                  />
                ))}
              </View>
              {(group === 'color' || group === 'shape') && (
                <>
                  <FormField
                    variant="meal"
                    label={m.customTrait}
                    value={custom[group]}
                    onChangeText={(value) =>
                      setCustom({ ...custom, [group]: value })
                    }
                  />
                  <AppButton
                    secondary
                    label={s.common.add}
                    disabled={!custom[group].trim()}
                    onPress={() => {
                      const value = custom[group].trim();
                      if (!traits[group].includes(value))
                        onTraits(toggleTrait(traits, group, value));
                      setCustom({ ...custom, [group]: '' });
                    }}
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
                onPress={() =>
                  onChange({
                    ingredients: food.ingredients.filter((v) => v !== item),
                  })
                }
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
            onChangeText={setIngredient}
          />
          <AppButton
            label={s.common.add}
            secondary
            disabled={!ingredient.trim()}
            onPress={() => {
              if (!food.ingredients.includes(ingredient.trim()))
                onChange({
                  ingredients: [...food.ingredients, ingredient.trim()],
                });
              setIngredient('');
            }}
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
          <FoodTraitsTags traits={food.traits} language={language} />
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
                <MealChoice
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
    </MealSheet>
  );
}
