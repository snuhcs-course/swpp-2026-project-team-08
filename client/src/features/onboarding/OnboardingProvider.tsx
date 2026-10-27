// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { clearDraft, readDraft, saveDraft } from '../../data/storage/onboardingDraftStorage';
import { useAuth } from '../../providers/AuthProvider';
import { useProfile } from '../../providers/ProfileProvider';
import type { ChildProfile, SafeFood } from '../../types/profile';
import { createDraftSaveGate } from './draftSaveGate';
import { addUnique, canAddSafeFood, canContinue, canFinish, isDraft, toggleExclusive, validEmail } from './rules';
import { emptyDraft, type OnboardingDraft, type OnboardingStep } from './types';
import { OnboardingContext, type ConsentField, type DraftField, type ListField, type SaveStatus } from './onboardingContext';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { status, profile, commitProfile } = useProfile();
  const auth = useAuth();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [storedDraftState, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const draft = useMemo(() => ready && auth.session && !profile && !storedDraftState.caregiverEmail.trim()
    ? { ...storedDraftState, caregiverName: storedDraftState.caregiverName || auth.session.user.fullName,
        caregiverEmail: auth.session.user.email }
    : storedDraftState, [ready, auth.session, profile, storedDraftState]);
  const [password, setPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [editing, setEditing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const saveGate = useRef(createDraftSaveGate());
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

  const persist = useCallback((value: OnboardingDraft) => {
    setSaveStatus('saving');
    setHasDraft(true);
    const pending = saveGate.current.persist(() => saveDraft(value));
    pending.then(
      () => { if (!finishing.current) setSaveStatus('saved'); },
      () => { if (!finishing.current) setSaveStatus('error'); },
    );
    return pending;
  }, []);

  useEffect(() => {
    if (!ready || loadError || status !== 'ready' || finishing.current) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    if (!profile || editing) {
      // persist exposes failure through saveStatus; consume the background rejection.
      void Promise.resolve().then(() => persist(draft)).catch(() => undefined);
    }
  }, [draft, ready, loadError, status, profile, editing, persist]);

  const setField = useCallback((field: DraftField, value: string) => {
    setDraft((current) => ({
      ...current,
      ...(!current.caregiverEmail.trim() && auth.session ? {
        caregiverName: current.caregiverName || auth.session.user.fullName,
        caregiverEmail: auth.session.user.email,
      } : {}),
      [field]: value,
    }));
  }, [auth.session]);
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
    finishing.current = true;
    const next = draftFromProfile('review');
    if (next) setDraft(next);
    setEditing(false);
    setHasDraft(false);
    try { await saveGate.current.discard(clearDraft); } finally { finishing.current = false; }
  }, [draftFromProfile]);
  const applyEdit = useCallback(async () => {
    if (finishing.current) return false;
    finishing.current = true;
    try {
      await persist(draft);
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
    finishing.current = true;
    skipFirstSave.current = true;
    setDraft(emptyDraft());
    setPassword('');
    setEditing(false);
    setHasDraft(false);
    try { await saveGate.current.discard(clearDraft); } finally { finishing.current = false; }
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
