// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { clearDraft, readDraft, saveDraft } from '../../data/storage/onboardingDraftStorage';
import { useAuth } from '../../providers/AuthProvider';
import { useProfile } from '../../providers/ProfileProvider';
import type { ChildProfile, SafeFood } from '../../types/profile';
import { addUnique, canAddSafeFood, canContinue, canFinish, isDraft, toggleExclusive, validEmail } from './rules';
import { emptyDraft, type OnboardingDraft, type OnboardingStep } from './types';
import { OnboardingContext, type ConsentField, type DraftField, type ListField, type SaveStatus } from './onboardingContext';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { status, profile, commitProfile } = useProfile();
  const auth = useAuth();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [password, setPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [editing, setEditing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef(0);
  const skipFirstSave = useRef(true);
  const finishing = useRef(false);

  useEffect(() => {
    if (status === 'loading' || ready) return;
    let active = true;
    readDraft()
      .then((storedDraft) => {
        if (!active) return;
        if (isDraft(storedDraft)) {
          setDraft(storedDraft);
          setHasDraft(true);
          if (profile) setEditing(true);
        }
        setReady(true);
      })
      .catch(() => { if (active) { setLoadError(true); setReady(true); } });
    return () => { active = false; };
  }, [status, profile, ready]);

  useEffect(() => {
    if (!ready || !auth.session || profile) return;
    setDraft((current) => {
      if (current.caregiverEmail.trim()) return current;
      return {
        ...current,
        caregiverName: auth.session?.user.fullName ?? current.caregiverName,
        caregiverEmail: auth.session?.user.email ?? current.caregiverEmail,
      };
    });
  }, [ready, auth.session, profile]);

  const persist = useCallback((value: OnboardingDraft) => {
    const version = ++saveVersion.current;
    setSaveStatus('saving');
    setHasDraft(true);
    saveChain.current = saveChain.current.catch(() => undefined).then(() => saveDraft(value));
    saveChain.current.then(
      () => { if (version === saveVersion.current) setSaveStatus('saved'); },
      () => { if (version === saveVersion.current) setSaveStatus('error'); },
    );
    return saveChain.current;
  }, []);

  useEffect(() => {
    if (!ready || loadError || status !== 'ready' || finishing.current) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    if (!profile || editing) void Promise.resolve().then(() => persist(draft));
  }, [draft, ready, loadError, status, profile, editing, persist]);

  const setField = useCallback((field: DraftField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);
  const setConsent = useCallback((field: ConsentField, value: boolean) => {
    setDraft((current) => ({ ...current, consent: { ...current.consent, [field]: value } }));
  }, []);
  const toggleList = useCallback((field: ListField, value: string) => {
    setDraft((current) => ({ ...current, [field]: toggleExclusive(current[field], value) }));
  }, []);
  const setList = useCallback((field: ListField, values: string[]) => {
    setDraft((current) => ({ ...current, [field]: values }));
  }, []);
  const addListItem = useCallback((field: ListField, value: string) => {
    setDraft((current) => ({ ...current, [field]: addUnique(current[field], value) }));
  }, []);
  const removeListItem = useCallback((field: ListField, value: string) => {
    setDraft((current) => ({ ...current, [field]: current[field].filter((item) => item !== value) }));
  }, []);
  const addSafeFood = useCallback((food: Omit<SafeFood, 'id'>) => {
    if (!canAddSafeFood(food)) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setDraft((current) => ({
      ...current,
      safeFoods: [...current.safeFoods, {
        id,
        name: food.name.trim(),
        preparation: food.preparation.trim(),
        presentationNote: food.presentationNote.trim(),
      }],
      noSafeFoods: false,
      safeFoodInput: { name: '', preparation: '', presentationNote: '' },
    }));
  }, []);
  const setSafeFoodInput = useCallback((field: keyof OnboardingDraft['safeFoodInput'], value: string) => {
    setDraft((current) => ({ ...current, safeFoodInput: { ...current.safeFoodInput, [field]: value } }));
  }, []);
  const removeSafeFood = useCallback((id: string) => {
    setDraft((current) => ({ ...current, safeFoods: current.safeFoods.filter((food) => food.id !== id) }));
  }, []);
  const setNoSafeFoods = useCallback((value: boolean) => {
    setDraft((current) => ({ ...current, noSafeFoods: value, safeFoods: value ? [] : current.safeFoods }));
  }, []);
  const setStep = useCallback((step: OnboardingStep) => {
    setDraft((current) => ({ ...current, step }));
  }, []);
  const draftFromProfile = useCallback((step: OnboardingStep): OnboardingDraft | null => {
    if (!profile) return null;
    const { id: _id, updatedAt: _updatedAt, ...values } = profile;
    return { ...values, step, safeFoodInput: { name: '', preparation: '', presentationNote: '' } };
  }, [profile]);
  const startEdit = useCallback(() => {
    if (editing) return;
    const next = draftFromProfile('review');
    if (!next) return;
    setDraft(next);
    setEditing(true);
  }, [editing, draftFromProfile]);
  const startProfileEdit = useCallback(() => {
    const next = draftFromProfile('review');
    if (!next) return;
    setDraft(next);
    setEditing(true);
  }, [draftFromProfile]);
  const cancelEdit = useCallback(async () => {
    saveVersion.current += 1;
    finishing.current = true;
    const next = draftFromProfile('review');
    if (next) setDraft(next);
    setEditing(false);
    setHasDraft(false);
    try { await clearDraft(); } finally { finishing.current = false; }
  }, [draftFromProfile]);
  const applyEdit = useCallback(async () => {
    if (finishing.current) return false;
    finishing.current = true;
    try {
      await persist(draft);
      await saveChain.current;
      const { step: _step, safeFoodInput: _safeFoodInput, ...values } = draft;
      const next: ChildProfile = {
        ...values,
        id: profile?.id ?? auth.session?.user.id ?? `child-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      await commitProfile(next);
      await clearDraft();
      setEditing(false);
      setHasDraft(false);
      return true;
    } catch {
      setSaveStatus('error');
      return false;
    } finally {
      finishing.current = false;
    }
  }, [draft, profile, persist, commitProfile, auth.session]);
  const resetLocal = useCallback(async () => {
    saveVersion.current += 1;
    finishing.current = true;
    setDraft(emptyDraft());
    setPassword('');
    setEditing(false);
    setHasDraft(false);
    try { await clearDraft(); } finally { finishing.current = false; }
  }, []);
  const retrySave = useCallback(() => persist(draft), [draft, persist]);
  const retryLoad = useCallback(() => {
    skipFirstSave.current = true;
    setLoadError(false);
    setReady(false);
  }, []);
  const finish = useCallback(async () => {
    if (finishing.current || !canFinish(draft)) return false;
    finishing.current = true;
    try {
      await persist(draft);
      await saveChain.current;
      const { step: _step, safeFoodInput: _safeFoodInput, ...values } = draft;
      const next: ChildProfile = {
        ...values,
        id: profile?.id ?? auth.session?.user.id ?? `child-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      await commitProfile(next);
      await clearDraft();
      setEditing(false);
      setHasDraft(false);
      return true;
    } catch {
      setSaveStatus('error');
      return false;
    } finally {
      finishing.current = false;
    }
  }, [draft, profile, persist, commitProfile, auth.session]);

  return <OnboardingContext.Provider value={{
    ready: ready && status !== 'loading', loadError: loadError || status === 'error',
    draft, password, saveStatus, editing, hasDraft,
    setPassword, setField, setConsent, toggleList, setList, addListItem,
    removeListItem, addSafeFood, setSafeFoodInput, removeSafeFood, setNoSafeFoods, setStep,
    startEdit, startProfileEdit, cancelEdit, applyEdit, resetLocal,
    retrySave, retryLoad, finish, canContinue: (step) => step === 'review' ? canFinish(draft)
      : step === 'account' && (editing || !!auth.session) ? !!draft.caregiverName.trim() && validEmail(draft.caregiverEmail)
        : canContinue(step, draft, password),
  }}>{children}</OnboardingContext.Provider>;
}
