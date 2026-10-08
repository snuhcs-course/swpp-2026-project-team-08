import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AppButton } from '../../../components/AppButton';
import { ChoiceRow } from '../../../components/ChoiceRow';
import { FormField } from '../../../components/FormField';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor, labelFor, optionsFor, type OptionGroup } from '../../../util/strings';
import { matchingSafeFoods } from '../rules';
import type { OnboardingContextValue } from '../hooks/useOnboarding';
import type { OnboardingStep } from '../types';

type ListField = 'allergies' | 'restrictions' | 'familyFoods' | 'approaches' | 'texture' | 'taste' | 'presentation';

type Props = {
  step: OnboardingStep;
  model: OnboardingContextValue;
  onEditStep: (step: OnboardingStep) => void;
};

type MultiProps = {
  language: Language;
  group: OptionGroup;
  field: ListField;
  selected: string[];
  onToggle: (field: ListField, value: string) => void;
  onAdd: (field: ListField, value: string) => void;
  onRemove: (field: ListField, value: string) => void;
  onSetAll?: (field: ListField, values: string[]) => void;
  catalog?: OptionGroup;
  freeText?: boolean;
  noneLabel?: string;
  otherLabel?: string;
};

function MultiChoice({ language, group, field, selected, onToggle, onAdd, onRemove, onSetAll, catalog, freeText, noneLabel, otherLabel }: MultiProps) {
  const [showOther, setShowOther] = useState(() => selected.some((item) => item !== 'none' && !optionsFor(group, language).some((option) => option.id === item)));
  const [search, setSearch] = useState('');
  const s = copyFor(language);
  const baseOptions = optionsFor(group, language);
  const otherOptions = catalog ? optionsFor(catalog, language) : [];
  const custom = selected.filter((item) => item !== 'none'
    && !baseOptions.some((option) => option.id === item));
  const results = otherOptions.filter((option) =>
    !selected.includes(option.id) && option.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <View>
      {!!onSetAll && <AppButton label={s.common.all} compact secondary style={styles.allButton} onPress={() => onSetAll(field, baseOptions.map((option) => option.id))} />}
      {!!noneLabel && <ChoiceRow label={noneLabel} multiple selected={selected.includes('none')} onPress={() => onToggle(field, 'none')} />}
      {baseOptions.map((option) => <ChoiceRow key={option.id} label={option.label} subtitle={option.id === 'tree-nut' ? s.onboarding.treeNutsHint : undefined} multiple selected={selected.includes(option.id)} onPress={() => onToggle(field, option.id)} />)}
      {(!!catalog || freeText) && (
        <>
          <ChoiceRow label={otherLabel ?? s.onboarding.addOther} multiple selected={showOther} onPress={() => setShowOther((value) => !value)} />
          {showOther && (
            <View style={styles.searchPanel}>
              <Text style={styles.otherLabel}>{s.onboarding.addOther}</Text>
              <View style={styles.searchRow}>
                <View style={styles.searchField}><FormField label={s.onboarding.searchCatalog} hideLabel value={search} onChangeText={setSearch} placeholder={s.onboarding.searchCatalog} /></View>
                <AppButton label={`+ ${s.common.add}`} compact disabled={!search.trim()} onPress={() => { onAdd(field, search); setSearch(''); }} style={styles.addButton} />
              </View>
              {!!catalog && !!search.trim() && (results.length ? results.map((option) => (
                <ChoiceRow key={option.id} label={option.label} selected={false} onPress={() => { onAdd(field, option.id); setSearch(''); }} />
              )) : <Text style={styles.hint}>{s.onboarding.noMatches}</Text>)}
              <Text style={styles.otherHint}>{s.onboarding.otherHint}</Text>
            </View>
          )}
        </>
      )}
      {custom.length > 0 && (
        <View style={styles.chipWrap}>
          {custom.map((value) => (
            <Pressable key={value} onPress={() => onRemove(field, value)} accessibilityRole="button" accessibilityLabel={`${s.common.remove} ${catalog ? labelFor(catalog, value, language) : value}`} style={styles.chip}>
              <Text style={styles.chipText}>{catalog ? labelFor(catalog, value, language) : value} ×</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function SingleChoice({ language, group, value, onChange }: { language: Language; group: OptionGroup; value: string; onChange: (value: string) => void }) {
  return <View>{optionsFor(group, language).map((option) => (
    <ChoiceRow key={option.id} label={option.label} selected={value === option.id} onPress={() => onChange(option.id)} />
  ))}</View>;
}

function ReviewCard({ title, value, onEdit, editLabel }: { title: string; value: string; onEdit: () => void; editLabel: string }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTitle}>{title}</Text>
        <Pressable onPress={onEdit} accessibilityRole="button"><Text style={styles.edit}>{editLabel}</Text></Pressable>
      </View>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

export function OnboardingForm({ step, model, onEditStep }: Props) {
  const { draft, language, password } = model;
  const [safeFoodOpen, setSafeFoodOpen] = useState(() => !!draft.safeFoodInput.name || !!draft.safeFoodInput.preparation);
  const s = copyFor(language);
  const listValue = (group: OptionGroup, values: string[]) => values.length
    ? values.map((value) => labelFor(group, value, language)).join(', ') : s.common.notEntered;

  if (step === 'account') return (
    <View>
      <FormField label={s.onboarding.caregiverName} value={draft.caregiverName} onChangeText={(value) => model.setField('caregiverName', value)} />
      <FormField label={s.onboarding.email} value={draft.caregiverEmail} onChangeText={(value) => model.setField('caregiverEmail', value)} keyboardType="email-address" autoCapitalize="none" error={draft.caregiverEmail && !/\S+@\S+\.\S+/.test(draft.caregiverEmail) ? s.onboarding.emailHint : undefined} />
      {!model.editing && <FormField label={s.onboarding.password} value={password} onChangeText={model.setPassword} secureTextEntry autoCapitalize="none" error={password && password.length < 8 ? s.onboarding.passwordHint : undefined} />}
    </View>
  );

  if (step === 'consent') return (
    <View>
      <View style={[styles.consentPanel, Object.values(draft.consent).some(Boolean) && styles.consentPanelSelected]}>
        <Text style={styles.consentPanelTitle}>{s.onboarding.consentPanelTitle}</Text>
        <Text style={styles.consentPanelSubtitle}>{s.onboarding.consentPanelSubtitle}</Text>
        {(['accountPrivacy', 'photoAnalysis', 'aiTraining'] as const).map((key) => (
          <View key={key} style={[styles.consentCard, draft.consent[key] && styles.selectedConsentCard]}>
            <Pressable onPress={() => model.setConsent(key, !draft.consent[key])} accessibilityRole="checkbox" accessibilityState={{ checked: draft.consent[key] }} style={styles.consentRow}>
              <View style={[styles.consentCheck, draft.consent[key] && styles.consentChecked]}>{draft.consent[key] && <Feather name="check" size={13} color={colors.surface} />}</View>
              <View style={styles.consentCopy}>
                <Text style={styles.consentTitle}>{s.onboarding[key]} <Text style={styles.consentRequired}>{key === 'aiTraining' ? s.onboarding.optional : s.onboarding.required}</Text></Text>
                <Text style={styles.consentDescription}>{s.onboarding.consentDescriptions[key]}</Text>
                <Text style={styles.detail}>{s.onboarding.viewDetail}</Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.safetyBanner}><Feather name="shield" size={15} color={colors.error} /><View style={styles.safetyCopy}><Text style={styles.safetyTitle}>{s.onboarding.consentSafetyTitle}</Text><Text style={styles.safetyText}>{s.onboarding.consentNote}</Text></View></View>
    </View>
  );

  if (step === 'child') return (
    <View>
      <FormField label={s.onboarding.childName} value={draft.childName} onChangeText={(value) => model.setField('childName', value)} />
      <Text style={styles.sectionLabel}>{s.onboarding.ageRange}</Text>
      <SingleChoice language={language} group="age" value={draft.ageRange} onChange={(value) => model.setField('ageRange', value)} />
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
    const otherLabel = step === 'allergies' ? s.onboarding.otherAllergy : step === 'restrictions' ? s.onboarding.otherRestrictions : step === 'family' ? s.onboarding.otherFood : s.onboarding.otherApproach;
    return <View>{step === 'allergies' && <View style={styles.safetyBanner}>
      <View style={styles.safetyIcon}><Feather name="shield" size={13} color={colors.error} /></View>
      <View style={styles.safetyCopy}><Text style={styles.safetyTitle}>{s.onboarding.allergySafetyTitle}</Text><Text style={styles.safetyText}>{s.onboarding.allergySafetyBody}</Text></View>
    </View>}
      <MultiChoice key={step} language={language} field={current.field} group={current.group} catalog={current.catalog}
        selected={draft[current.field]} noneLabel={current.none} otherLabel={otherLabel} onToggle={model.toggleList} onAdd={model.addListItem}
        onRemove={model.removeListItem} onSetAll={step === 'family' ? model.setList : undefined} />
    </View>;
  }

  if (step === 'texture' || step === 'taste' || step === 'presentation') {
    const noneLabel = step === 'texture' ? s.onboarding.noTexture : step === 'taste' ? s.onboarding.noTaste : s.onboarding.noPresentation;
    return <MultiChoice key={step} language={language} field={step} group={step} selected={draft[step]}
      noneLabel={noneLabel} freeText onToggle={model.toggleList} onAdd={model.addListItem} onRemove={model.removeListItem} />;
  }

  if (step === 'smell' || step === 'temperature' || step === 'familiarity') return (
    <SingleChoice language={language} group={step} value={draft[step]} onChange={(value) => model.setField(step, value)} />
  );

  if (step === 'safe-foods') {
    const input = draft.safeFoodInput;
    return (
      <View>
        <ChoiceRow label={s.onboarding.noSafeFoods} selected={draft.noSafeFoods} onPress={() => model.setNoSafeFoods(!draft.noSafeFoods)} />
        {draft.safeFoods.map((food) => (
          <Pressable key={food.id} onPress={() => model.removeSafeFood(food.id)} accessibilityRole="button" accessibilityLabel={`${s.common.remove} ${food.name}`} style={styles.safeFoodChip}>
            <Text style={styles.chipText}>{food.name} · {food.preparation} ×</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setSafeFoodOpen((value) => !value)} accessibilityRole="button" accessibilityLabel={s.onboarding.addSafeFood} style={styles.openSafeFood}>
          <Text style={styles.openSafeFoodText}>{s.onboarding.addSafeFood}</Text><Text style={styles.plus}>+</Text>
        </Pressable>
        {safeFoodOpen && <View style={styles.safeFoodForm}>
          <FormField label={s.onboarding.foodName} value={input.name} onChangeText={(value) => model.setSafeFoodInput('name', value)} />
          <FormField label={s.onboarding.preparation} value={input.preparation} onChangeText={(value) => model.setSafeFoodInput('preparation', value)} />
          <FormField label={s.onboarding.presentationNote} value={input.presentationNote} onChangeText={(value) => model.setSafeFoodInput('presentationNote', value)} />
          <AppButton label={s.common.add} compact disabled={!input.name.trim() || !input.preparation.trim()} onPress={() => { model.addSafeFood({ name: input.name.trim(), preparation: input.preparation.trim(), presentationNote: input.presentationNote.trim() }); setSafeFoodOpen(false); }} />
        </View>}
      </View>
    );
  }

  const conflicts = matchingSafeFoods(draft, language);
  return (
    <View>
      <ReviewCard title={s.onboarding.titles.account} value={`${draft.caregiverName || s.common.notEntered} · ${draft.caregiverEmail || s.common.notEntered}`} editLabel={s.common.edit} onEdit={() => onEditStep('account')} />
      <ReviewCard title={s.onboarding.reviewChild} value={`${draft.childName || s.common.notEntered} · ${draft.ageRange ? labelFor('age', draft.ageRange, language) : s.common.notEntered}`} editLabel={s.common.edit} onEdit={() => onEditStep('child')} />
      <ReviewCard title={s.onboarding.titles.allergies} value={listValue('allergies', draft.allergies)} editLabel={s.common.edit} onEdit={() => onEditStep('allergies')} />
      <ReviewCard title={s.onboarding.titles.restrictions} value={listValue('restrictions', draft.restrictions)} editLabel={s.common.edit} onEdit={() => onEditStep('restrictions')} />
      <ReviewCard title={s.onboarding.reviewFamily} value={listValue('family', draft.familyFoods)} editLabel={s.common.edit} onEdit={() => onEditStep('family')} />
      <ReviewCard title={s.onboarding.reviewApproaches} value={listValue('approaches', draft.approaches)} editLabel={s.common.edit} onEdit={() => onEditStep('approaches')} />
      <ReviewCard title={s.onboarding.titles.texture} value={listValue('texture', draft.texture)} editLabel={s.common.edit} onEdit={() => onEditStep('texture')} />
      <ReviewCard title={s.onboarding.titles.smell} value={draft.smell ? labelFor('smell', draft.smell, language) : s.common.notEntered} editLabel={s.common.edit} onEdit={() => onEditStep('smell')} />
      <ReviewCard title={s.onboarding.titles.taste} value={listValue('taste', draft.taste)} editLabel={s.common.edit} onEdit={() => onEditStep('taste')} />
      <ReviewCard title={s.onboarding.titles.presentation} value={listValue('presentation', draft.presentation)} editLabel={s.common.edit} onEdit={() => onEditStep('presentation')} />
      <ReviewCard title={s.onboarding.titles.temperature} value={draft.temperature ? labelFor('temperature', draft.temperature, language) : s.common.notEntered} editLabel={s.common.edit} onEdit={() => onEditStep('temperature')} />
      <ReviewCard title={s.onboarding.reviewFamiliarity} value={draft.familiarity ? labelFor('familiarity', draft.familiarity, language) : s.common.notEntered} editLabel={s.common.edit} onEdit={() => onEditStep('familiarity')} />
      <ReviewCard title={s.onboarding.reviewSafeFoods} value={draft.noSafeFoods ? s.onboarding.noSafeFoods : draft.safeFoods.length ? draft.safeFoods.map((food) => `${food.name} · ${food.preparation}`).join(', ') : s.common.notEntered} editLabel={s.common.edit} onEdit={() => onEditStep('safe-foods')} />
      {conflicts.length > 0 && <Pressable onPress={() => onEditStep('allergies')} accessibilityRole="button"><Text style={styles.warning}>{s.onboarding.conflict} {conflicts.join(', ')} · {s.common.edit}</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.onboardingMuted, fontSize: 9, lineHeight: 13, marginTop: 4, fontFamily: fonts.interRegular },
  sectionLabel: { color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interExtraBold, marginBottom: 6 },
  allButton: { alignSelf: 'flex-end', marginBottom: 6 },
  otherLabel: { color: colors.onboardingText, fontSize: 9, fontFamily: fonts.interExtraBold, textTransform: 'uppercase', marginTop: 2, marginBottom: 3 },
  searchPanel: { marginTop: 3 },
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  searchField: { flex: 1 },
  addButton: { width: 72, minHeight: 40, borderRadius: 8 },
  otherHint: { color: colors.onboardingMuted, fontSize: 8, fontFamily: fonts.interRegular },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  chip: { borderRadius: 999, backgroundColor: colors.onboardingSelected, borderWidth: 1, borderColor: colors.onboardingPrimary, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interBold },
  consentPanel: { backgroundColor: colors.onboardingSelected, borderRadius: 14, borderWidth: 1, borderColor: colors.onboardingBorder, padding: 9, marginBottom: 8 },
  consentPanelSelected: { borderColor: colors.onboardingPrimary },
  consentPanelTitle: { color: colors.onboardingText, fontSize: 11, fontFamily: fonts.interBold },
  consentPanelSubtitle: { color: colors.onboardingMuted, fontSize: 9, fontFamily: fonts.interRegular, marginTop: 2, marginBottom: 7 },
  consentCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.onboardingBorder, padding: 9, marginBottom: 7 },
  selectedConsentCard: { backgroundColor: colors.onboardingSelected, borderColor: colors.onboardingPrimary },
  consentRow: { flexDirection: 'row', gap: 8 },
  consentCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.onboardingBorder, alignItems: 'center', justifyContent: 'center' },
  consentChecked: { backgroundColor: colors.onboardingPrimary, borderColor: colors.onboardingPrimary },
  consentCopy: { flex: 1, gap: 3 },
  consentTitle: { color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interBold },
  consentRequired: { color: colors.onboardingMuted, fontSize: 8, fontFamily: fonts.interMedium },
  consentDescription: { color: colors.onboardingMuted, fontSize: 9, lineHeight: 12, fontFamily: fonts.interRegular },
  detail: { color: colors.onboardingPrimary, fontSize: 8, fontFamily: fonts.interMedium, marginTop: 2 },
  safetyBanner: { flexDirection: 'row', gap: 8, backgroundColor: colors.safetySurface, borderRadius: 11, padding: 8, marginBottom: 8, alignItems: 'flex-start' },
  safetyIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  safetyCopy: { flex: 1, gap: 2 },
  safetyTitle: { color: colors.error, fontSize: 10, fontFamily: fonts.interMedium },
  safetyText: { color: colors.onboardingText, fontSize: 9, lineHeight: 12, fontFamily: fonts.interRegular, flex: 1 },
  safeFoodChip: { borderRadius: 10, backgroundColor: colors.onboardingSelected, padding: 11, marginBottom: 8 },
  openSafeFood: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 10, marginTop: 12, paddingHorizontal: 12, minHeight: 46 },
  openSafeFoodText: { color: colors.onboardingText, fontSize: 13, fontWeight: '700' },
  plus: { color: colors.onboardingPrimary, fontSize: 22, fontWeight: '800' },
  safeFoodForm: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.onboardingBorder, padding: 12, marginTop: 12 },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.onboardingBorder, padding: 13, marginBottom: 9 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  reviewTitle: { color: colors.onboardingText, fontSize: 14, fontWeight: '800', flex: 1 },
  reviewValue: { color: colors.onboardingMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  edit: { color: colors.onboardingPrimary, fontSize: 12, fontWeight: '800' },
  warning: { color: colors.error, backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 18 },
});
