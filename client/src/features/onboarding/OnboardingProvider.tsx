// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 온보딩 초안 복원, 계정 입력 초기화 및 초기화 후 자동 저장 수정
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { clearDraft, readDraft, saveDraft } from '../../data/storage/onboardingDraftStorage';
import { useAuth } from '../../providers/AuthProvider';
import { useProfile } from '../../providers/ProfileProvider';
import type { ChildProfile, SafeFood } from '../../types/profile';
import { createDraftSaveGate } from './draftSaveGate';
import { addUnique, canAddSafeFood, canContinue, canFinish, restoreDraft, toggleExclusive, validEmail } from './rules';
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
  const saveGate = useRef(createDraftSaveGate());
  const skipFirstSave = useRef(true);
  const clearedDraft = useRef<OnboardingDraft | null>(null);
  const finishing = useRef(false);
  const accountFieldsInitialized = useRef(false);

  useEffect(() => {
    if (status === 'loading' || ready) return;
    let active = true;
    readDraft()
      .then((storedDraft) => {
        if (!active) return;
        const restored = restoreDraft(storedDraft);
        if (restored) {
          accountFieldsInitialized.current = true;
          setDraft(restored);
          setHasDraft(true);
          if (profile) setEditing(true);
        } else if (auth.session && !profile) {
          accountFieldsInitialized.current = true;
          setDraft({
            ...emptyDraft(),
            caregiverName: auth.session.user.fullName,
            caregiverEmail: auth.session.user.email,
          });
        }
        setReady(true);
      })
      .catch(() => { if (active) { setLoadError(true); setReady(true); } });
    return () => { active = false; };
  }, [status, profile, ready, auth.session]);

  // A fresh draft can finish loading before the user signs in.
  useEffect(() => {
    if (!ready || loadError || status !== 'ready' || !auth.session || profile
      || accountFieldsInitialized.current) return;
    accountFieldsInitialized.current = true;
    const { user } = auth.session;
    setDraft((current) => ({
      ...current,
      caregiverName: user.fullName,
      caregiverEmail: user.email,
    }));
  }, [ready, loadError, status, auth.session, profile]);

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
    // Reset clears storage; only a subsequent edit should create another saved draft.
    if (draft === clearedDraft.current) return;
    if (!profile || editing) {
      // persist exposes failure through saveStatus; consume the background rejection.
      void Promise.resolve().then(() => persist(draft)).catch(() => undefined);
    }
  }, [draft, ready, loadError, status, profile, editing, persist]);

  const setField = useCallback((field: DraftField, value: string) => {
    if (field === 'caregiverName' || field === 'caregiverEmail') accountFieldsInitialized.current = true;
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
    accountFieldsInitialized.current = false;
    const next = emptyDraft();
    clearedDraft.current = next;
    setDraft(next);
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
