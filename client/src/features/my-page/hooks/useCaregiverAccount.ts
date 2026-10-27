// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung

import { useState } from 'react';
import { authFailure, confirmEmailChange, requestEmailChange, updateCurrentName } from '../../../data/api/authApi';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { canSendEmailCode } from '../rules';

export function useCaregiverAccount() {
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

  const saveName = async () => {
    if (!profile) return false;
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
    if (!profile || busy || !canSendEmailCode(profile.caregiverEmail, newEmail)) return;
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
    return saveName();
  };

  return {
    status: appProfile.status,
    language: appProfile.language,
    profile,
    mode, name, newEmail, code, mismatch, updated, busy, saveError, sendError,
    canSend: !!profile && canSendEmailCode(profile.caregiverEmail, newEmail),
    canVerify: code.length === 6,
    goBack, saveName, sendCode, verify,
    changeName: (value: string) => { setSaveError(false); setName(value); },
    startEmailChange: () => { setUpdated(false); setSendError(false); setNewEmail(''); setMode('change-email'); },
    setNewEmail,
    changeCode: (value: string) => { setMismatch(false); setCode(value); },
  };
}
