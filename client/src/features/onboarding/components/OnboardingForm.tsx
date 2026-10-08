import { MultiChoice } from '../../../components/MultiChoice';
import { SingleChoice } from '../../../components/SingleChoice';
import { ReviewCard } from '../../../components/ReviewCard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AppButton } from '../../../components/AppButton';
import { ChoiceRow } from '../../../components/ChoiceRow';
import { FormField } from '../../../components/FormField';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor, labelFor, optionsFor, type OptionGroup } from '../../../util/strings';
import { matchingSafeFoods } from '../rules';
import type { OnboardingContextValue } from '../hooks/useOnboarding';
import type { OnboardingStep } from '../types';

type Props = {
  step: OnboardingStep;
  model: OnboardingContextValue;
  onEditStep: (step: OnboardingStep) => void;
};

export function OnboardingForm({ step, model, onEditStep }: Props) {
  const { draft, language, password } = model;
  const [safeFoodOpen, setSafeFoodOpen] = useState(
    () => !!draft.safeFoodInput.name || !!draft.safeFoodInput.preparation,
  );
  const [choiceSearch, setChoiceSearch] = useState('');
  const [showOtherChoice, setShowOtherChoice] = useState(() => {
    const choiceGroups = {
      allergies: [draft.allergies, 'allergies'],
      restrictions: [draft.restrictions, 'restrictions'],
      family: [draft.familyFoods, 'family'],
      approaches: [draft.approaches, 'approaches'],
      texture: [draft.texture, 'texture'],
      taste: [draft.taste, 'taste'],
      presentation: [draft.presentation, 'presentation'],
    } as const;
    const config = choiceGroups[step as keyof typeof choiceGroups];
    if (!config) return false;
    const [values, group] = config;
    const baseIds = optionsFor(group, language).map((option) => option.id);
    return values.some((value) => value !== 'none' && !baseIds.includes(value));
  });
  const s = copyFor(language);
  const choiceLabels = {
    all: s.common.all,
    add: s.common.add,
    remove: s.common.remove,
    other: s.onboarding.addOther,
    search: s.onboarding.searchCatalog,
    noMatches: s.onboarding.noMatches,
    otherHint: s.onboarding.otherHint,
  };
  const listValue = (group: OptionGroup, values: string[]) =>
    values.length
      ? values.map((value) => labelFor(group, value, language)).join(', ')
      : s.common.notEntered;

  if (step === 'account')
    return (
      <View>
        <FormField
          label={s.onboarding.caregiverName}
          value={draft.caregiverName}
          onChangeText={(value) => model.setField('caregiverName', value)}
        />
        <FormField
          label={s.onboarding.email}
          value={draft.caregiverEmail}
          onChangeText={(value) => model.setField('caregiverEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={
            draft.caregiverEmail && !/\S+@\S+\.\S+/.test(draft.caregiverEmail)
              ? s.onboarding.emailHint
              : undefined
          }
        />
        {!model.editing && (
          <FormField
            label={s.onboarding.password}
            value={password}
            onChangeText={model.setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={
              password && password.length < 8
                ? s.onboarding.passwordHint
                : undefined
            }
          />
        )}
      </View>
    );

  if (step === 'consent')
    return (
      <View>
        <View
          style={[
            styles.consentPanel,
            Object.values(draft.consent).some(Boolean) &&
              styles.consentPanelSelected,
          ]}
        >
          <Text style={styles.consentPanelTitle}>
            {s.onboarding.consentPanelTitle}
          </Text>
          <Text style={styles.consentPanelSubtitle}>
            {s.onboarding.consentPanelSubtitle}
          </Text>
          {(['accountPrivacy', 'photoAnalysis', 'aiTraining'] as const).map(
            (key) => (
              <View
                key={key}
                style={[
                  styles.consentCard,
                  draft.consent[key] && styles.selectedConsentCard,
                ]}
              >
                <Pressable
                  onPress={() => model.setConsent(key, !draft.consent[key])}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: draft.consent[key] }}
                  style={styles.consentRow}
                >
                  <View
                    style={[
                      styles.consentCheck,
                      draft.consent[key] && styles.consentChecked,
                    ]}
                  >
                    {draft.consent[key] && (
                      <Feather name="check" size={13} color={colors.surface} />
                    )}
                  </View>
                  <View style={styles.consentCopy}>
                    <Text style={styles.consentTitle}>
                      {s.onboarding[key]}{' '}
                      <Text style={styles.consentRequired}>
                        {key === 'aiTraining'
                          ? s.onboarding.optional
                          : s.onboarding.required}
                      </Text>
                    </Text>
                    <Text style={styles.consentDescription}>
                      {s.onboarding.consentDescriptions[key]}
                    </Text>
                    <Text style={styles.detail}>{s.onboarding.viewDetail}</Text>
                  </View>
                </Pressable>
              </View>
            ),
          )}
        </View>
        <View style={styles.safetyBanner}>
          <Feather name="shield" size={15} color={colors.error} />
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>
              {s.onboarding.consentSafetyTitle}
            </Text>
            <Text style={styles.safetyText}>{s.onboarding.consentNote}</Text>
          </View>
        </View>
      </View>
    );

  if (step === 'child')
    return (
      <View>
        <FormField
          label={s.onboarding.childName}
          value={draft.childName}
          onChangeText={(value) => model.setField('childName', value)}
        />
        <Text style={styles.sectionLabel}>{s.onboarding.ageRange}</Text>
        <SingleChoice
          language={language}
          group="age"
          value={draft.ageRange}
          onChange={(value) => model.setField('ageRange', value)}
        />
      </View>
    );

  if (
    step === 'allergies' ||
    step === 'restrictions' ||
    step === 'family' ||
    step === 'approaches'
  ) {
    const config = {
      allergies: {
        field: 'allergies',
        group: 'allergies',
        catalog: 'allergyCatalog',
        none: s.onboarding.noKnownAllergies,
      },
      restrictions: {
        field: 'restrictions',
        group: 'restrictions',
        catalog: 'restrictionCatalog',
        none: s.onboarding.noOtherRestrictions,
      },
      family: {
        field: 'familyFoods',
        group: 'family',
        catalog: 'familyCatalog',
        none: undefined,
      },
      approaches: {
        field: 'approaches',
        group: 'approaches',
        catalog: 'approachCatalog',
        none: s.common.none,
      },
    } as const;
    const current = config[step];
    const otherLabel =
      step === 'allergies'
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
            <View style={styles.safetyIcon}>
              <Feather name="shield" size={13} color={colors.error} />
            </View>
            <View style={styles.safetyCopy}>
              <Text style={styles.safetyTitle}>
                {s.onboarding.allergySafetyTitle}
              </Text>
              <Text style={styles.safetyText}>
                {s.onboarding.allergySafetyBody}
              </Text>
            </View>
          </View>
        )}
        <MultiChoice
          key={step}
          options={optionsFor(current.group, language)}
          catalogOptions={optionsFor(current.catalog, language)}
          labels={choiceLabels}
          search={choiceSearch}
          onSearchChange={setChoiceSearch}
          showOther={showOtherChoice}
          onShowOtherChange={setShowOtherChoice}
          optionSubtitles={
            step === 'allergies'
              ? { 'tree-nut': s.onboarding.treeNutsHint }
              : undefined
          }
          selected={draft[current.field]}
          noneLabel={current.none}
          otherLabel={otherLabel}
          onToggle={(value) => model.toggleList(current.field, value)}
          onAdd={(value) => {
            model.addListItem(current.field, value);
            setChoiceSearch('');
          }}
          onRemove={(value) => model.removeListItem(current.field, value)}
          onSetAll={step === 'family' ? () => model.setList(current.field, optionsFor(current.group, language).map((option) => option.id)) : undefined}
        />
      </View>
    );
  }

  if (step === 'texture' || step === 'taste' || step === 'presentation') {
    const noneLabel =
      step === 'texture'
        ? s.onboarding.noTexture
        : step === 'taste'
          ? s.onboarding.noTaste
          : s.onboarding.noPresentation;
    return (
      <MultiChoice
        key={step}
        options={optionsFor(step, language)}
        labels={choiceLabels}
        search={choiceSearch}
        onSearchChange={setChoiceSearch}
        showOther={showOtherChoice}
        onShowOtherChange={setShowOtherChoice}
        selected={draft[step]}
        noneLabel={noneLabel}
        freeText
        onToggle={(value) => model.toggleList(step, value)}
        onAdd={(value) => {
          model.addListItem(step, value);
          setChoiceSearch('');
        }}
        onRemove={(value) => model.removeListItem(step, value)}
      />
    );
  }

  if (step === 'smell' || step === 'temperature' || step === 'familiarity')
    return (
      <SingleChoice
        language={language}
        group={step}
        value={draft[step]}
        onChange={(value) => model.setField(step, value)}
      />
    );

  if (step === 'safe-foods') {
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
            <Text style={styles.chipText}>
              {food.name} · {food.preparation} ×
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setSafeFoodOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={s.onboarding.addSafeFood}
          style={styles.openSafeFood}
        >
          <Text style={styles.openSafeFoodText}>
            {s.onboarding.addSafeFood}
          </Text>
          <Text style={styles.plus}>+</Text>
        </Pressable>
        {safeFoodOpen && (
          <View style={styles.safeFoodForm}>
            <FormField
              label={s.onboarding.foodName}
              value={input.name}
              onChangeText={(value) => model.setSafeFoodInput('name', value)}
            />
            <FormField
              label={s.onboarding.preparation}
              value={input.preparation}
              onChangeText={(value) =>
                model.setSafeFoodInput('preparation', value)
              }
            />
            <FormField
              label={s.onboarding.presentationNote}
              value={input.presentationNote}
              onChangeText={(value) =>
                model.setSafeFoodInput('presentationNote', value)
              }
            />
            <AppButton
              label={s.common.add}
              compact
              disabled={!input.name.trim() || !input.preparation.trim()}
              onPress={() => {
                model.addSafeFood({
                  name: input.name.trim(),
                  preparation: input.preparation.trim(),
                  presentationNote: input.presentationNote.trim(),
                });
                setSafeFoodOpen(false);
              }}
            />
          </View>
        )}
      </View>
    );
  }

  const conflicts = matchingSafeFoods(draft, language);
  return (
    <View>
      <ReviewCard
        title={s.onboarding.titles.account}
        value={`${draft.caregiverName || s.common.notEntered} · ${draft.caregiverEmail || s.common.notEntered}`}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('account')}
      />
      <ReviewCard
        title={s.onboarding.reviewChild}
        value={`${draft.childName || s.common.notEntered} · ${draft.ageRange ? labelFor('age', draft.ageRange, language) : s.common.notEntered}`}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('child')}
      />
      <ReviewCard
        title={s.onboarding.titles.allergies}
        value={listValue('allergies', draft.allergies)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('allergies')}
      />
      <ReviewCard
        title={s.onboarding.titles.restrictions}
        value={listValue('restrictions', draft.restrictions)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('restrictions')}
      />
      <ReviewCard
        title={s.onboarding.reviewFamily}
        value={listValue('family', draft.familyFoods)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('family')}
      />
      <ReviewCard
        title={s.onboarding.reviewApproaches}
        value={listValue('approaches', draft.approaches)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('approaches')}
      />
      <ReviewCard
        title={s.onboarding.titles.texture}
        value={listValue('texture', draft.texture)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('texture')}
      />
      <ReviewCard
        title={s.onboarding.titles.smell}
        value={
          draft.smell
            ? labelFor('smell', draft.smell, language)
            : s.common.notEntered
        }
        editLabel={s.common.edit}
        onEdit={() => onEditStep('smell')}
      />
      <ReviewCard
        title={s.onboarding.titles.taste}
        value={listValue('taste', draft.taste)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('taste')}
      />
      <ReviewCard
        title={s.onboarding.titles.presentation}
        value={listValue('presentation', draft.presentation)}
        editLabel={s.common.edit}
        onEdit={() => onEditStep('presentation')}
      />
      <ReviewCard
        title={s.onboarding.titles.temperature}
        value={
          draft.temperature
            ? labelFor('temperature', draft.temperature, language)
            : s.common.notEntered
        }
        editLabel={s.common.edit}
        onEdit={() => onEditStep('temperature')}
      />
      <ReviewCard
        title={s.onboarding.reviewFamiliarity}
        value={
          draft.familiarity
            ? labelFor('familiarity', draft.familiarity, language)
            : s.common.notEntered
        }
        editLabel={s.common.edit}
        onEdit={() => onEditStep('familiarity')}
      />
      <ReviewCard
        title={s.onboarding.reviewSafeFoods}
        value={
          draft.noSafeFoods
            ? s.onboarding.noSafeFoods
            : draft.safeFoods.length
              ? draft.safeFoods
                  .map((food) => `${food.name} · ${food.preparation}`)
                  .join(', ')
              : s.common.notEntered
        }
        editLabel={s.common.edit}
        onEdit={() => onEditStep('safe-foods')}
      />
      {conflicts.length > 0 && (
        <Pressable
          onPress={() => onEditStep('allergies')}
          accessibilityRole="button"
        >
          <Text style={styles.warning}>
            {s.onboarding.conflict} {conflicts.join(', ')} · {s.common.edit}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.onboardingText,
    fontSize: 10,
    fontFamily: fonts.interExtraBold,
    marginBottom: 6,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.onboardingSelected,
    borderWidth: 1,
    borderColor: colors.onboardingPrimary,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    color: colors.onboardingText,
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  consentPanel: {
    backgroundColor: colors.onboardingSelected,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    padding: 9,
    marginBottom: 8,
  },
  consentPanelSelected: { borderColor: colors.onboardingPrimary },
  consentPanelTitle: {
    color: colors.onboardingText,
    fontSize: 11,
    fontFamily: fonts.interBold,
  },
  consentPanelSubtitle: {
    color: colors.onboardingMuted,
    fontSize: 9,
    fontFamily: fonts.interRegular,
    marginTop: 2,
    marginBottom: 7,
  },
  consentCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    padding: 9,
    marginBottom: 7,
  },
  selectedConsentCard: {
    backgroundColor: colors.onboardingSelected,
    borderColor: colors.onboardingPrimary,
  },
  consentRow: { flexDirection: 'row', gap: 8 },
  consentCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentChecked: {
    backgroundColor: colors.onboardingPrimary,
    borderColor: colors.onboardingPrimary,
  },
  consentCopy: { flex: 1, gap: 3 },
  consentTitle: {
    color: colors.onboardingText,
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  consentRequired: {
    color: colors.onboardingMuted,
    fontSize: 8,
    fontFamily: fonts.interMedium,
  },
  consentDescription: {
    color: colors.onboardingMuted,
    fontSize: 9,
    lineHeight: 12,
    fontFamily: fonts.interRegular,
  },
  detail: {
    color: colors.onboardingPrimary,
    fontSize: 8,
    fontFamily: fonts.interMedium,
    marginTop: 2,
  },
  safetyBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.safetySurface,
    borderRadius: 11,
    padding: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  safetyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  safetyCopy: { flex: 1, gap: 2 },
  safetyTitle: {
    color: colors.error,
    fontSize: 10,
    fontFamily: fonts.interMedium,
  },
  safetyText: {
    color: colors.onboardingText,
    fontSize: 9,
    lineHeight: 12,
    fontFamily: fonts.interRegular,
    flex: 1,
  },
  safeFoodChip: {
    borderRadius: 10,
    backgroundColor: colors.onboardingSelected,
    padding: 11,
    marginBottom: 8,
  },
  openSafeFood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  openSafeFoodText: {
    color: colors.onboardingText,
    fontSize: 13,
    fontWeight: '700',
  },
  plus: { color: colors.onboardingPrimary, fontSize: 22, fontWeight: '800' },
  safeFoodForm: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    padding: 12,
    marginTop: 12,
  },
  warning: {
    color: colors.error,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
  },
});
