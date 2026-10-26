// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { useOnboarding } from '../../onboarding/hooks/useOnboarding';
import type { OnboardingStep } from '../../onboarding/types';
import { useAccountSession } from '../hooks/useAccountSession';
import { familySummary, safeFoodSummary, safetySummary } from '../rules';
import { ChildProfileView } from './ChildProfileView';

export function ChildProfileScreen() {
  const appProfile = useProfile();
  const onboarding = useOnboarding();
  const account = useAccountSession();
  const profile = appProfile.profile;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [childName, setChildName] = useState(profile?.childName ?? '');
  const [ageRange, setAgeRange] = useState(profile?.ageRange ?? '');

  if (appProfile.status === 'loading' || !onboarding.ready) {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (appProfile.status === 'error' || !profile) return <Redirect href="/" />;

  const openOnboarding = (step: OnboardingStep) => {
    onboarding.startProfileEdit();
    router.push({ pathname: '/onboarding/[step]', params: { step, from: 'child-profile' } });
  };
  const saveBasics = async () => {
    if (saving || !childName.trim() || !ageRange) return;
    setSaving(true);
    setSaveError(false);
    try {
      await appProfile.commitProfile({
        ...profile,
        childName: childName.trim(),
        ageRange,
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <ChildProfileView
      language={appProfile.language}
      editing={editing}
      childName={editing ? childName : profile.childName}
      ageRange={editing ? ageRange : profile.ageRange}
      allergies={safetySummary(profile.allergies, profile.restrictions, appProfile.language)}
      familyFoods={familySummary(profile.familyFoods, appProfile.language)}
      safeFoods={safeFoodSummary(profile.safeFoods, profile.noSafeFoods, appProfile.language)}
      saving={saving}
      saveError={saveError}
      deleteError={account.deleteError}
      confirm={account.confirm}
      busy={account.busy}
      onBack={() => router.back()}
      onEdit={() => {
        setChildName(profile.childName);
        setAgeRange(profile.ageRange);
        setSaveError(false);
        setEditing(true);
      }}
      onSave={() => { void saveBasics(); }}
      onName={setChildName}
      onAge={setAgeRange}
      onAllergies={() => openOnboarding('allergies')}
      onFamily={() => openOnboarding('family')}
      onSafeFoods={() => openOnboarding('safe-foods')}
      onLogOut={account.onLogOut}
      onDelete={account.onDelete}
      onConfirm={account.onConfirm}
      onCancelConfirm={account.onCancelConfirm}
    />
  );
}
