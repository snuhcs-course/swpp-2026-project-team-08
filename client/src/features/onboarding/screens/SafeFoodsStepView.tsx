import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { ChoiceRow } from '../../../components/ChoiceRow';
import { FormField } from '../../../components/FormField';
import { copyFor } from '../../../util/strings';
import type { OnboardingContextValue } from '../hooks/useOnboarding';
import { styles } from './onboardingStyles';

export function SafeFoodsStepView({ model, canAdd }: { model: OnboardingContextValue; canAdd: boolean }) {
  const { draft } = model;
  const [open, setOpen] = useState(() => !!draft.safeFoodInput.name || !!draft.safeFoodInput.preparation);
  const s = copyFor(model.language);
  const input = draft.safeFoodInput;
  return (
    <View>
      <ChoiceRow
        label={s.onboarding.noSafeFoods}
        selected={draft.noSafeFoods}
        onPress={() => model.setNoSafeFoods(!draft.noSafeFoods)}
      />
      {draft.safeFoods.map((food) => (
        <Pressable
          key={food.id}
          onPress={() => model.removeSafeFood(food.id)}
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
            onChangeText={(value) => model.setSafeFoodInput('name', value)}
          />
          <FormField
            label={s.onboarding.preparation}
            value={input.preparation}
            onChangeText={(value) => model.setSafeFoodInput('preparation', value)}
          />
          <FormField
            label={s.onboarding.presentationNote}
            value={input.presentationNote}
            onChangeText={(value) => model.setSafeFoodInput('presentationNote', value)}
          />
          <AppButton
            label={s.common.add}
            compact
            disabled={!canAdd}
            onPress={() => {
              model.addSafeFood(input);
              setOpen(false);
            }}
          />
        </View>
      )}
    </View>
  );
}
