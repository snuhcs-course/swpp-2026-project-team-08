// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader } from '../../../components/AppHeader';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { useProfile } from '../../../providers/ProfileProvider';
import { useAuth } from '../../../providers/AuthProvider';
import type { DismissReason } from '../../../types/suggestion';
import { suggestionCopyFor, copyFor } from '../../../util/strings';
import { RecommendationStateCard } from '../components/RecommendationStateCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { ChangeFoodsSheet } from '../components/ChangeFoodsSheet';
import { useRecommendationFlow } from '../hooks/useRecommendationFlow';
import { suggestionStyles as s } from './suggestionStyles';

function RecommendationContent({ childId, mealId }: { childId: string; mealId: string }) {
  const { language } = useProfile();
  const c = suggestionCopyFor(language);
  const model = useRecommendationFlow(childId, mealId);
  const [sheet, setSheet] = useState(false);
  const [reject, setReject] = useState(false);
  const [reasons, setReasons] = useState<DismissReason[]>([]);
  const batch = model.batch.data;
  const current = model.current;
  const backMeal = () => router.replace({ pathname: '/meal/[mealId]', params: { mealId } });
  const home = () => router.replace('/home');
  const back = () => {
    if (model.busy) return;
    if (sheet) {
      setSheet(false);
      return;
    }
    if (reject) {
      setReject(false);
      setReasons([]);
      return;
    }
    if (batch && !current && model.canUndo) {
      void model.undo();
      return;
    }
    backMeal();
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => listener.remove();
  });
  const missing = model.sourceUnavailable;
  if (missing) return <Redirect href="/home" />;
  const meal = model.source.data;
  const completed = !!batch && !current && !model.generating && !model.batch.isError;
  if (completed) return <SafeAreaView style={s.root} edges={['top', 'bottom']}>
    <View style={s.completed}>
      <View style={s.completionBadge}><UiAssetIcon name="suggestion-complete" /></View>
      <Text style={s.completionTitle}>{c.allDone}</Text>
      <Text style={s.completionBody}>{c.allDoneBody}</Text>
      <View style={s.completionActions}>
        <AppButton variant="suggestion" label={c.savedTitle} onPress={() => router.replace({ pathname: '/section/[name]', params: { name: 'ideas' } })} />
        <AppButton variant="suggestion" secondary label={c.backMeal} onPress={backMeal} />
      </View>
      {model.failed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
    </View>
    {model.canUndo && <Pressable accessibilityRole="button" accessibilityLabel={c.undoLast}
      disabled={model.busy} style={s.completionUndo} onPress={() => { void model.undo(); }}>
      <Text style={s.undoLabel}>{c.undoLast}</Text>
    </Pressable>}
  </SafeAreaView>;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <AppHeader title={c.title} backLabel={c.back} onBack={back} />
      <View style={s.recommendationContent}>
        {meal && (
          <View style={s.row}>
            <Text style={s.mealContextDate}>
              {new Date(`${meal.mealDate}T12:00:00`).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={s.link}>{copyFor(language).mealCheckin.types[meal.mealType]}</Text>
          </View>
        )}
        <View style={s.targetSection}>
          <View style={s.savedCardHeading}>
            <Text style={s.savedFoodName}>{c.targets}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.changeFoods}
              disabled={model.busy || !meal}
              style={s.changeFoodsAction}
              onPress={() => setSheet(true)}
            >
              <Text style={s.changeFoodsLabel}>{c.changeFoods}</Text>
              <UiAssetIcon name="suggestion-edit" />
            </Pressable>
          </View>
          <View style={s.wrap}>
          {(batch?.selected_food_ids ?? meal?.foods.slice(0, 3).map(food => food.id) ?? []).map((id) => (
            <View key={id} style={s.chip}>
              <Text style={s.ingredientLabel}>
                {meal?.foods.find((f) => f.id === id)?.name ??
                  batch?.items.find((i) => i.food_id === id)?.content.food_name}
              </Text>
            </View>
          ))}
          </View>
        </View>
        {model.generating || model.batch.isError || model.source.isError ? (
          <RecommendationStateCard language={language} failed={!model.generating} onRetry={() => {
            void model.batch.refetch(); void model.source.refetch();
          }} />
        ) : current ? (
          reject ? (
            <View style={s.cardStack}>
              <View style={[s.stackLayer, s.stackBack]} />
              <View style={[s.stackLayer, s.stackMiddle]} />
              <View style={[s.stackFace, s.dismissCard]}>
              <Text style={s.muted}>{current.content.food_name}</Text>
              <Text style={s.heading}>{c.dismissTitle}</Text>
              <ScrollView contentContainerStyle={s.reasonList}>
                {(Object.keys(c.reasons) as DismissReason[]).map((reason) => (
                  <Pressable
                    key={reason}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: reasons.includes(reason) }}
                    disabled={model.busy}
                    style={s.reasonChoice}
                    onPress={() =>
                      setReasons((old) =>
                        old.includes(reason) ? old.filter((r) => r !== reason) : [...old, reason],
                      )
                    }
                  >
                    <View style={[s.checkbox, reasons.includes(reason) && s.checkboxChecked]}>
                      {reasons.includes(reason) && <UiAssetIcon name="suggestion-checked" />}
                    </View>
                    <Text style={[s.text, s.grow]}>{c.reasons[reason]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={s.reasonActions}>
              <AppButton
                variant="suggestion"
                style={s.reasonButton}
                secondary
                disabled={model.busy}
                label={c.skipReason}
                onPress={() => {
                  void model.decide('dismissed').then((ok) => {
                    if (ok) {
                      setReject(false);
                      setReasons([]);
                    }
                  });
                }}
              />
              <AppButton
                variant="suggestion"
                style={s.reasonButton}
                disabled={model.busy || !reasons.length}
                label={c.done}
                onPress={() => {
                  void model.decide('dismissed', reasons).then((ok) => {
                    if (ok) {
                      setReject(false);
                      setReasons([]);
                    }
                  });
                }}
              />
              </View>
              </View>
            </View>
          ) : (
            <RecommendationCard
              key={current.id}
              item={current}
              language={language}
              index={(batch?.items.findIndex((i) => i.id === current.id) ?? 0) + 1}
              total={batch?.items.length ?? 1}
              disabled={model.busy}
              onSave={() => {
                void model.decide('saved');
              }}
              onDismiss={() => {
                setReject(true);
                setReasons([]);
              }}
            />
          )
        ) : <ActivityIndicator />}
      </View>
      {(current && !reject) && <View style={s.recommendationFooter}>
        {(current || model.notice || model.canUndo || model.failed) && (
          <View style={s.actionStatus}>
            <Text
              accessibilityRole={model.failed ? 'alert' : undefined}
              accessibilityLiveRegion="polite"
              style={[s.statusMessage, model.failed && s.error]}
            >
              {model.failed
                ? c.saveFailed
                : model.notice === 'saved'
                  ? c.savedNotice
                  : model.notice === 'dismissed'
                    ? c.dismissedNotice
                    : ''}
            </Text>
            {model.canUndo && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={c.undo}
                disabled={model.busy}
                style={[s.undoAction, model.busy && s.disabled]}
                onPress={() => {
                  void model.undo().then((ok) => {
                    if (ok) {
                      setReject(false);
                      setReasons([]);
                    }
                  });
                }}
              >
                <Text style={s.undoLabel}>{c.undo}</Text>
              </Pressable>
            )}
          </View>
        )}
        {current && !reject && !model.generating && (
          <View style={s.recommendationActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.dismiss}
              disabled={model.busy}
              style={[s.dismissAction, model.busy && s.disabled]}
              onPress={() => {
                setReject(true);
                setReasons([]);
              }}
            >
              <UiAssetIcon name="suggestion-dismiss" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.skip}
              disabled={model.busy}
              style={[s.skipAction, model.busy && s.disabled]}
              onPress={home}
            >
              <Text style={s.skipLabel}>{c.skip}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.save}
              disabled={model.busy}
              style={[s.saveAction, model.busy && s.disabled]}
              onPress={() => { void model.decide('saved'); }}
            >
              <UiAssetIcon name="suggestion-save" />
            </Pressable>
          </View>
        )}
      </View>}
      {sheet && meal && (
        <ChangeFoodsSheet
          current={batch?.selected_food_ids ?? []}
          foods={meal.foods}
          language={language}
          onClose={() => setSheet(false)}
          onUpdate={(ids) => {
            setSheet(false);
            setReject(false);
            setReasons([]);
            void model.selectFoods(ids);
          }}
        />
      )}
    </SafeAreaView>
  );
}
export function RecommendationScreen({ mealId }: { mealId: string }) {
  const profile = useProfile();
  const auth = useAuth();
  if (profile.status === 'loading' || auth.status === 'loading') return <View style={s.root} />;
  if (!profile.profile || !auth.session) return <Redirect href="/" />;
  return (
    <RecommendationContent
      key={`${auth.session.user.id}:${profile.profile.id}:${mealId}`}
      childId={profile.profile.id}
      mealId={mealId}
    />
  );
}
