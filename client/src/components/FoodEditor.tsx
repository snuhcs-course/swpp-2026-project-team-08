// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; removed food source badge
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppIcon } from './AppIcon';
import { FormField } from './FormField';
import {
  histories,
  type FoodItem,
  type FoodTraits,
  type TraitGroup,
} from '../types/meal';
import type { copyFor } from '../util/strings';
import { DropdownChoice } from './DropdownChoice';
import { SelectionChoice } from './SelectionChoice';
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
  goal,
  finalLabels,
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
  finalLabels?: { cooking: string; detail: string; acceptance: string; selectCooking: string; cookingOptions: readonly string[] };
  goal?: { label: string; value: string; actionLabel: string; onPress: () => void };
}) {
  const s = labels;
  const m = labels.meal;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ingredientOpen, setIngredientOpen] = useState(!!ingredient);
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
          <View style={editorStyles.badges}>
            <Text style={editorStyles.neutralBadge}>{food.history ? m.histories[food.history] : s.common.notEntered}</Text>
          </View>
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
          {finalLabels ? <>
            <Text style={styles.label}>{finalLabels.cooking}</Text>
            <DropdownChoice value={food.preparation} placeholder={finalLabels.selectCooking} displayFallback={food.preparation || undefined} options={finalLabels.cookingOptions.map((label) => ({ id: label, label }))} onChange={(preparation) => onChange({ preparation })} />
            <FormField variant="editor" label={finalLabels.detail} value={food.servingNote} onChangeText={(servingNote) => onChange({ servingNote })} />
            <Text style={styles.label}>{finalLabels.acceptance} · {m.optional}</Text>
            <View accessibilityRole="radiogroup" style={editorStyles.acceptanceRow}><View pointerEvents="none" style={editorStyles.acceptanceRail} />{food.acceptance != null && <View pointerEvents="none" style={[editorStyles.acceptanceRail, { width: `${food.acceptance / 3 * 100}%`, backgroundColor: colors.homePrimary }]} />}{[0, 1, 2, 3].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${finalLabels.acceptance}: ${value}`} accessibilityState={{ checked: food.acceptance === value }} onPress={() => onChange({ acceptance: food.acceptance === value ? null : value })} style={[editorStyles.acceptanceValue, food.acceptance === value && editorStyles.acceptanceSelected]}><View style={[editorStyles.acceptanceDot, food.acceptance !== value && { opacity: 0 }]} /><Text style={styles.text}>{value}</Text></Pressable>)}</View>
          </> : <>
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
          <Text style={styles.label}>{m.history}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: historyOpen }}
            onPress={() => setHistoryOpen(!historyOpen)}
            style={[styles.choice, editorStyles.historyField]}
          >
            <Text style={[styles.text, { flex: 1 }]}>{food.history ? m.histories[food.history] : m.selectHistory}</Text>
            <AppIcon name="down" size={14} />
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
          </>}
          {goal && <View style={editorStyles.goalRow}>
            <Feather name="target" size={18} color={colors.homePrimary} />
            <View style={{ flex: 1 }}><Text style={editorStyles.goalLabel}>{goal.label}</Text><Text style={editorStyles.goalValue}>{goal.value}</Text></View>
            <AppButton variant="meal" secondary compact label={goal.actionLabel} onPress={goal.onPress} />
          </View>}
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
  badges: { flexDirection: 'row', gap: 5 },
  neutralBadge: { color: colors.homeMuted, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontFamily: fonts.poppinsRegular },
  parentBadge: { color: colors.homeMuted, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontFamily: fonts.poppinsRegular },
  ingredientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  ingredientInput: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  ingredientTag: { backgroundColor: colors.safetySurface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  addIngredient: { borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  addIngredientText: { color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  twoFields: { flexDirection: 'row', gap: 8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.homeSelected, borderRadius: 10, padding: 10 },
  goalLabel: { color: colors.homePrimary, fontSize: 9, fontFamily: fonts.poppinsSemiBold },
  goalValue: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsSemiBold },
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
  historyField: { minHeight: 36, borderRadius: 9, backgroundColor: colors.homeBackground, paddingHorizontal: 10 },
});
