// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 단계로 의미 변경, 카탈로그 검색·직접 입력 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 채식 단계를 식생활 유형 단계(family)로 되돌려 반영

import Feather from '@expo/vector-icons/Feather';
import { Text, View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { DropdownChoice } from '../../../components/DropdownChoice';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { ChoiceRow } from '../../../components/ChoiceRow';
import { MultiChoice } from '../../../components/MultiChoice';
import { colors } from '../../../util/colors';
import { copyFor, labelFor, optionsFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';
import type { OnboardingDraft } from '../types';
import { styles } from './onboardingStyles';

export type ChoiceStep =
  | 'child' | 'allergies' | 'restrictions' | 'family';

type ChoiceValues = Pick<OnboardingDraft,
  'childName' | 'ageRange' | 'allergies' | 'restrictions' | 'dietaryPattern'>;
type ListField = 'allergies' | 'restrictions';
type TextField = 'childName' | 'ageRange' | 'dietaryPattern';

function Guidance({ title, body, icon = 'info' }: { title?: string; body: string; icon?: 'info' | 'utensils' }) {
  return <View style={styles.infoBanner}>
    <View style={styles.infoIcon}>{icon === 'utensils' ? <UiAssetIcon name="abc-utensils" /> : <Feather name={icon} size={13} color={colors.onboardingPrimary} />}</View>
    <View style={styles.safetyCopy}>
      {title && <Text style={styles.infoTitle}>{title}</Text>}
      <Text style={styles.infoText}>{body}</Text>
    </View>
  </View>;
}

export function ChoiceStepView({ step, values, language, onSetField, onToggleList }: {
  step: ChoiceStep;
  values: ChoiceValues;
  language: Language;
  onSetField: (field: TextField, value: string) => void;
  onToggleList: (field: ListField, value: string) => void;
}) {
  const s = copyFor(language);
  const guidance = s.onboarding.choiceGuidance;
  const subtitles = s.onboarding.choiceSubtitles as Record<string, Record<string, string>>;
  const name = values.childName.trim() || s.onboarding.childFallback;

  if (step === 'child') return (
    <View>
      <FormField
        label={s.onboarding.childName}
        value={values.childName}
        onChangeText={(value) => onSetField('childName', value)}
      />
      <Text style={styles.fieldHint}>{guidance.childName}</Text>
      <Text style={styles.sectionLabel}>{s.onboarding.ageRange}</Text>
      <DropdownChoice
        options={optionsFor('age', language)}
        value={values.ageRange}
        onChange={(value) => onSetField('ageRange', value)}
        placeholder={s.onboarding.ageRange}
        displayFallback={values.ageRange ? labelFor('age', values.ageRange, language) : undefined}
      />
    </View>
  );

  if (step === 'family') return (
    <View>
      <Text style={[styles.fieldHint, styles.dietaryPatternHelper]}>{s.onboarding.dietaryPattern.helper(name)}</Text>
      <View accessibilityRole="radiogroup">
        {s.onboarding.dietaryPattern.options.map((option) => <ChoiceRow
          key={option.id}
          label={option.label}
          subtitle={option.description}
          selected={values.dietaryPattern === option.id}
          onPress={() => onSetField('dietaryPattern', option.id)}
        />)}
      </View>
      <Guidance body={s.onboarding.dietaryPattern.caution} />
    </View>
  );

  const config = {
    allergies: { field: 'allergies', group: 'allergies', none: s.onboarding.noKnownAllergies },
    restrictions: { field: 'restrictions', group: 'restrictions', none: s.onboarding.noOtherRestrictions },
  } as const;
  const current = config[step];
  return (
    <View>
      {step === 'restrictions' && <Text style={styles.question}>{guidance.restrictionsQuestion(name)}</Text>}
      {step === 'allergies' && (
        <View style={styles.safetyBanner}>
          <View style={styles.safetyIcon}><UiAssetIcon name="onboarding-shield" /></View>
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>{s.onboarding.allergySafetyTitle}</Text>
            <Text style={styles.safetyText}>{s.onboarding.allergySafetyBody}</Text>
          </View>
        </View>
      )}
      <MultiChoice
        options={optionsFor(current.group, language)}
        labels={{ all: s.common.all }}
        inlineSubtitleIds={step === 'allergies' ? ['TREE_NUTS'] : undefined}
        optionSubtitles={step === 'allergies' ? { TREE_NUTS: s.onboarding.treeNutsHint } : subtitles[step]}
        selected={values[current.field]}
        noneLabel={current.none}
        onToggle={(value) => onToggleList(current.field, value)}
      />
      <Text style={styles.selectionHint}>{guidance.multiple}</Text>
      {step === 'restrictions' && <Guidance title={guidance.restrictionsTitle} body={guidance.restrictionsBody} />}
    </View>
  );
}
