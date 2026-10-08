import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { useMeal } from '../data/queries/mealQueries';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { colors } from '../util/colors';
import { copyFor } from '../util/strings';
export default function AfterMealReviewEntry() {
  const model = useOnboarding();
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  const query = useMeal(model.profile?.id ?? '', mealId ?? '');
  const s = copyFor(model.language);
  if (model.ready && !model.profile) return <Redirect href="/" />;
  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 24,
        gap: 16,
        backgroundColor: colors.homeBackground,
      }}
    >
      <Text style={{ fontSize: 20, color: colors.homeText }}>
        {s.mealCheckin.afterMeal}
      </Text>
      {!model.ready || (!!mealId && query.isPending) ? (
        <ActivityIndicator color={colors.homePrimary} />
      ) : query.isError ? (
        <>
          <Text style={{ color: colors.error }}>{s.home.refreshFailed}</Text>
          <AppButton
            label={s.common.retry}
            onPress={() => {
              void query.refetch();
            }}
          />
        </>
      ) : query.data ? (
        <>
          <Text style={{ color: colors.homeText }}>{query.data.mealDate}</Text>
          <Text style={{ color: colors.homeText }}>
            {query.data.foods.map((food) => food.name).join(', ')}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.error }}>{s.mealCheckin.missingMeal}</Text>
      )}
      <AppButton
        variant="meal"
        secondary
        label={s.common.home}
        onPress={() => router.replace('/(main)/home')}
      />
    </SafeAreaView>
  );
}
