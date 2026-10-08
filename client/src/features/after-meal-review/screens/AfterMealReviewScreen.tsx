import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { useMeal } from '../../../data/queries/mealQueries';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
export function AfterMealReviewScreen({ mealId }: { mealId?: string }) {
  const model = useProfile();
  const query = useMeal(model.profile?.id ?? '', mealId ?? '');
  const s = copyFor(model.language);
  if (model.status === 'error' || (model.status === 'ready' && !model.profile)) return <Redirect href="/" />;
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
      {model.status === 'loading' || (!!mealId && query.isPending) ? (
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
