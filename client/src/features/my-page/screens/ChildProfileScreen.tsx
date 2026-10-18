// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { PhotoError, pickMealPhoto } from '../../../data/device/mealPhotoPicker';
import { useProfile } from '../../../providers/ProfileProvider';
import type { PhotoSource } from '../../../types/meal';
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
  const [photoUri, setPhotoUri] = useState(profile?.photoUri ?? null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState<'permission' | 'image' | null>(null);

  if (appProfile.status === 'loading' || !onboarding.ready) {
    return <View style={{ flex: 1, backgroundColor: colors.homeBackground }} />;
  }
  if (appProfile.status === 'error' || !profile) return <Redirect href="/" />;

  const openOnboarding = (step: OnboardingStep) => {
    onboarding.startProfileEdit();
    router.push({ pathname: '/onboarding/[step]', params: { step, from: 'child-profile' } });
  };
  const saveBasics = async () => {
    if (saving || picking || !childName.trim() || !ageRange) return;
    setSaving(true);
    setSaveError(false);
    try {
      await appProfile.commitProfile({
        ...profile,
        childName: childName.trim(),
        ageRange,
        photoUri,
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };
  const pick = async (source: PhotoSource) => {
    setPicking(true);
    setPhotoError(null);
    try {
      const photo = await pickMealPhoto(source);
      if (photo) setPhotoUri(photo.uri);
      setPhotoOpen(false);
    } catch (error) {
      setPhotoError(error instanceof PhotoError ? error.code : 'image');
    } finally {
      setPicking(false);
    }
  };

  return (
    <ChildProfileView
      language={appProfile.language}
      editing={editing}
      childName={editing ? childName : profile.childName}
      ageRange={editing ? ageRange : profile.ageRange}
      photoUri={(editing ? photoUri : profile.photoUri) ?? null}
      allergies={safetySummary(profile.allergies, profile.restrictions, appProfile.language)}
      familyFoods={familySummary(profile.familyFoods, appProfile.language)}
      safeFoods={safeFoodSummary(profile.safeFoods, profile.noSafeFoods, appProfile.language)}
      picking={picking}
      saving={saving}
      saveError={saveError}
      photoError={photoError}
      photoOpen={photoOpen}
      deleteError={account.deleteError}
      confirm={account.confirm}
      busy={account.busy}
      onBack={() => router.back()}
      onEdit={() => {
        setChildName(profile.childName);
        setAgeRange(profile.ageRange);
        setPhotoUri(profile.photoUri ?? null);
        setSaveError(false);
        setEditing(true);
      }}
      onSave={() => { void saveBasics(); }}
      onName={setChildName}
      onAge={setAgeRange}
      onOpenPhoto={() => setPhotoOpen(true)}
      onClosePhoto={() => setPhotoOpen(false)}
      onPick={(source) => { void pick(source); }}
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
