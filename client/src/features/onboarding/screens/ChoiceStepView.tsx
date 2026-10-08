import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Text, View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { MultiChoice } from '../../../components/MultiChoice';
import { SingleChoice } from '../../../components/SingleChoice';
import { colors } from '../../../util/colors';
import { copyFor, optionsFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';
import type { OnboardingDraft } from '../types';
import { styles } from './onboardingStyles';

export type ChoiceStep =
  | 'child' | 'allergies' | 'restrictions' | 'family' | 'approaches'
  | 'texture' | 'smell' | 'taste' | 'presentation' | 'temperature' | 'familiarity';

type ChoiceValues = Pick<OnboardingDraft,
  'childName' | 'ageRange' | 'allergies' | 'restrictions' | 'familyFoods' |
  'approaches' | 'texture' | 'smell' | 'taste' | 'presentation' |
  'temperature' | 'familiarity'>;
type ListField = 'allergies' | 'restrictions' | 'familyFoods' | 'approaches' | 'texture' | 'taste' | 'presentation';
type TextField = 'childName' | 'ageRange' | 'smell' | 'temperature' | 'familiarity';

export function ChoiceStepView({ step, values, language, onSetField, onToggleList, onAddListItem, onRemoveListItem, onSetList }: {
  step: ChoiceStep;
  values: ChoiceValues;
  language: Language;
  onSetField: (field: TextField, value: string) => void;
  onToggleList: (field: ListField, value: string) => void;
  onAddListItem: (field: ListField, value: string) => void;
  onRemoveListItem: (field: ListField, value: string) => void;
  onSetList: (field: ListField, values: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [showOther, setShowOther] = useState(() => {
    const groups = {
      allergies: [values.allergies, 'allergies'],
      restrictions: [values.restrictions, 'restrictions'],
      family: [values.familyFoods, 'family'],
      approaches: [values.approaches, 'approaches'],
      texture: [values.texture, 'texture'],
      taste: [values.taste, 'taste'],
      presentation: [values.presentation, 'presentation'],
    } as const;
    const config = groups[step as keyof typeof groups];
    if (!config) return false;
    const [selectedValues, group] = config;
    const baseIds = optionsFor(group, language).map((option) => option.id);
    return selectedValues.some((value) => value !== 'none' && !baseIds.includes(value));
  });
  const s = copyFor(language);
  const labels = {
    all: s.common.all,
    add: s.common.add,
    remove: s.common.remove,
    other: s.onboarding.addOther,
    search: s.onboarding.searchCatalog,
    noMatches: s.onboarding.noMatches,
    otherHint: s.onboarding.otherHint,
  };

  if (step === 'child') return (
    <View>
      <FormField
        label={s.onboarding.childName}
        value={values.childName}
        onChangeText={(value) => onSetField('childName', value)}
      />
      <Text style={styles.sectionLabel}>{s.onboarding.ageRange}</Text>
      <SingleChoice
        options={optionsFor('age', language)}
        value={values.ageRange}
        onChange={(value) => onSetField('ageRange', value)}
      />
    </View>
  );

  if (step === 'allergies' || step === 'restrictions' || step === 'family' || step === 'approaches') {
    const config = {
      allergies: { field: 'allergies', group: 'allergies', catalog: 'allergyCatalog', none: s.onboarding.noKnownAllergies },
      restrictions: { field: 'restrictions', group: 'restrictions', catalog: 'restrictionCatalog', none: s.onboarding.noOtherRestrictions },
      family: { field: 'familyFoods', group: 'family', catalog: 'familyCatalog', none: undefined },
      approaches: { field: 'approaches', group: 'approaches', catalog: 'approachCatalog', none: s.common.none },
    } as const;
    const current = config[step];
    const options = optionsFor(current.group, language);
    const otherLabel = step === 'allergies'
      ? s.onboarding.otherAllergy
      : step === 'restrictions'
        ? s.onboarding.otherRestrictions
        : step === 'family'
          ? s.onboarding.otherFood
          : s.onboarding.otherApproach;
    return (
      <View>
        {step === 'allergies' && (
          <View style={styles.safetyBanner}>
            <View style={styles.safetyIcon}><Feather name="shield" size={13} color={colors.error} /></View>
            <View style={styles.safetyCopy}>
              <Text style={styles.safetyTitle}>{s.onboarding.allergySafetyTitle}</Text>
              <Text style={styles.safetyText}>{s.onboarding.allergySafetyBody}</Text>
            </View>
          </View>
        )}
        <MultiChoice
          options={options}
          catalogOptions={optionsFor(current.catalog, language)}
          labels={labels}
          search={search}
          onSearchChange={setSearch}
          showOther={showOther}
          onShowOtherChange={setShowOther}
          optionSubtitles={step === 'allergies' ? { 'tree-nut': s.onboarding.treeNutsHint } : undefined}
          selected={values[current.field]}
          noneLabel={current.none}
          otherLabel={otherLabel}
          onToggle={(value) => onToggleList(current.field, value)}
          onAdd={(value) => { onAddListItem(current.field, value); setSearch(''); }}
          onRemove={(value) => onRemoveListItem(current.field, value)}
          onSetAll={step === 'family' ? () => onSetList(current.field, options.map((option) => option.id)) : undefined}
        />
      </View>
    );
  }

  if (step === 'texture' || step === 'taste' || step === 'presentation') {
    const noneLabel = step === 'texture'
      ? s.onboarding.noTexture
      : step === 'taste'
        ? s.onboarding.noTaste
        : s.onboarding.noPresentation;
    return (
      <MultiChoice
        options={optionsFor(step, language)}
        labels={labels}
        search={search}
        onSearchChange={setSearch}
        showOther={showOther}
        onShowOtherChange={setShowOther}
        selected={values[step]}
        noneLabel={noneLabel}
        freeText
        onToggle={(value) => onToggleList(step, value)}
        onAdd={(value) => { onAddListItem(step, value); setSearch(''); }}
        onRemove={(value) => onRemoveListItem(step, value)}
      />
    );
  }

  return (
    <SingleChoice
      options={optionsFor(step, language)}
      value={values[step]}
      onChange={(value) => onSetField(step, value)}
    />
  );
}
