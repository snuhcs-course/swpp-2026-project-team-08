import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useAfterMealReview } from '../hooks/useAfterMealReview';
export function AfterMealReviewScreen({ mealId }: { mealId?: string }) {
  const model = useProfile();
  const review = useAfterMealReview(model.profile?.id ?? '', mealId ?? '');
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
      {model.status === 'loading' || (!!mealId && review.loading) ? (
        <ActivityIndicator color={colors.homePrimary} />
      ) : review.error ? (
        <>
          <Text style={{ color: colors.error }}>{s.home.refreshFailed}</Text>
          <AppButton
            label={s.common.retry}
            onPress={() => {
              void review.retry();
            }}
          />
        </>
      ) : review.meal ? (
        <>
          <Text style={{ color: colors.homeText }}>{review.meal.mealDate}</Text>
          <Text style={{ color: colors.homeText }}>
            {review.meal.foods.map((food) => food.name).join(', ')}
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
