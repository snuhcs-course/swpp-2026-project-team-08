// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import type { Language } from '../../../types/profile';
import { copyFor, suggestionCopyFor } from '../../../util/strings';
import type { SavedSuggestionFlowModel } from '../types';
import { suggestionStyles as s } from './suggestionStyles';

export function SavedSuggestionFlowView({ model: m, language, onEdit }: {
  model: SavedSuggestionFlowModel;
  language: Language;
  onEdit: (mealId: string) => void;
}) {
  const c = suggestionCopyFor(language);
  const labels = copyFor(language).mealCheckin.types;
  const day = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(
    language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' },
  );
  const date = (value: string, type: string) => `${day(value)} · ${labels[type as keyof typeof labels] ?? type}`;
  const item = m.item;
  const error = m.error === 'changed' ? c.recordChanged : m.error === 'try' ? c.tryFailed
    : m.error === 'feedback' ? c.feedbackFailed : null;
  const record = (meal: NonNullable<typeof m.selectedMeal>, selectable = false) => (
    <View style={[s.flowRecord, selectable && m.mealId === meal.id && s.feedbackSelected]}>
      <View style={s.savedCardHeading}>
        <Text style={s.recordTitle}>{date(meal.meal_date, meal.meal_type)}</Text>
        {selectable && <View style={[s.radio, m.mealId === meal.id && s.radioChecked]}>
          {m.mealId === meal.id && <View style={s.radioDot} />}
        </View>}
      </View>
      <Text style={s.text}>{meal.foods.join(', ')}</Text>
      <View style={s.badgeRow}>
        <View style={[s.trialChip, !meal.reviewed && s.unreviewedBadge]}>
          <Text style={[s.savedTriedLabel, !meal.reviewed && s.unreviewedLabel]}>{meal.reviewed ? c.reviewed : c.notReviewed}</Text>
        </View>
      </View>
    </View>
  );
  return (
    <View style={s.root}>
      <View style={s.savedHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel={c.back} onPress={m.back} style={s.savedBack}>
          <UiAssetIcon name="suggestion-back" />
        </Pressable>
        <Text accessibilityRole="header" style={s.savedTitle}>{c.recordHeader}</Text>
      </View>
      <ScrollView style={s.root} contentContainerStyle={[s.flowContent, m.mode === 'feedback' && { flexGrow: 1 }]}>
        {item && <View style={s.flowRecord}>
          <Text style={s.recordTitle}>{item.content.food_name}</Text>
          <Text numberOfLines={2} style={s.text}>{item.content.what_to_try}</Text>
          <Text style={s.savedDate}>{c.suggested} {date(item.content.meal_date, item.content.meal_type)}</Text>
        </View>}
        {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {(m.mode === 'select' || m.mode === 'confirm') && (
          m.eligible.isPending ? <ActivityIndicator /> : m.eligible.isError ? <>
            <Text accessibilityRole="alert" style={s.error}>{c.recordsFailed}</Text>
            <AppButton variant="suggestion" label={c.retry} onPress={() => { void m.eligible.refetch(); }} />
          </> : m.mode === 'select' ? <>
            <Text style={s.heading}>{c.selectMeal}</Text>
            {item && <Text style={s.savedIntro}>{c.since(day(item.content.meal_date))}</Text>}
            {!m.eligible.data?.length && <Text style={s.text}>{c.noEligible}</Text>}
            {m.eligible.data?.map(meal => <Pressable key={meal.id} accessibilityRole="radio"
              accessibilityState={{ checked: m.mealId === meal.id }} onPress={() => m.chooseMeal(meal)}>
              {record(meal, true)}
            </Pressable>)}
            <AppButton variant="suggestion" label={c.continue}
              disabled={!m.selectedMeal || m.eligible.isFetching || m.eligible.isError} onPress={m.continueMeal} />
          </> : m.selectedMeal && <>
            <Text style={s.heading}>{c.confirmTry}</Text>
            <View style={s.savedCardHeading}>
              <Text style={s.heading}>{c.selectedRecord}</Text>
              <Pressable accessibilityRole="button" onPress={m.back}><Text style={s.changeFoodsLabel}>{c.change}</Text></Pressable>
            </View>
            {record(m.selectedMeal)}
            <Text style={s.heading}>{c.selectTarget}</Text>
            <View style={s.flowRecord}>
              {m.selectedMeal.targets.map(target => <Pressable key={target.id} accessibilityRole="radio"
                accessibilityLabel={target.name} accessibilityState={{ checked: m.targetId === target.id }}
                disabled={m.busy} onPress={() => m.setTargetId(target.id)} style={s.targetChoice}>
                <View style={[s.radio, m.targetId === target.id && s.radioChecked]}>
                  {m.targetId === target.id && <View style={s.radioDot} />}
                </View>
                <Text style={[s.text, s.grow, m.targetId === target.id && s.recordTitle]}>{target.name}</Text>
              </Pressable>)}
              {!m.selectedMeal.targets.length && <AppButton variant="suggestion" label={c.editMeal} onPress={() => onEdit(m.selectedMeal!.id)} />}
            </View>
            <AppButton variant="suggestion" label={c.confirmLink}
              disabled={!m.targetId || m.busy || m.eligible.isFetching || m.eligible.isError}
              onPress={() => { void m.confirm(); }} />
          </>
        )}
        {m.mode === 'feedback' && <>
          <View style={s.feedbackSuccess}>
            <View style={s.stateIcon}><UiAssetIcon name="suggestion-success" /></View>
            <Text style={s.completionTitle}>{c.tryRecorded}</Text>
            <Text style={s.savedIntro}>{c.triedOn} {m.tried ? day(m.tried.tried_on) : ''}</Text>
          </View>
          <Text style={s.heading}>{c.feedbackPrompt}</Text>
          <View style={s.feedbackChoices}>
            {(['helpful', 'not_helpful', 'not_sure'] as const).map(value => (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: m.feedback === value }}
                disabled={m.busy} onPress={() => m.setFeedback(value)}
                style={[s.feedbackChoice, m.feedback === value && s.feedbackSelected]}>
                <Text style={s.feedbackChoiceLabel}>{value === 'helpful' ? c.helpful : value === 'not_helpful' ? c.notHelpful : c.notSure}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.feedbackFooter}>
            <AppButton variant="suggestion" label={c.saveFeedback} disabled={!m.feedback || m.busy} onPress={() => { void m.saveFeedback(); }} />
            <AppButton variant="suggestion" secondary label={c.skip} disabled={m.busy} onPress={m.finish} />
          </View>
        </>}
      </ScrollView>
    </View>
  );
}
