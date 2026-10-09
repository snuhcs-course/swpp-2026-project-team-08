// This Code is generated with AI

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { ChoiceRow } from '../../../components/ChoiceRow';
import { FormField } from '../../../components/FormField';
import { copyFor } from '../../../util/strings';
import type { Language, SafeFood } from '../../../types/profile';
import type { OnboardingDraft } from '../types';
import { styles } from './onboardingStyles';

export function SafeFoodsStepView({ language, safeFoods, noSafeFoods, input, canAdd, onToggleNone, onRemove, onInputChange, onAdd }: {
  language: Language;
  safeFoods: SafeFood[];
  noSafeFoods: boolean;
  input: OnboardingDraft['safeFoodInput'];
  canAdd: boolean;
  onToggleNone: () => void;
  onRemove: (id: string) => void;
  onInputChange: (field: keyof OnboardingDraft['safeFoodInput'], value: string) => void;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(() => !!input.name || !!input.preparation);
  const s = copyFor(language);
  return (
    <View>
      <View style={styles.safeFoodAddRow}>
        <TextInput
          accessibilityLabel={s.onboarding.foodName}
          value={input.name}
          onChangeText={(value) => onInputChange('name', value)}
          placeholder={s.onboarding.safeFoodExamples}
          placeholderTextColor={styles.safeFoodPlaceholder.color}
          style={styles.safeFoodQuickInput}
        />
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={s.onboarding.addSafeFood}
          style={styles.safeFoodAddButton}
        >
          <Text style={styles.safeFoodAddPlus}>+</Text>
        </Pressable>
      </View>
      {!open && (
        <>
          <ChoiceRow label={s.onboarding.noSafeFoods} selected={noSafeFoods} multiple onPress={onToggleNone} />
          <Text style={styles.multipleHint}>{s.onboarding.multipleInput}</Text>
        </>
      )}
      {safeFoods.map((food) => (
        <Pressable
          key={food.id}
          onPress={() => onRemove(food.id)}
          accessibilityRole="button"
          accessibilityLabel={`${s.common.remove} ${food.name}`}
          style={styles.safeFoodChip}
        >
          <Text style={styles.chipText}>{food.name} · {food.preparation} ×</Text>
        </Pressable>
      ))}
      {open && (
        <View style={styles.safeFoodForm}>
          <Text style={styles.safeFoodFormTitle}>{s.onboarding.addSafeFood}</Text>
          <Text style={styles.safeFoodFormSubtitle}>{s.onboarding.safeFoodFormHint}</Text>
          <FormField
            label={s.onboarding.foodName}
            value={input.name}
            onChangeText={(value) => onInputChange('name', value)}
            placeholder={s.onboarding.safeFoodNameExample}
          />
          <FormField
            label={s.onboarding.preparation}
            value={input.preparation}
            onChangeText={(value) => onInputChange('preparation', value)}
            placeholder={s.onboarding.safeFoodPreparationExample}
          />
          <FormField
            label={s.onboarding.presentationNote}
            value={input.presentationNote}
            onChangeText={(value) => onInputChange('presentationNote', value)}
            placeholder={s.onboarding.safeFoodPresentationExample}
          />
          <AppButton
            label={s.common.add}
            disabled={!canAdd}
            onPress={() => {
              onAdd();
              setOpen(false);
            }}
          />
        </View>
      )}
    </View>
  );
}
