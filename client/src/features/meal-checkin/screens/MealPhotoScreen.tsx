// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match full-photo back button to Figma 455:5343

import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
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
      <View style={styles.header}>
        <AppButton
          variant="meal"
          secondary
          label={s.common.back}
          icon={<Image source={require('../../../../assets/ui/meal-photo-back.svg')} style={styles.backIcon} contentFit="contain" />}
          style={styles.backButton}
          labelStyle={styles.backLabel}
          onPress={() => router.back()}
        />
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: colors.homeBackground,
  },
  header: { height: 56, paddingTop: 8, marginHorizontal: 8, justifyContent: 'center', alignItems: 'flex-start' },
  backButton: { minHeight: 38, height: 38, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.onboardingPrimary, backgroundColor: colors.photoBackSurface, shadowColor: colors.photoBackShadow, shadowOpacity: 0.07, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 2 },
  backLabel: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsSemiBold, lineHeight: 20 },
  backIcon: { width: 18, height: 18 },
  frame: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: { flex: 1, width: '100%', height: '100%' },
});
