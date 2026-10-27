<<<<<<< HEAD
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
=======
// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung

import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../../util/colors';
>>>>>>> a902dcbc5a996c2df4f204d9955a76945e895f03
import { useCaregiverAccount } from '../hooks/useCaregiverAccount';
import { CaregiverAccountView } from './CaregiverAccountView';

export function CaregiverAccountScreen() {
<<<<<<< HEAD
  const model = useCaregiverAccount();
  if (model.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;

  return (
    <CaregiverAccountView
      language={model.language}
      mode={model.mode}
      name={model.name}
      email={model.profile.caregiverEmail}
      newEmail={model.newEmail}
      code={model.code}
      mismatch={model.mismatch}
      updated={model.updated}
      busy={model.busy}
      saveError={model.saveError}
      sendError={model.sendError}
      saveFailedLabel={copyFor(model.language).common.saveFailed}
      canSend={model.canSend}
      canVerify={model.canVerify}
      onBack={() => { void model.goBack().then((leave) => { if (leave) router.back(); }); }}
      onName={model.changeName}
      onSaveName={() => { void model.saveName(); }}
      onChange={model.startEmailChange}
      onNewEmail={model.setNewEmail}
      onSend={() => { void model.sendCode(); }}
      onCode={model.changeCode}
      onVerify={() => { void model.verify(); }}
      onResend={() => { void model.sendCode(); }}
    />
  );
=======
  const account = useCaregiverAccount();
  if (account.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (account.status === 'error' || !account.hasProfile) return <Redirect href="/" />;

  const goBack = async () => {
    if (await account.prepareBack()) router.back();
  };

  return <CaregiverAccountView {...account.viewProps} onBack={() => { void goBack(); }} />;
>>>>>>> a902dcbc5a996c2df4f204d9955a76945e895f03
}
