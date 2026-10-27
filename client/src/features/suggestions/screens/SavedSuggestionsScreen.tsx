// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { AppHeader } from '../../../components/AppHeader';
import { BottomSheet } from '../../../components/BottomSheet';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { copyFor, suggestionCopyFor } from '../../../util/strings';
import { GeneratedSuggestionBody, suggestionTargetName } from '../components/GeneratedSuggestionBody';
import { useSavedSuggestionsScreen } from '../hooks/useSavedSuggestionsScreen';
import { suggestionPreview } from '../rules';
import { suggestionStyles as s } from './suggestionStyles';
import { useEffect, useRef } from 'react';

function SavedContent({ userId, initialId = '' }: { userId: string; initialId?: string }) {
  const { language } = useProfile();
  const c = suggestionCopyFor(language);
  const model = useSavedSuggestionsScreen(userId, initialId);
  const { saved, meals, selectedId, selected, linkedMeals, removeFailed, sourceMeal } = model;
  const pendingNavigation = useRef<{ kind: 'try' | 'meal'; id: string } | null>(null);
  useEffect(() => {
    const target = pendingNavigation.current;
    if (!target || selectedId) return;
    pendingNavigation.current = null;
    if (target.kind === 'try') {
      router.push({ pathname: '/meal-checkin', params: { tryingSuggestionId: target.id } });
    } else {
      router.push({ pathname: '/meal/[mealId]', params: { mealId: target.id } });
    }
  }, [selectedId]);
  const navigateFromSheet = (kind: 'try' | 'meal', id: string) => {
    pendingNavigation.current = { kind, id };
    model.close();
  };
  const mealLabel = (meal: { mealDate: string; mealType: keyof ReturnType<typeof copyFor>['mealCheckin']['types'] }) =>
    `${new Date(`${meal.mealDate}T12:00:00`).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' })} · ${copyFor(language).mealCheckin.types[meal.mealType]}`;
  const close = () => {
    model.close();
    if (initialId) router.replace({ pathname: '/section/[name]', params: { name: 'ideas' } });
  };
  const remove = async () => {
    if (await model.remove() && initialId) router.replace({ pathname: '/section/[name]', params: { name: 'ideas' } });
  };
  return <SafeAreaView style={s.root} edges={[]}>
    <AppHeader title={c.savedTitle} backLabel={c.back} onBack={() => router.replace('/home')} />
    <ScrollView style={s.root} contentContainerStyle={s.savedListContent}>
      {(saved.isPending || saved.isError || !!saved.data?.length) && <Text style={s.savedIntro}>{c.savedIntro}</Text>}
      {saved.isPending ? <ActivityIndicator /> : saved.isError ? <>
        <Text accessibilityRole="alert" style={s.error}>{c.loadFailed}</Text>
        <AppButton label={c.retry} onPress={() => { void saved.refetch(); }} />
      </> : saved.data?.length ? saved.data.map((item) => {
        const meal = sourceMeal(item.mealId);
        return <Pressable key={item.id} accessibilityRole="button" onPress={() => model.setSelectedId(item.id)} style={s.savedCard}>
          <View style={s.savedCardHeading}><Text style={s.savedFoodName}>{suggestionTargetName(item)}</Text>
            {!!(meals.data ?? []).find((value) => value.suggestionLinks.some((link) => link.suggestionId === item.id))
              && <View style={s.trialChip}><Text style={s.savedTriedLabel}>{c.tried}</Text></View>}
          </View>
          <Text numberOfLines={1} style={s.savedPreview}>{suggestionPreview(item.whatToTry)}</Text>
          <View style={s.savedCardFooter}>
            <Text style={s.savedDate}>{meal ? mealLabel(meal) : item.createdAt.slice(0, 10)}</Text>
            <UiAssetIcon name="suggestion-open" />
          </View>
        </Pressable>;
      }) : <View style={s.emptyState}>
        <UiAssetIcon name="suggestion-empty" />
        <Text style={[s.heading, s.centeredText]}>{c.empty}</Text>
        <Text style={[s.savedIntro, s.centeredText]}>{c.emptyDetail}</Text>
        <AppButton variant="suggestion" secondary style={s.fullWidth} label={c.history}
          onPress={() => router.push({ pathname: '/section/[name]', params: { name: 'mealLog' } })} />
      </View>}
    </ScrollView>
    {!!selectedId && <BottomSheet appearance="suggestion" height={544}
      title={selected ? suggestionTargetName(selected) : c.savedTitle} closeLabel={c.close} onClose={close}
      headerContent={selected && <View style={s.detailHeader}>
        <Text style={s.muted}>{sourceMeal(selected.mealId) ? mealLabel(sourceMeal(selected.mealId)!) : selected.createdAt.slice(0, 10)}</Text>
        {linkedMeals.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.trialScroll} contentContainerStyle={s.trialRow}>
          {linkedMeals.map((meal) => <Pressable key={meal.id} accessibilityRole="button"
            style={s.trialChip} onPress={() => navigateFromSheet('meal', meal.id)}>
            <UiAssetIcon name="suggestion-link" /><Text style={s.trialLabel}>{mealLabel(meal)}</Text>
          </Pressable>)}
        </ScrollView>}
      </View>}
      footer={selected && <View style={s.stack}>
        {removeFailed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
        <View style={s.row}>
          <AppButton variant="suggestion" secondary label={c.remove} disabled={model.removing}
            onPress={() => { void remove(); }} />
          <AppButton variant="suggestion" style={s.grow} label={c.recordTry}
            onPress={() => navigateFromSheet('try', selected.id)} />
        </View>
      </View>}>
      {selected ? <GeneratedSuggestionBody item={selected} language={language} />
        : saved.isPending ? <ActivityIndicator /> : <Text style={s.error}>{c.unavailable}</Text>}
    </BottomSheet>}
  </SafeAreaView>;
}

export function SavedSuggestionsScreen({ initialId }: { initialId?: string; tryMealId?: string }) {
  const profile = useProfile();
  const auth = useAuth();
  if (profile.status === 'loading' || auth.status === 'loading') return <View style={s.root} />;
  if (!profile.profile || !auth.session) return <Redirect href="/" />;
  return <SavedContent key={`${auth.session.user.id}:${initialId ?? ''}`}
    userId={auth.session.user.id} initialId={initialId} />;
}
