// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { authFailure, confirmEmailChange, requestEmailChange, updateCurrentName } from '../../../data/api/authApi';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { canSendEmailCode } from '../rules';
import { CaregiverAccountView } from './CaregiverAccountView';

export function CaregiverAccountScreen() {
  const auth = useAuth();
  const appProfile = useProfile();
  const profile = appProfile.profile;
  const [mode, setMode] = useState<'account' | 'change-email' | 'verify'>('account');
  const [name, setName] = useState(profile?.caregiverName ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (appProfile.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (appProfile.status === 'error' || !profile) return <Redirect href="/" />;

  const copy = copyFor(appProfile.language);
  const saveName = async () => {
    const next = name.trim();
    if (!next || next === profile.caregiverName) return true;
    setBusy(true);
    setSaveError(false);
    try {
      const user = await updateCurrentName(next);
      await auth.replaceUser(user);
      return true;
    } catch {
      setSaveError(true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const sendCode = async () => {
    if (busy || !canSendEmailCode(profile.caregiverEmail, newEmail)) return;
    setBusy(true);
    setSendError(false);
    setMismatch(false);
    try {
      const issued = await requestEmailChange(newEmail.trim());
      setCode(issued ?? '');
      setMode('verify');
    } catch {
      setSendError(true);
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    if (busy || code.length !== 6) return;
    setBusy(true);
    setMismatch(false);
    try {
      const user = await confirmEmailChange(newEmail.trim(), code);
      await auth.replaceUser(user);
      setUpdated(true);
      setMode('account');
      setCode('');
    } catch (error) {
      setMismatch(authFailure(error) === 'invalid-email-code');
      if (authFailure(error) !== 'invalid-email-code') setSendError(true);
    } finally {
      setBusy(false);
    }
  };
  const goBack = async () => {
    if (mode === 'verify') {
      setMode('change-email');
      return;
    }
    if (mode === 'change-email') {
      setMode('account');
      return;
    }
    if (await saveName()) router.back();
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
      busy={busy}
      saveError={saveError}
      sendError={sendError}
      saveFailedLabel={copy.common.saveFailed}
      canSend={canSendEmailCode(profile.caregiverEmail, newEmail)}
      canVerify={code.length === 6}
      onBack={() => { void goBack(); }}
      onName={(value) => { setSaveError(false); setName(value); }}
      onSaveName={() => { void saveName(); }}
      onChange={() => { setUpdated(false); setSendError(false); setNewEmail(''); setMode('change-email'); }}
      onNewEmail={setNewEmail}
      onSend={() => { void sendCode(); }}
      onCode={(value) => { setMismatch(false); setCode(value); }}
      onVerify={() => { void verify(); }}
      onResend={() => { void sendCode(); }}
    />
  );
}
