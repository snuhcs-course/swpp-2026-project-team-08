import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
      <ChoiceRow
        label={s.onboarding.noSafeFoods}
        selected={noSafeFoods}
        onPress={onToggleNone}
      />
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
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={s.onboarding.addSafeFood}
        style={styles.openSafeFood}
      >
        <Text style={styles.openSafeFoodText}>{s.onboarding.addSafeFood}</Text>
        <Text style={styles.plus}>+</Text>
      </Pressable>
      {open && (
        <View style={styles.safeFoodForm}>
          <FormField
            label={s.onboarding.foodName}
            value={input.name}
            onChangeText={(value) => onInputChange('name', value)}
          />
          <FormField
            label={s.onboarding.preparation}
            value={input.preparation}
            onChangeText={(value) => onInputChange('preparation', value)}
          />
          <FormField
            label={s.onboarding.presentationNote}
            value={input.presentationNote}
            onChangeText={(value) => onInputChange('presentationNote', value)}
          />
          <AppButton
            label={s.common.add}
            compact
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
