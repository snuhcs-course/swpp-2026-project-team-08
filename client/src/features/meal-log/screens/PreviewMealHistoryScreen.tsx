// AI-generated with Grok 4.6, 2026-10-19, reviewed by Doyeon Kim

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import type { ChildProfile } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { MealLogScreen } from './MealLogScreen';

const DEMO_PROFILE: ChildProfile = {
  id: 'demo-child',
  caregiverName: 'Alex',
  caregiverEmail: 'alex@example.com',
  childName: 'Jamie',
  ageRange: '4-5',
  consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
  allergies: [],
  restrictions: [],
  familyFoods: [],
  approaches: [],
  texture: [],
  smell: '',
  taste: [],
  presentation: [],
  temperature: '',
  familiarity: '',
  safeFoods: [],
  noSafeFoods: true,
  photoUri: null,
  updatedAt: '2026-10-19T00:00:00.000Z',
};

export function PreviewMealHistoryScreen() {
  const profile = useProfile();

  useEffect(() => {
    if (profile.status === 'ready' && !profile.profile) {
      void profile.commitProfile(DEMO_PROFILE);
    }
  }, [profile.status, profile.profile, profile.commitProfile]);

  if (profile.status === 'loading' || !profile.profile) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.homePrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <MealLogScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.homeBackground,
  },
});
