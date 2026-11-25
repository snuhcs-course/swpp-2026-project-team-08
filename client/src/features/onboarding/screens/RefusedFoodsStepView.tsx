// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 입력 화면
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 기타 사유 입력
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { DropdownChoice } from '../../../components/DropdownChoice';
import { FormField } from '../../../components/FormField';
import { cookingMethodIds, type CookingMethod } from '../../../types/recordValues';
import type { Difficulty, DifficultyCategory } from '../../../types/reviewRecord';
import type { Language, RefusedFood } from '../../../types/profile';
import { difficultyOptions, textureQuestions } from '../../../util/difficultyOptions';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { OnboardingDraft } from '../types';
import { styles as onboardingStyles } from './onboardingStyles';

export function RefusedFoodsStepView({ language, foods, input, onChange, onAdd, onRemove }: {
  language: Language; foods: RefusedFood[]; input: OnboardingDraft['refusedFoodInput'];
  onChange: (input: OnboardingDraft['refusedFoodInput']) => void;
  onAdd: () => void; onRemove: (id: string) => void;
}) {
  const s = copyFor(language);
  const labels = abcCopyFor(language);
  const [category, setCategory] = useState<DifficultyCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const categoryLabels: Record<string, string> = labels.difficultyCategories;
  const valueLabels: Record<string, string> = { ...s.afterMealReview.values, ...labels.values };
  const subcategoryLabels: Record<string, string> = labels.subcategories;
  const values = category === 'texture' ? textureQuestions[subcategory] ?? [] : category ? difficultyOptions[category] : [];
  const chosenValue = category === 'notSure' ? 'notSure' : category === 'other' ? 'other' : value;
  const reason: Difficulty | null = category && chosenValue && (chosenValue !== 'other' || note.trim()) && (category !== 'texture' || subcategory)
    ? { category, subcategory: category === 'texture' ? subcategory : null, value: chosenValue, ...(chosenValue === 'other' ? { note: note.trim() } : {}) } : null;
  const duplicate = !!reason && input.reasons.some(item => item.category === reason.category && item.subcategory === reason.subcategory && item.value === reason.value && item.note === reason.note);
  const reasonLabel = (item: Difficulty) => item.value === 'other' && item.note ? item.note : [categoryLabels[item.category], item.subcategory && subcategoryLabels[item.subcategory], item.category === 'notSure' ? '' : valueLabels[item.value] ?? item.value, item.note].filter(Boolean).join(' · ');
  return <View>
    {foods.length > 0 && <View style={onboardingStyles.safeFoodChips}>{foods.map(food => <View key={food.id} style={onboardingStyles.safeFoodChip}>
      <View style={onboardingStyles.safeFoodChipCopy}><Text style={onboardingStyles.safeFoodChipName}>{food.name}</Text>
        {food.cookingMethod && <Text style={onboardingStyles.safeFoodChipDetails}>{labels.cookingMethods[food.cookingMethod]}</Text>}</View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${s.common.remove} ${food.name}`} onPress={() => onRemove(food.id)} style={onboardingStyles.safeFoodRemove}>
        <Text style={onboardingStyles.safeFoodRemoveText}>×</Text></Pressable></View>)}</View>}
    <View style={onboardingStyles.safeFoodForm}>
      <Text style={onboardingStyles.safeFoodFormTitle}>{s.refusedFoods.addFood}</Text>
      <View style={onboardingStyles.safeFoodFields}>
        <FormField variant="safe" label={s.onboarding.foodName} placeholder={s.onboarding.safeFoodNameExample}
          value={input.name} onChangeText={name => onChange({ ...input, name })} />
        <View><Text style={styles.label}>{labels.cooking} <Text style={styles.optional}>{s.onboarding.optional}</Text></Text>
          <DropdownChoice options={cookingMethodIds.map(id => ({ id, label: labels.cookingMethods[id] }))}
            value={input.cookingMethod ?? ''} placeholder={labels.selectCooking}
            onChange={method => onChange({ ...input, cookingMethod: method as CookingMethod })} />
          {input.cookingMethod && <Pressable accessibilityRole="button" onPress={() => onChange({ ...input, cookingMethod: null })}>
            <Text style={styles.clear}>{s.common.remove}</Text></Pressable>}</View>
        <View><Text style={styles.label}>{s.refusedFoods.reasons} <Text style={styles.optional}>{s.onboarding.optional}</Text></Text>
          <View style={styles.row}><View style={styles.select}><DropdownChoice options={Object.entries(categoryLabels).map(([id, label]) => ({ id, label }))}
            value={category} placeholder={s.refusedFoods.category} onChange={id => { setCategory(id as DifficultyCategory); setSubcategory(''); setValue(''); setNote(''); }} /></View>
            {category !== 'texture' && category !== 'notSure' && category !== 'other' && <View style={styles.select}><DropdownChoice options={values.map(id => ({ id, label: valueLabels[id] ?? id }))}
              value={value} placeholder={s.refusedFoods.value} onChange={setValue} /></View>}
            <AppButton compact label={s.sensory.add} disabled={!reason || duplicate} onPress={() => {
              if (reason && !duplicate) { onChange({ ...input, reasons: [...input.reasons, reason] }); setValue(''); setNote(''); }
            }} labelStyle={styles.buttonText} /></View>
          {category === 'texture' && <View style={styles.textureRow}>
            <DropdownChoice options={Object.keys(textureQuestions).map(id => ({ id, label: subcategoryLabels[id] ?? id }))}
              value={subcategory} placeholder={s.refusedFoods.subcategory} onChange={id => { setSubcategory(id); setValue(''); }} />
            <DropdownChoice options={values.map(id => ({ id, label: valueLabels[id] ?? id }))}
              value={value} placeholder={s.refusedFoods.value} onChange={setValue} />
          </View>}
          {chosenValue === 'other' && <TextInput accessibilityLabel={s.afterMealReview.note}
            placeholder={s.afterMealReview.note} placeholderTextColor={colors.onboardingMuted}
            value={note} onChangeText={setNote} multiline maxLength={2000} style={styles.note} />}
          {input.reasons.map(item => <Pressable key={`${item.category}.${item.subcategory}.${item.value}.${item.note ?? ''}`} accessibilityRole="button"
            accessibilityLabel={`${s.common.remove} ${reasonLabel(item)}`}
            onPress={() => onChange({ ...input, reasons: input.reasons.filter(entry => entry !== item) })} style={styles.reason}>
            <Text style={styles.reasonText}>{reasonLabel(item)} ×</Text></Pressable>)}
        </View>
      </View>
    </View>
    <AppButton label={s.refusedFoods.addFood} compact style={styles.addFood} labelStyle={styles.buttonText}
      disabled={!input.name.trim() || input.name.trim().length > 200} onPress={() => { onAdd(); setCategory(''); setSubcategory(''); setValue(''); setNote(''); }} />
  </View>;
}
const styles = StyleSheet.create({
  label: { color: colors.onboardingText, fontFamily: fonts.poppinsSemiBold, fontSize: 13, marginBottom: 6 },
  optional: { color: colors.onboardingMuted, fontFamily: fonts.poppinsRegular },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, select: { flex: 1, minWidth: 0 },
  textureRow: { gap: 6, marginTop: 6 }, addFood: { marginTop: 10 }, buttonText: { fontSize: 13 },
  note: { minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.mealReviewBorder,
    borderRadius: 10, padding: 10, marginTop: 8, color: colors.onboardingText },
  reason: { alignSelf: 'flex-start', maxWidth: '100%', marginTop: 6, padding: 6, borderRadius: 8, backgroundColor: colors.textureSentence },
  reasonText: { color: colors.onboardingText, fontSize: 12 }, clear: { color: colors.onboardingPrimary, marginTop: 4, fontSize: 12 },
});
