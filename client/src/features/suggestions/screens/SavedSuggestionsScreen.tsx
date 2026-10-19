// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader } from '../../../components/AppHeader';
import { Redirect, router, useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { BottomSheet } from '../../../components/BottomSheet';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { useProfile } from '../../../providers/ProfileProvider';
import { useAuth } from '../../../providers/AuthProvider';
import { suggestionCopyFor, copyFor } from '../../../util/strings';
import { SuggestionBody } from '../components/SuggestionBody';
import { useSavedSuggestionFlow } from '../hooks/useSavedSuggestionFlow';
import { suggestionPreview, suggestionTryChips } from '../rules';
import { SavedSuggestionFlowView } from './SavedSuggestionFlowView';
import { suggestionStyles as s } from './suggestionStyles';

const offsets = new Map<string, number>();
function SavedContent({
  childId,
  initialId,
  tryMealId,
}: {
  childId: string;
  initialId?: string;
  tryMealId?: string;
}) {
  const { language } = useProfile();
  const c = suggestionCopyFor(language);
  const focused = useIsFocused();
  const model = useSavedSuggestionFlow(
    childId,
    initialId,
    tryMealId,
    initialId
      ? () => router.replace({ pathname: '/section/[name]', params: { name: 'ideas' } })
      : undefined,
  );
  useEffect(() => {
    if (focused && !initialId) router.setParams({ suggestionFlow: model.mode === 'list' ? '' : 'record' });
  }, [focused, initialId, model.mode]);
  const listRef = useRef<ScrollView>(null);
  const item = model.item;
  const trialChips = suggestionTryChips(item?.tries ?? []);
  const history = () => router.push({ pathname: '/section/[name]', params: { name: 'mealLog' } });
  const date = (day: string, type: string) =>
    `${new Date(`${day}T12:00:00`).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${copyFor(language).mealCheckin.types[type as 'breakfast'] ?? type}`;
  useEffect(() => {
    if (!focused) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (model.mode !== 'list' || model.selectedId) {
        model.back();
        return true;
      }
      return false;
    });
    return () => listener.remove();
  });
  return (
    <SafeAreaView style={s.root} edges={[]}>
      <View style={[s.root, model.mode !== 'list' && s.hidden]}>
        <AppHeader title={c.savedTitle} backLabel={c.back} onBack={() => router.replace('/home')} />
        <ScrollView
          ref={listRef}
          onContentSizeChange={() =>
            listRef.current?.scrollTo({ y: offsets.get(childId) ?? 0, animated: false })
          }
          scrollEventThrottle={100}
          onScroll={(event) => offsets.set(childId, event.nativeEvent.contentOffset.y)}
          style={s.root}
          contentContainerStyle={s.savedListContent}
        >
          {(model.list.isPending || model.list.isError || !!model.list.data?.length) && <Text style={s.savedIntro}>{c.savedIntro}</Text>}
          {model.removed && (
            <Text accessibilityLiveRegion="polite" style={s.success}>
              {c.removed}
            </Text>
          )}
          {model.error === 'unavailable' && <Text style={s.error}>{c.unavailable}</Text>}
          {model.error === 'linked' && <Text style={s.error}>{c.linkedUnavailable}</Text>}
          {model.list.isPending ? (
            <ActivityIndicator />
          ) : model.list.isError ? (
            <>
              <Text style={s.error}>{c.loadFailed}</Text>
              <AppButton
                label={c.retry}
                onPress={() => {
                  void model.list.refetch();
                }}
              />
            </>
          ) : model.list.data?.length ? (
            model.list.data.map((value) => (
              <Pressable
                key={value.id}
                accessibilityRole="button"
                onPress={() => model.open(value)}
                style={s.savedCard}
              >
                <View style={s.savedCardHeading}>
                  <Text style={s.savedFoodName}>{value.content.food_name}</Text>
                  {!!value.tries.length && (
                    <View style={s.trialChip}>
                      <Text style={s.savedTriedLabel}>{c.tried}</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={s.savedPreview}>
                  {suggestionPreview(value.content.what_to_try)}
                </Text>
                <View style={s.savedCardFooter}>
                  <Text style={s.savedDate}>
                    {date(value.content.meal_date, value.content.meal_type)}
                  </Text>
                  <UiAssetIcon name="suggestion-open" />
                </View>
              </Pressable>
            ))
          ) : (
            <View style={s.emptyState}>
              <UiAssetIcon name="suggestion-empty" />
              <Text style={[s.heading, s.centeredText]}>{c.empty}</Text>
              <Text style={[s.savedIntro, s.centeredText]}>{c.emptyDetail}</Text>
              <AppButton variant="suggestion" secondary style={s.fullWidth} label={c.history} onPress={history} />
            </View>
          )}
        </ScrollView>
      </View>
      {model.mode !== 'list' && (
        <SavedSuggestionFlowView
          model={model}
          language={language}
          onEdit={(mealId) => router.push({ pathname: '/after-meal-review', params: { mealId } })}
        />
      )}
      {focused && !!model.selectedId && model.mode === 'list' && (
        <BottomSheet
          appearance="suggestion"
          height={544}
          title={item?.content.food_name ?? c.savedTitle}
          overlay={item && model.menu ? <>
            <Pressable accessibilityRole="button" accessibilityLabel={c.cancel} style={s.menuDismiss} onPress={() => model.setMenu(false)} />
            <View style={s.methodMenu}>
              <Pressable accessibilityRole="button" onPress={model.startLink} style={s.methodRow}>
                <Text style={s.methodLabel}>{c.linkExisting}</Text><UiAssetIcon name="suggestion-open" />
              </Pressable>
              <Pressable accessibilityRole="button" style={s.methodRow} onPress={() => {
                model.setMenu(false);
                router.push({ pathname: '/meal-checkin', params: { tryingSuggestionId: item.id } });
              }}>
                <Text style={s.methodLabel}>{c.logMeal}</Text><UiAssetIcon name="suggestion-open" />
              </Pressable>
            </View>
          </> : undefined}
          closeLabel={c.close}
          onClose={model.close}
          headerContent={item && (
            <View style={s.detailHeader}>
              <Text style={s.muted}>{date(item.content.meal_date, item.content.meal_type)}</Text>
              {!!item.tries.length && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={s.trialScroll}
                  contentContainerStyle={s.trialRow}
                >
                  {trialChips.map(({ trial, showMealType }) => {
                    const [year, month, day] = trial.tried_on.split('-').map(Number);
                    const label = c.tryChip(
                      new Date(year, month - 1, day).toLocaleDateString(
                        language === 'ko' ? 'ko-KR' : 'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' },
                      ),
                      showMealType && trial.meal_type
                        ? copyFor(language).mealCheckin.types[trial.meal_type]
                        : undefined,
                    );
                    return (
                      <Pressable
                        key={trial.id}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ disabled: model.busy }}
                        disabled={model.busy}
                        style={s.trialChip}
                        onPress={() => {
                          void model.showLinked(trial).then((mealId) => {
                            if (mealId) router.push({ pathname: '/meal/[mealId]', params: { mealId } });
                          });
                        }}
                      >
                        <UiAssetIcon name="suggestion-link" />
                        <Text style={s.trialLabel}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}
          footer={
            item && (
              <View style={s.stack}>
                {model.error === 'remove' && (
                  <Text accessibilityRole="alert" style={s.error}>
                    {c.saveFailed}
                  </Text>
                )}
                {model.error === 'linked' && (
                  <Text accessibilityRole="alert" style={s.error}>
                    {c.linkedUnavailable}
                  </Text>
                )}
                <View style={s.row}>
                  <AppButton variant="suggestion" secondary label={c.remove} disabled={model.busy}
                    onPress={() => { void model.remove(); }} />
                  <AppButton variant="suggestion" style={s.grow} label={item.tries.length ? c.addTry : c.recordTry}
                    disabled={model.busy} onPress={() => model.setMenu(true)} />
                </View>
              </View>
            )
          }
        >
          {model.detail.isPending && !item ? (
            <ActivityIndicator />
          ) : model.detail.isError ? (
            <>
              <Text style={s.error}>{c.loadFailed}</Text>
              <AppButton
                label={c.retry}
                onPress={() => {
                  void model.detail.refetch();
                }}
              />
            </>
          ) : (
            item && <SuggestionBody item={item} language={language} />
          )}
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}
export function SavedSuggestionsScreen({
  initialId,
  tryMealId,
}: {
  initialId?: string;
  tryMealId?: string;
}) {
  const profile = useProfile();
  const auth = useAuth();
  if (profile.status === 'loading' || auth.status === 'loading') return <View style={s.root} />;
  if (!profile.profile || !auth.session) return <Redirect href="/" />;
  return (
    <SavedContent
      key={`${auth.session.user.id}:${profile.profile.id}`}
      childId={profile.profile.id}
      initialId={initialId}
      tryMealId={tryMealId}
    />
  );
}
