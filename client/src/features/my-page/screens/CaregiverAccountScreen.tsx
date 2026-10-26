// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung

import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../../util/colors';
import { useCaregiverAccount } from '../hooks/useCaregiverAccount';
import { CaregiverAccountView } from './CaregiverAccountView';

export function CaregiverAccountScreen() {
  const account = useCaregiverAccount();
  if (account.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (account.status === 'error' || !account.hasProfile) return <Redirect href="/" />;

  const goBack = async () => {
    if (await account.prepareBack()) router.back();
  };

  return <CaregiverAccountView {...account.viewProps} onBack={() => { void goBack(); }} />;
}
