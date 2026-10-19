// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader, topBarLayout } from '../../../components/AppHeader';
import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useAfterMealPhoto } from '../hooks/useAfterMealPhoto';

export function AfterMealPhotoScreen({ mealId, side }: { mealId: string; side: 'before' | 'after' }) {
  const profile = useProfile();
  const photo = useAfterMealPhoto(profile.profile?.id ?? '', mealId, side);
  const s = copyFor(profile.language);
  if (profile.status === 'error' || (profile.status === 'ready' && !profile.profile)) return <Redirect href="/" />;
  return (
    <SafeAreaView style={styles.root}>
      <AppHeader title={side === 'before' ? s.mealLog.beforeImage : s.mealLog.afterImage} backLabel={s.common.back} onBack={() => router.back()} />
      <View style={styles.frame}>
        {profile.status === 'loading' || photo.loading ? <ActivityIndicator color={colors.homePrimary} />
          : photo.photo ? <Image source={{ uri: photo.photo.uri }} style={styles.image} contentFit="contain" />
            : <Text style={styles.error}>{s.afterMealReview.imageError}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  frame: { marginHorizontal: topBarLayout.inset, marginTop: topBarLayout.bodyGap, marginBottom: 16, flex: 1, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' },
  image: { flex: 1, width: '100%', height: '100%' },
  error: { color: colors.error, textAlign: 'center', fontSize: 12 },
});
