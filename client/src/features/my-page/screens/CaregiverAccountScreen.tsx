// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useCaregiverAccount } from '../hooks/useCaregiverAccount';
import { CaregiverAccountView } from './CaregiverAccountView';

export function CaregiverAccountScreen() {
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
}
