import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Text, View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { MultiChoice } from '../../../components/MultiChoice';
import { SingleChoice } from '../../../components/SingleChoice';
import { colors } from '../../../util/colors';
import { copyFor, optionsFor } from '../../../util/strings';
import type { OnboardingContextValue } from '../hooks/useOnboarding';
import { styles } from './onboardingStyles';

export type ChoiceStep =
  | 'child' | 'allergies' | 'restrictions' | 'family' | 'approaches'
  | 'texture' | 'smell' | 'taste' | 'presentation' | 'temperature' | 'familiarity';

export function ChoiceStepView({ step, model }: { step: ChoiceStep; model: OnboardingContextValue }) {
  const { draft, language } = model;
  const [search, setSearch] = useState('');
  const [showOther, setShowOther] = useState(() => {
    const groups = {
      allergies: [draft.allergies, 'allergies'],
      restrictions: [draft.restrictions, 'restrictions'],
      family: [draft.familyFoods, 'family'],
      approaches: [draft.approaches, 'approaches'],
      texture: [draft.texture, 'texture'],
      taste: [draft.taste, 'taste'],
      presentation: [draft.presentation, 'presentation'],
    } as const;
    const config = groups[step as keyof typeof groups];
    if (!config) return false;
    const [values, group] = config;
    const baseIds = optionsFor(group, language).map((option) => option.id);
    return values.some((value) => value !== 'none' && !baseIds.includes(value));
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
        value={draft.childName}
        onChangeText={(value) => model.setField('childName', value)}
      />
      <Text style={styles.sectionLabel}>{s.onboarding.ageRange}</Text>
      <SingleChoice
        options={optionsFor('age', language)}
        value={draft.ageRange}
        onChange={(value) => model.setField('ageRange', value)}
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
          selected={draft[current.field]}
          noneLabel={current.none}
          otherLabel={otherLabel}
          onToggle={(value) => model.toggleList(current.field, value)}
          onAdd={(value) => { model.addListItem(current.field, value); setSearch(''); }}
          onRemove={(value) => model.removeListItem(current.field, value)}
          onSetAll={step === 'family' ? () => model.setList(current.field, options.map((option) => option.id)) : undefined}
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
        selected={draft[step]}
        noneLabel={noneLabel}
        freeText
        onToggle={(value) => model.toggleList(step, value)}
        onAdd={(value) => { model.addListItem(step, value); setSearch(''); }}
        onRemove={(value) => model.removeListItem(step, value)}
      />
    );
  }

  return (
    <SingleChoice
      options={optionsFor(step, language)}
      value={draft[step]}
      onChange={(value) => model.setField(step, value)}
    />
  );
}
