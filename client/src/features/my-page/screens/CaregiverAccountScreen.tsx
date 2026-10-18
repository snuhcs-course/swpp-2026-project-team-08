// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { canSendEmailCode, localEmailCodeMatches } from '../rules';
import { CaregiverAccountView } from './CaregiverAccountView';

export function CaregiverAccountScreen() {
  const appProfile = useProfile();
  const profile = appProfile.profile;
  const [mode, setMode] = useState<'account' | 'change-email' | 'verify'>('account');
  const [name, setName] = useState(profile?.caregiverName ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [updated, setUpdated] = useState(false);

  if (appProfile.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (appProfile.status === 'error' || !profile) return <Redirect href="/" />;

  const saveName = async () => {
    const next = name.trim();
    if (!next || next === profile.caregiverName) return;
    await appProfile.commitProfile({ ...profile, caregiverName: next, updatedAt: new Date().toISOString() });
  };
  const sendCode = () => {
    if (!canSendEmailCode(profile.caregiverEmail, newEmail)) return;
    setCode('');
    setMismatch(false);
    setMode('verify');
  };
  const verify = async () => {
    if (code.length !== 6) return;
    if (!localEmailCodeMatches(code)) {
      setMismatch(true);
      return;
    }
    await appProfile.commitProfile({
      ...profile,
      caregiverName: name.trim() || profile.caregiverName,
      caregiverEmail: newEmail.trim(),
      updatedAt: new Date().toISOString(),
    });
    setUpdated(true);
    setMode('account');
    setCode('');
    setMismatch(false);
  };
  const goBack = () => {
    if (mode === 'verify') {
      setMode('change-email');
      return;
    }
    if (mode === 'change-email') {
      setMode('account');
      return;
    }
    void saveName().then(() => router.back());
  };

  return (
    <CaregiverAccountView
      language={appProfile.language}
      mode={mode}
      name={name}
      email={profile.caregiverEmail}
      newEmail={newEmail}
      code={code}
      mismatch={mismatch}
      updated={updated}
      canSend={canSendEmailCode(profile.caregiverEmail, newEmail)}
      canVerify={code.length === 6}
      onBack={goBack}
      onName={setName}
      onSaveName={() => { void saveName(); }}
      onChange={() => { setUpdated(false); setNewEmail(''); setMode('change-email'); }}
      onNewEmail={setNewEmail}
      onSend={sendCode}
      onCode={(value) => { setMismatch(false); setCode(value); }}
      onVerify={() => { void verify(); }}
      onResend={sendCode}
    />
  );
}
