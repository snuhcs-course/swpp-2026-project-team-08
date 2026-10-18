// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MealFoodEditorDialog } from './MealFoodEditorDialog';
import { AppButton } from './AppButton';
import { FormField } from './FormField';
import type { FoodItem, FoodTraits, TraitGroup } from '../types/meal';
import type { copyFor } from '../util/strings';
import { BottomSheet } from './BottomSheet';
import { FoodTraitsTags } from './FoodTraitsTags';
import { formStyles as styles } from './formStyles';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { UiAssetIcon } from './UiAssetIcon';

const displayedTraitOptions: Record<TraitGroup, readonly string[]> = {
  texture: ['smooth', 'soft', 'lumpy', 'crunchy', 'chewy', 'slippery', 'mixed', 'other'],
  tasteType: ['sweet', 'salty', 'sour', 'bitter', 'spicy', 'other'],
  tasteIntensity: ['mild', 'strong'],
  smell: ['strong', 'mild', 'none', 'unsure'],
  color: ['green', 'yellow', 'red', 'brown', 'white', 'other'],
  shape: ['consistent', 'varied', 'unsure'],
  visibility: ['visible', 'partial', 'blended', 'unsure'],
  temperature: ['hot', 'warm', 'room', 'cool', 'unsure'],
};
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
  finalLabels,
  mode = 'add',
}: {
  mode?: 'add' | 'edit';
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
  finalLabels?: { cooking: string; detail: string; acceptance: string; selectCooking: string; cookingOptions: readonly string[] };
}) {
  const s = labels;
  const m = labels.meal;
  const [ingredientOpen, setIngredientOpen] = useState(!!ingredient);
  if (finalLabels && !traits) return <MealFoodEditorDialog food={food} mode={mode} meal={m} common={s.common} labels={finalLabels} ingredient={ingredient} onIngredientChange={onIngredientChange} onAddIngredient={onAddIngredient} onRemoveIngredient={onRemoveIngredient} onChange={onChange} onSave={onSave} onCancel={onCancel} />;
  return (
    <BottomSheet
      variant="dialog"
      title={traits ? m.traits : food.name ? m.reviewFood(food.name) : m.addFood}
      closeLabel={s.common.close}
      onClose={traits ? onCancelTraits : onCancel}
      footer={<View style={editorStyles.actions}>
        <AppButton variant="meal" secondary style={{ flex: 1 }} label={m.cancel} onPress={traits ? onCancelTraits : onCancel} />
        <AppButton variant="meal" style={{ flex: 1 }} icon={<UiAssetIcon name="meal-check" />} label={traits ? m.saveTraits : m.saveFood} disabled={!traits && !food.name.trim()} onPress={traits ? onSaveTraits : onSave} />
      </View>}
    >
      {traits ? (
        <>
          <Text style={editorStyles.subtitle}>{m.traitsHint}</Text>
          {(Object.keys(displayedTraitOptions) as TraitGroup[]).map((group) => (
            <View key={group} style={editorStyles.traitSection}>
              <View style={editorStyles.traitHeading}>
                <Text style={editorStyles.traitLabel}>{m.groups[group]}</Text>
                <Text style={editorStyles.traitMode}>{m.traitModes[group]}</Text>
              </View>
              <View style={editorStyles.traitOptions}>
                {[
                  ...displayedTraitOptions[group],
                  ...traits[group].filter(
                    (v) =>
                      !displayedTraitOptions[group].includes(v),
                  ),
                ].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => onToggleTrait(group, value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: traits[group].includes(value) }}
                    style={[editorStyles.traitOption, traits[group].includes(value) && editorStyles.selectedTraitOption, traits[group].includes(value) && (group === 'color' || group === 'tasteIntensity') && editorStyles.positiveTraitOption]}
                  ><Text style={[editorStyles.traitOptionText, traits[group].includes(value) && editorStyles.selectedTraitText, traits[group].includes(value) && (group === 'color' || group === 'tasteIntensity') && editorStyles.positiveTraitText]}>{m.traitLabels[value as keyof typeof m.traitLabels] ?? value}</Text></Pressable>
                ))}
              </View>
              {(group === 'color' || group === 'shape') && (
                <View style={editorStyles.customTraitRow}>
                  <View style={{ flex: 1 }}><FormField variant="editor" label={m.customTrait} hideLabel value={custom[group]} onChangeText={(value) => onCustomChange(group, value)} placeholder={m.customTrait} /></View>
                  <AppButton
                    variant="meal"
                    label={s.common.add}
                    disabled={!custom[group].trim()}
                    onPress={() => onAddCustomTrait(group)}
                  />
                </View>
              )}
            </View>
          ))}
        </>
      ) : (
        <>
          <Text style={editorStyles.subtitle}>{food.name ? m.reviewItemHint : m.addFoodHint}</Text>
          <FormField
            variant="editor"
            label={m.name}
            value={food.name}
            onChangeText={(name) => onChange({ name })}
          />
          <Text style={styles.label}>{m.ingredients}</Text>
          <View style={editorStyles.ingredientRow}>
            {food.ingredients.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`${s.common.remove}: ${item}`}
                onPress={() => onRemoveIngredient(item)}
                style={editorStyles.ingredientTag}
              >
                <Text style={styles.text}>{item} ×</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setIngredientOpen(true)} style={editorStyles.addIngredient}>
              <Text style={editorStyles.addIngredientText}>+ {s.common.add}</Text>
            </Pressable>
          </View>
          {ingredientOpen && <View style={editorStyles.ingredientInput}>
            <View style={{ flex: 1 }}><FormField variant="editor" label={m.addIngredient} value={ingredient} onChangeText={onIngredientChange} /></View>
            <AppButton label={s.common.add} secondary compact disabled={!ingredient.trim()} onPress={() => { onAddIngredient(); setIngredientOpen(false); }} />
          </View>}
          <View style={editorStyles.twoFields}>
            <View style={{ flex: 1 }}><FormField variant="editor" label={m.preparation} value={food.preparation} onChangeText={(preparation) => onChange({ preparation })} /></View>
            <View style={{ flex: 1 }}><FormField variant="editor" label={m.servingNote} value={food.servingNote} onChangeText={(servingNote) => onChange({ servingNote })} /></View>
          </View>
          <View style={editorStyles.traitHeading}><Text style={editorStyles.traitLabel}>{m.traits}</Text><Text style={editorStyles.traitMode}>{m.optional}</Text></View>
          <FoodTraitsTags
            traits={food.traits}
            labels={{
              trait: (value) => m.traitLabels[value as keyof typeof m.traitLabels] ?? value,
              empty: s.common.notEntered,
            }}
          />
          <Pressable accessibilityRole="button" onPress={onEditTraits} style={editorStyles.traitEdit}><Text style={editorStyles.traitEditText}>{m.editTraits}</Text></Pressable>
        </>
      )}
    </BottomSheet>
  );
}

const editorStyles = StyleSheet.create({
  acceptanceRow: { flexDirection: 'row', justifyContent: 'space-between', position: 'relative', marginHorizontal: 12 },
  acceptanceRail: { position: 'absolute', left: 0, right: 0, top: 9, height: 3, backgroundColor: colors.homeBorder },
  acceptanceDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.homePrimary, marginBottom: 6 },
  acceptanceValue: { minWidth: 20, paddingVertical: 4, alignItems: 'center' },
  acceptanceSelected: { opacity: 1 },
  subtitle: { color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  parentBadge: { color: colors.homeMuted, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontFamily: fonts.poppinsRegular },
  ingredientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  ingredientInput: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  ingredientTag: { backgroundColor: colors.safetySurface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  addIngredient: { borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  addIngredientText: { color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  twoFields: { flexDirection: 'row', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  traitSection: { gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.homeBorder },
  traitHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  traitLabel: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsSemiBold },
  traitMode: { color: colors.homeMuted, fontSize: 9, fontFamily: fonts.poppinsRegular },
  traitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  traitOption: { borderRadius: 999, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, paddingHorizontal: 9, paddingVertical: 6 },
  selectedTraitOption: { borderColor: colors.suggestionSurface, backgroundColor: colors.suggestionSurface },
  positiveTraitOption: { borderColor: colors.successSurface, backgroundColor: colors.successSurface },
  traitOptionText: { color: colors.homeText, fontSize: 10, fontFamily: fonts.poppinsRegular },
  selectedTraitText: { color: colors.suggestionText, fontFamily: fonts.poppinsSemiBold },
  positiveTraitText: { color: colors.success, fontFamily: fonts.poppinsSemiBold },
  customTraitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  traitEdit: { alignSelf: 'flex-end', paddingVertical: 4 },
  traitEditText: { color: colors.homePrimary, fontSize: 10, fontFamily: fonts.poppinsSemiBold },
});
