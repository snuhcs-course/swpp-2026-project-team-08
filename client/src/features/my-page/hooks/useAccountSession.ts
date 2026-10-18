// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim

import { router } from 'expo-router';
import { useState } from 'react';
import { deleteAccount } from '../../../data/api/authApi';
import { wipeAccountLocalData } from '../../../data/storage/accountWipe';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { useOnboarding } from '../../onboarding/hooks/useOnboarding';

export function useAccountSession() {
  const auth = useAuth();
  const appProfile = useProfile();
  const onboarding = useOnboarding();
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const runConfirm = async () => {
    if (busy || !confirm) return;
    if (confirm === 'logout') {
      setBusy(true);
      try {
        await auth.signOut();
        setConfirm(null);
        router.replace('/');
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    setDeleteError(false);
    try {
      await deleteAccount();
      await onboarding.resetLocal();
      await wipeAccountLocalData([appProfile.profile?.id, auth.session?.user.id]);
      await appProfile.wipeProfile();
      await auth.signOut();
      setConfirm(null);
      router.replace('/');
    } catch {
      setDeleteError(true);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return {
    confirm,
    busy,
    deleteError,
    onLogOut: () => setConfirm('logout'),
    onDelete: () => setConfirm('delete'),
    onConfirm: () => { void runConfirm(); },
    onCancelConfirm: () => { if (!busy) setConfirm(null); },
  };
}
