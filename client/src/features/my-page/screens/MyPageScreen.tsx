// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { labelFor } from '../../../util/strings';
import { useOnboarding } from '../../onboarding/hooks/useOnboarding';
import { useAccountSession } from '../hooks/useAccountSession';
import { caregiverLine } from '../rules';
import { MyPageView } from './MyPageView';

export function MyPageScreen() {
  const appProfile = useProfile();
  const onboarding = useOnboarding();
  const account = useAccountSession();

  if (appProfile.status === 'loading' || !onboarding.ready) {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (appProfile.status === 'error' || onboarding.loadError || !appProfile.profile) {
    return <Redirect href="/" />;
  }

  const profile = appProfile.profile;
  return (
    <MyPageView
      language={appProfile.language}
      childName={profile.childName}
      ageLabel={labelFor('age', profile.ageRange, appProfile.language)}
      caregiver={caregiverLine(profile.caregiverName, profile.caregiverEmail)}
      deleteError={account.deleteError}
      confirm={account.confirm}
      busy={account.busy}
      onViewProfile={() => router.push('/child-profile')}
      onCaregiver={() => router.push('/caregiver-account')}
      onLogOut={account.onLogOut}
      onDelete={account.onDelete}
      onConfirm={account.onConfirm}
      onCancelConfirm={account.onCancelConfirm}
    />
  );
}
