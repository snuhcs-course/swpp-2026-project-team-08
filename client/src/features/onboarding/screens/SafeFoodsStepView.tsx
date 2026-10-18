// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected Figma audit details
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; matched onboarding Figma typography and spacing
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

export function SafeFoodsStepView({ language, childName, safeFoods, noSafeFoods, input, canAdd, onToggleNone, onRemove, onInputChange, onAdd }: {
  language: Language;
  childName?: string;
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
          <Text style={styles.chipText}>{[food.name, food.preparation, food.presentationNote].filter(Boolean).join(' · ')} ×</Text>
        </Pressable>
      ))}
      {open && (
        <View style={styles.safeFoodForm}>
          <View style={{ gap: 4 }}><Text style={styles.safeFoodFormTitle}>{s.onboarding.addSafeFood}</Text>
          <Text style={styles.safeFoodFormSubtitle}>{s.onboarding.safeFoodFormHint(childName || s.onboarding.childFallback)}</Text></View>
          <View style={{ gap: 8 }}>
          <FormField variant="safe"
            label={s.onboarding.foodName}
            value={input.name}
            onChangeText={(value) => onInputChange('name', value)}
            placeholder={s.onboarding.safeFoodNameExample}
          />
          <FormField variant="safe"
            label={s.onboarding.preparation}
            value={input.preparation}
            onChangeText={(value) => onInputChange('preparation', value)}
            placeholder={s.onboarding.safeFoodPreparationExample}
          />
          <FormField variant="safe-note"
            label={s.onboarding.presentationNote}
            optionalLabel={s.onboarding.optional}
            value={input.presentationNote}
            onChangeText={(value) => onInputChange('presentationNote', value)}
            placeholder={s.onboarding.safeFoodPresentationExample}
          />
          </View>
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
