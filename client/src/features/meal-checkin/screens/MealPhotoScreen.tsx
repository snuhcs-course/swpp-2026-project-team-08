import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
export function MealPhotoScreen({ photoId }: { photoId: string }) {
  const model = useProfile();
  const query = useMealDraft(model.profile?.id ?? '');
  const s = copyFor(model.language);
  const photo = query.data?.photo?.id === photoId ? query.data.photo : null;
  if (model.status === 'error' || (model.status === 'ready' && !model.profile)) return <Redirect href="/" />;
  return (
    <SafeAreaView style={styles.root}>
      <AppButton
        variant="meal"
        secondary
        label={s.common.back}
        onPress={() => router.back()}
      />
      <View style={styles.frame}>
        {model.status === 'loading' || query.isPending ? (
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
    padding: 16,
    gap: 12,
    backgroundColor: colors.homeBackground,
  },
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
