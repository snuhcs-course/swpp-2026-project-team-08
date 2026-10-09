// This Code is generated with AI

import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
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
      <AppButton variant="meal" secondary label={s.common.back} onPress={() => router.back()} />
      <View style={styles.frame}>
        {profile.status === 'loading' || photo.loading ? <ActivityIndicator color={colors.homePrimary} />
          : photo.photo ? <Image source={{ uri: photo.photo.uri }} style={styles.image} contentFit="contain" />
            : <Text style={styles.error}>{s.afterMealReview.imageError}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.homeBackground },
  frame: { flex: 1, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' },
  image: { flex: 1, width: '100%', height: '100%' },
  error: { color: colors.error, textAlign: 'center', fontSize: 12 },
});
