// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: MyPage 언어 전환 연결 및 미사용 언어 코드 정리

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
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
  const [languageError, setLanguageError] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);

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
      languageError={languageError}
      changingLanguage={changingLanguage}
      onLanguage={() => {
        if (changingLanguage) return;
        setChangingLanguage(true);
        void appProfile.changeLanguage(appProfile.language === 'en' ? 'ko' : 'en').then(
          () => setLanguageError(false), () => setLanguageError(true),
        ).finally(() => setChangingLanguage(false));
      }}
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
