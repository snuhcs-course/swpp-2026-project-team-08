import { useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { BottomSheet } from '../../../components/BottomSheet';
import type { SuggestionTarget } from '../../../types/suggestionRecord';
import type { Language } from '../../../types/profile';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

const targetKey = (target: SuggestionTarget) => `${target.foodId}:${target.ingredientId ?? ''}`;

export function ChangeFoodsSheet({
  current, options, language, onClose, onUpdate,
}: {
  current: SuggestionTarget[];
  options: { target: SuggestionTarget; name: string; detail: string }[];
  language: Language;
  onClose: () => void;
  onUpdate: (targets: SuggestionTarget[]) => void;
}) {
  const [selected, setSelected] = useState(current);
  const c = suggestionCopyFor(language);
  const changed = selected.length > 0 && (
    selected.length !== current.length
    || selected.some((target) => !current.some((item) => targetKey(item) === targetKey(target)))
  );
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
            disabled={!changed} onPress={() => onUpdate(selected)} />
        </View>
      }
    >
      <Text style={s.savedIntro}>{c.chooseFoods(selected.length)}</Text>
      {options.map(({ target, name, detail }) => {
        const checked = selected.some((item) => targetKey(item) === targetKey(target));
        return (
          <Pressable
            key={targetKey(target)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setSelected((old) => checked
              ? old.filter((item) => targetKey(item) !== targetKey(target)) : [...old, target])}
            style={s.checkRow}
          >
            <View style={[s.checkbox, checked && s.checkboxChecked]}>
              {checked && <UiAssetIcon name="suggestion-checked" />}
            </View>
            <View style={s.foodChoice}>
              <Text style={s.text}>{name}</Text>
              {!!detail && <Text style={s.muted}>{detail}</Text>}
            </View>
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
