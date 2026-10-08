import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { colors } from '../util/colors';
import { copyFor } from '../util/strings';

export default function MealCheckinEntry() {
  const model = useOnboarding();
  if (!model.ready) return <SafeAreaView style={styles.root} />;
  if (!model.profile) return <Redirect href="/" />;
  const s = copyFor(model.language);
  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>← {s.common.back}</Text></Pressable>
    <View style={styles.content}><Text style={styles.title}>{s.home.logMeal}</Text><Text style={styles.description}>{s.home.mealUnavailable}</Text></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, backgroundColor: colors.homeBackground },
  back: { color: colors.homePrimary, fontSize: 14, fontWeight: '700' },
  content: { flex: 1, paddingTop: 30, gap: 12 },
  title: { color: colors.homeText, fontSize: 24, fontWeight: '800' },
  description: { color: colors.homeMuted, fontSize: 14, lineHeight: 21 },
});
