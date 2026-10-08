import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHomeRecords } from '../../data/queries/homeQueries';
import { useOnboarding } from '../../features/onboarding/hooks/useOnboarding';
import { visibleHomeData } from '../../features/home/rules';
import type { ChildProfile } from '../../types/profile';
import { colors } from '../../util/colors';
import { copyFor } from '../../util/strings';

function SuggestionContent({ profile, id }: { profile: ChildProfile; id: string }) {
  const model = useOnboarding();
  const query = useHomeRecords(profile.id);
  const s = copyFor(model.language);
  const item = query.data && visibleHomeData(query.data, profile).suggestions.find((suggestion) => suggestion.id === id);
  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>← {s.common.back}</Text></Pressable>
    {query.isPending && <ActivityIndicator color={colors.homePrimary} />}
    {query.isError && <Text style={styles.description}>{s.home.refreshFailed}</Text>}
    {query.isSuccess && !item && <Text style={styles.description}>{s.common.empty}</Text>}
    {!!item && <View style={styles.card}><Text style={styles.title}>{item.title}</Text><Text style={styles.description}>{item.description}</Text></View>}
  </SafeAreaView>;
}

export default function SuggestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const model = useOnboarding();
  if (!model.ready) return <SafeAreaView style={styles.root} />;
  if (!model.profile) return <Redirect href="/" />;
  return <SuggestionContent profile={model.profile} id={id} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, backgroundColor: colors.homeBackground, gap: 20 },
  back: { color: colors.homePrimary, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.homeBorder, padding: 20, gap: 12 },
  title: { color: colors.homeText, fontSize: 20, fontWeight: '800' },
  description: { color: colors.homeMuted, fontSize: 14, lineHeight: 21 },
});
