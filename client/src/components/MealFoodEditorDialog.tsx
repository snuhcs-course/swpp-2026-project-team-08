// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodItem } from '../types/meal';
import type { copyFor } from '../util/strings';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { AppButton } from './AppButton';
import { Dialog } from './Dialog';
import { DropdownChoice } from './DropdownChoice';
import { FormField } from './FormField';

type Labels = { cooking: string; detail: string; acceptance: string; selectCooking: string; cookingOptions: readonly string[] };
export function MealFoodEditorDialog({ food, mode, meal: m, common, labels, ingredient, ingredientOptions, onIngredientChange, onAddIngredient, onSelectIngredient, onRemoveIngredient, onChange, onSave, onCancel }: {
  food: FoodItem; mode: 'add' | 'edit'; meal: ReturnType<typeof copyFor>['mealCheckin'];
  common: Pick<ReturnType<typeof copyFor>['common'], 'add' | 'remove' | 'close'>;
  labels: Labels; ingredient: string; ingredientOptions?: string[]; onIngredientChange: (value: string) => void;
  onAddIngredient: () => void; onRemoveIngredient: (value: string) => void;
  onSelectIngredient?: (value: string) => void;
  onChange: (value: Partial<FoodItem>) => void; onSave: () => void; onCancel: () => void;
}) {
  const [ingredientOpen, setIngredientOpen] = useState(false);
  return <Dialog title={mode === 'add' ? m.addFood : m.editFoodTitle(food.name)} closeLabel={common.close} onClose={onCancel} footer={
    <View style={styles.actions}>
      <AppButton variant="meal" secondary label={m.cancel} onPress={onCancel} style={styles.button} labelStyle={styles.buttonText} />
      <AppButton variant="meal" label={m.saveFood} disabled={!food.name.trim()} onPress={onSave} style={[styles.button, !food.name.trim() && styles.disabledButton]} labelStyle={[styles.buttonText, !food.name.trim() && styles.disabledText]} />
    </View>
  }>
    <FormField variant="editor" label={m.name} value={food.name} placeholder={m.foodNamePlaceholder} onChangeText={(name) => onChange({ name })} />
    <View style={styles.ingredients}>
      <Text style={styles.label}>{m.ingredients}</Text>
      <View style={styles.tags}>
        {food.ingredients.map((name) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={`${common.remove}: ${name}`} onPress={() => onRemoveIngredient(name)} style={styles.tag}><Text style={styles.tagText}>{name} ×</Text></Pressable>)}
        <Pressable accessibilityRole="button" onPress={() => setIngredientOpen(true)} style={styles.addIngredient}><Text style={styles.addText}>+ {common.add}</Text></Pressable>
      </View>
      {ingredientOpen && <View style={styles.ingredientInput}>
        <View style={styles.column}><FormField variant="editor" label={m.addIngredient} hideLabel value={ingredient} onChangeText={onIngredientChange} placeholder={m.addIngredient} /></View>
        <AppButton compact label={common.add} disabled={!ingredient.trim() || (!!ingredientOptions?.length && !ingredientOptions.some((name) => name.toLocaleLowerCase() === ingredient.trim().toLocaleLowerCase()))} onPress={() => { onAddIngredient(); setIngredientOpen(false); }} />
      </View>}
      {ingredientOpen && ingredientOptions && onSelectIngredient && ingredient.trim() && (
        <View style={styles.ingredientChoices}>
          {ingredientOptions.filter((name) => name.toLocaleLowerCase().includes(ingredient.trim().toLocaleLowerCase())
            && !food.ingredients.includes(name)).slice(0, 6).map((name) => (
              <Pressable key={name} accessibilityRole="button" onPress={() => { onSelectIngredient(name); setIngredientOpen(false); }} style={styles.ingredientChoice}>
                <Text style={styles.tagText}>{name}</Text>
              </Pressable>
            ))}
        </View>
      )}
    </View>
    <View style={styles.twoFields}>
      <View style={styles.column}>
        <View style={styles.fieldHeading}><Text style={styles.label}>{labels.cooking}</Text><Text style={[styles.optional, { fontSize: 11 }]}>{m.optional}</Text></View>
        <DropdownChoice variant="editor" value={food.preparation} placeholder={labels.selectCooking} displayFallback={food.preparation || undefined} options={labels.cookingOptions.map((label) => ({ id: label, label }))} onChange={(preparation) => onChange({ preparation })} />
      </View>
      <View style={styles.column}><FormField variant="editor" label={labels.detail} optionalLabel={m.optional} value={food.servingNote} placeholder={m.detailPlaceholder} onChangeText={(servingNote) => onChange({ servingNote })} /></View>
    </View>
    <View style={styles.acceptance}>
      <View style={styles.fieldHeading}><Text style={styles.label}>{labels.acceptance}</Text><Text style={styles.optional}>{m.optional}</Text></View>
      <View accessibilityRole="radiogroup" style={styles.scale}>
        <View pointerEvents="none" style={styles.rail} />
        {food.acceptance != null && <View pointerEvents="none" style={[styles.rail, { width: `${food.acceptance / 3 * 100}%`, backgroundColor: colors.homePrimary }]} />}
        {[0, 1, 2, 3].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${labels.acceptance}: ${value}`} accessibilityState={{ checked: food.acceptance === value }} onPress={() => onChange({ acceptance: food.acceptance === value ? null : value })} style={styles.scaleValue}>
          <View style={[styles.dot, food.acceptance !== value && styles.hiddenDot]} /><Text style={styles.scaleText}>{value}</Text>
        </Pressable>)}
      </View>
    </View>
  </Dialog>;
}
const styles = StyleSheet.create({
  ingredientChoices: { gap: 2 },
  ingredientChoice: { minHeight: 30, paddingHorizontal: 8, justifyContent: 'center', backgroundColor: colors.foodIngredientBackground, borderRadius: 8 },
  label: { color: colors.editorMuted, fontFamily: fonts.poppinsSemiBold, fontSize: 11, lineHeight: 16 },
  optional: { color: colors.editorMuted, fontFamily: fonts.poppinsRegular, fontSize: 9, lineHeight: 16 },
  fieldHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 16 },
  column: { flex: 1, minWidth: 0, gap: 6 },
  twoFields: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, zIndex: 2 },
  ingredients: { gap: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 30 },
  tag: { borderRadius: 999, backgroundColor: colors.foodIngredientBackground, paddingHorizontal: 8, paddingVertical: 5 },
  tagText: { color: colors.homeText, fontFamily: fonts.poppinsMedium, fontSize: 12 },
  addIngredient: { minWidth: 62, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  addText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 12 },
  ingredientInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acceptance: { gap: 8 },
  scale: { width: 280, maxWidth: '100%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rail: { position: 'absolute', left: 0, right: 0, top: 6, height: 3, backgroundColor: colors.editorRail },
  scaleValue: { alignItems: 'center', minWidth: 12, paddingTop: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.homePrimary },
  hiddenDot: { opacity: 0 },
  scaleText: { color: colors.editorPlaceholder, fontFamily: fonts.interBold, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: 44, height: 44, borderRadius: 10 },
  buttonText: { fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  disabledButton: { opacity: 1, backgroundColor: colors.editorDisabled },
  disabledText: { opacity: 1, color: colors.editorPlaceholder },
});
