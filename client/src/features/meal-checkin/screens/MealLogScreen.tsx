// This Code is generated with AI

import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import { useMealLog } from '../hooks/useMealLog';

export function MealLogScreen() {
  const profile = useProfile();
  const log = useMealLog(profile.profile?.id ?? '');
  const s = copyFor(profile.language);
  if (profile.status === 'loading') return <View style={styles.root} />;
  if (profile.status === 'error' || !profile.profile) return <Redirect href="/" />;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{s.home.mealLog}</Text>
      {log.loading ? <ActivityIndicator color={colors.homePrimary} />
        : log.error ? <AppButton label={s.common.retry} onPress={() => { void log.retry(); }} />
          : log.meals.length ? [...log.meals].reverse().map((meal) => (
            <Pressable key={meal.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/after-meal-review', params: { mealId: meal.id } })} style={styles.card}>
              <Text style={styles.date}>{meal.mealDate}</Text>
              <Text style={styles.foods}>{meal.foods.map((food) => food.name).join(', ')}</Text>
              <Text style={styles.link}>{s.mealCheckin.afterMeal} →</Text>
            </Pressable>
          )) : <Text style={styles.empty}>{s.home.noMeals}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { padding: 24, gap: 12 },
  title: { color: colors.homeText, fontSize: 24, fontFamily: fonts.poppinsSemiBold },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderColor: colors.homeBorder, borderWidth: 1, padding: 16, gap: 7 },
  date: { color: colors.homeText, fontSize: 15, fontFamily: fonts.interBold },
  foods: { color: colors.homeMuted, fontSize: 11, fontFamily: fonts.interRegular },
  link: { color: colors.homePrimary, fontSize: 10, fontFamily: fonts.interBold },
  empty: { color: colors.homeMuted, fontSize: 12 },
});
