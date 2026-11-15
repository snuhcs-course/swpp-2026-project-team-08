// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 상시 표시 음식 추가 카드·조리 방법 선택·삭제 가능한 토큰
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 상시 표시 카드에서 안심 음식 없음 토글을 빼고 입력 안내만 표시
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 제공 형태 자유 입력·없음 보존·키보드 포커스 연결

import { useRef, type ComponentRef } from 'react';
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
  onToggleNone: () => void;
  input: OnboardingDraft['safeFoodInput'];
  canAdd: boolean;
  onRemove: (id: string) => void;
  onInputChange: (field: keyof OnboardingDraft['safeFoodInput'], value: string) => void;
  onAdd: () => void;
}) {
  const s = copyFor(language);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const presentationRef = useRef<ComponentRef<typeof TextInput>>(null);
  const detailsRef = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <View>
      {!noSafeFoods && safeFoods.length > 0 && <View style={styles.safeFoodChips}>
        {safeFoods.map((food) => (
          <View key={food.id} style={styles.safeFoodChip}>
            <View style={styles.safeFoodChipCopy}>
              <Text style={styles.safeFoodChipName}>{food.name}</Text>
              {!!(food.preparation || food.presentationNote) && <Text style={styles.safeFoodChipDetails}>
                {[food.preparation, food.presentationNote].filter(Boolean).join(', ')}
              </Text>}
            </View>
            <Pressable
              onPress={() => onRemove(food.id)}
              accessibilityRole="button"
              accessibilityLabel={`${s.common.remove} ${food.name}`}
              hitSlop={8}
              style={styles.safeFoodRemove}
            >
              <Text style={styles.safeFoodRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>}
      <View style={styles.safeFoodForm}>
        <View style={styles.safeFoodFormHeading}>
          <Text style={styles.safeFoodFormTitle}>{s.onboarding.addSafeFood}</Text>
          <Text style={styles.safeFoodFormSubtitle}>{s.onboarding.safeFoodFormHint(childName || s.onboarding.childFallback)}</Text>
        </View>
        <View style={styles.safeFoodFields}>
          <FormField variant="safe"
            inputRef={nameRef}
            editable={!noSafeFoods}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => presentationRef.current?.focus()}
            label={s.onboarding.foodName}
            value={input.name}
            onChangeText={(value) => onInputChange('name', value)}
            placeholder={s.onboarding.safeFoodNameExample}
          />
          <FormField variant="safe"
            inputRef={presentationRef}
            editable={!noSafeFoods}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => detailsRef.current?.focus()}
            label={s.onboarding.preparation}
            optionalLabel={s.onboarding.optional}
            value={input.preparation}
            onChangeText={(value) => onInputChange('preparation', value)}
            placeholder={s.onboarding.safeFoodPreparationExample}
          />
          <FormField variant="safe-note"
            inputRef={detailsRef}
            editable={!noSafeFoods}
            returnKeyType="done"
            onSubmitEditing={() => detailsRef.current?.blur()}
            label={s.onboarding.presentationNote}
            optionalLabel={s.onboarding.optional}
            value={input.presentationNote}
            onChangeText={(value) => onInputChange('presentationNote', value)}
            placeholder={s.onboarding.safeFoodPresentationExample}
          />
        </View>
        <AppButton
          label={s.onboarding.addSafeFoodAction}
          compact
          style={styles.safeFoodSubmit}
          labelStyle={styles.safeFoodSubmitLabel}
          disabled={noSafeFoods || !canAdd}
          onPress={() => {
            if (noSafeFoods || !canAdd) return;
            onAdd();
            nameRef.current?.focus();
          }}
        />
      </View>
      <View style={styles.safeFoodNone}>
        <ChoiceRow label={s.onboarding.noSafeFoods} selected={noSafeFoods}
          multiple onPress={onToggleNone} />
        <Text style={styles.multipleHint}>{s.onboarding.multipleInput}</Text>
      </View>
    </View>
  );
}
