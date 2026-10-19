// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader, topBarLayout } from '../../../components/AppHeader';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useMealPhoto } from '../hooks/useMealPhoto';
export function MealPhotoScreen({ photoId }: { photoId: string }) {
  const model = useProfile();
  const mealPhoto = useMealPhoto(model.profile?.id ?? '', photoId);
  const s = copyFor(model.language);
  const photo = mealPhoto.photo;
  if (model.status === 'error' || (model.status === 'ready' && !model.profile)) return <Redirect href="/" />;
  return (
    <SafeAreaView style={styles.root}>
      <AppHeader title={s.mealLog.beforeImage} backLabel={s.common.back} onBack={() => router.back()} />
      <View style={styles.frame}>
        {model.status === 'loading' || mealPhoto.loading ? (
          <ActivityIndicator color={colors.homePrimary} />
        ) : photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={styles.image}
            contentFit="contain"
          />
        ) : (
          <Text style={{ color: colors.error }}>
            {s.mealCheckin.imageError}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeBackground,
  },
  frame: {
    marginHorizontal: topBarLayout.inset, marginTop: topBarLayout.bodyGap, marginBottom: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: { flex: 1, width: '100%', height: '100%' },
});
