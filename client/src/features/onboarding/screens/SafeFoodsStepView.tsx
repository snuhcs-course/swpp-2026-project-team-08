// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 상시 표시 음식 추가 카드·조리 방법 선택·삭제 가능한 토큰
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 상시 표시 카드에서 안심 음식 없음 토글을 빼고 입력 안내만 표시

import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { DropdownChoice } from '../../../components/DropdownChoice';
import { FormField } from '../../../components/FormField';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { Language, SafeFood } from '../../../types/profile';
import type { OnboardingDraft } from '../types';
import { styles } from './onboardingStyles';

export function SafeFoodsStepView({ language, childName, safeFoods, input, canAdd, onRemove, onInputChange, onAdd }: {
  language: Language;
  childName?: string;
  safeFoods: SafeFood[];
  input: OnboardingDraft['safeFoodInput'];
  canAdd: boolean;
  onRemove: (id: string) => void;
  onInputChange: (field: keyof OnboardingDraft['safeFoodInput'], value: string) => void;
  onAdd: () => void;
}) {
  const s = copyFor(language);
  const cooking = abcCopyFor(language);
  return (
    <View>
      {safeFoods.length > 0 && <View style={styles.safeFoodChips}>
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
            label={s.onboarding.foodName}
            value={input.name}
            onChangeText={(value) => onInputChange('name', value)}
            placeholder={s.onboarding.safeFoodNameExample}
          />
          <View style={styles.safeFoodCooking}>
            <View style={styles.safeFoodFieldHeading}>
              <Text style={styles.safeFoodFieldLabel}>{s.onboarding.preparation}</Text>
              <Text style={styles.safeFoodOptional}>{s.onboarding.optional}</Text>
            </View>
            <DropdownChoice
              options={[{ id: '', label: s.common.none }, ...cooking.cookingOptions.map(label => ({ id: label, label }))]}
              value={input.preparation}
              displayFallback={input.preparation || undefined}
              onChange={(value) => onInputChange('preparation', value)}
              placeholder={cooking.selectCooking}
            />
          </View>
          <FormField variant="safe-note"
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
          disabled={!canAdd}
          onPress={onAdd}
        />
      </View>
      <View style={styles.safeFoodNone}>
        <Text style={styles.multipleHint}>{s.onboarding.multipleInput}</Text>
      </View>
    </View>
  );
}
