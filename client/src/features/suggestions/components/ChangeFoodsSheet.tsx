// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { BottomSheet } from '../../../components/BottomSheet';
import type { FoodItem } from '../../../types/meal';
import type { Language } from '../../../types/profile';
import { suggestionCopyFor } from '../../../util/strings';
import { canUpdateFoods, toggleFood } from '../rules';
import { suggestionStyles as s } from '../screens/suggestionStyles';

export function ChangeFoodsSheet({
  current,
  foods,
  language,
  onClose,
  onUpdate,
}: {
  current: string[];
  foods: FoodItem[];
  language: Language;
  onClose: () => void;
  onUpdate: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState(current);
  const c = suggestionCopyFor(language);
  return (
    <BottomSheet
      title={c.changeFoods}
      appearance="suggestion"
      height={588}
      titleStyle={s.savedTitle}
      closeLabel={c.close}
      onClose={onClose}
      footer={
        <View style={s.sheetActions}>
          <AppButton variant="suggestion" secondary label={c.cancel} onPress={onClose} />
          <AppButton variant="suggestion" style={s.grow} label={c.update}
            disabled={!canUpdateFoods(current, selected)} onPress={() => onUpdate(selected)} />
        </View>
      }
    >
      <Text style={s.savedIntro}>{c.chooseFoods(selected.length)}</Text>
      {foods.map((food) => {
        const checked = selected.includes(food.id);
        const disabled = !checked && selected.length === 3;
        return (
          <Pressable
            key={food.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled }}
            disabled={disabled}
            onPress={() => setSelected((old) => toggleFood(old, food.id))}
            style={[s.checkRow, disabled && s.disabled]}
          >
            <View style={[s.checkbox, checked && s.checkboxChecked]}>
              {checked && <UiAssetIcon name="suggestion-checked" />}
            </View>
            <View style={s.foodChoice}>
              <Text style={s.text}>{food.name}</Text>
              <Text style={s.muted}>{food.ingredients.join(', ')}</Text>
            </View>
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
