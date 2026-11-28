// AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
// Changed: Safe Food 기능 제거
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 계정 전환 초안 보관 및 복원
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 온보딩
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필 저장 및 온보딩
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 온보딩 초안 복원, 계정 입력 초기화 및 초기화 후 자동 저장 수정; Dietary Pattern
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 직접 입력·안심 음식 없음 동작 제거

// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 프로필 저장·초안 초기화 성공 시 저장 상태 완료 처리
// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 없음 선택 중 입력 보존·제출 목록 분리 및 최신 초안 저장 상태 유지

// AI-generated with GPT-6, 2026-11-18, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 중복 추가 방지

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { archiveDraft, clearArchivedDraft, clearDraft, readArchivedDraft, readDraft, saveDraft } from '../../data/storage/onboardingDraftStorage';
import { readSession } from '../../data/storage/authStorage';
import { useAuth } from '../../providers/AuthProvider';
import { useProfile } from '../../providers/ProfileProvider';
import type { ChildProfile } from '../../types/profile';
import { isDietaryPattern } from '../../util/dietaryPattern';
import { createDraftSaveGate } from './draftSaveGate';
import { canContinue, canFinish, restoreDraft, toggleExclusive, validEmail } from './rules';
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
  const saveRequestId = useRef(0);
  const skipFirstSave = useRef(true);
  const clearedDraft = useRef<OnboardingDraft | null>(null);
  const finishing = useRef(false);
  const accountFieldsInitialized = useRef(false);

  useEffect(() => {
    if (status === 'loading' || ready) return;
    let active = true;
    (async () => {
      const current = await readDraft();
      if (current != null || !auth.session?.user.id) return current;
      const archived = await readArchivedDraft(auth.session.user.id);
      if (archived == null) return null;
      if (!restoreDraft(archived)) throw new Error('Archived draft is invalid');
      await saveDraft(archived);
      try { await clearArchivedDraft(auth.session.user.id); }
      catch (error) { await clearDraft(); throw error; }
      return archived;
    })()
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
      step: current.step === 'account' ? 'consent' : current.step,
      caregiverName: user.fullName,
      caregiverEmail: user.email,
    }));
  }, [ready, loadError, status, auth.session, profile]);

  const persist = useCallback((value: OnboardingDraft) => {
    const requestId = ++saveRequestId.current;
    setSaveStatus('saving');
    setHasDraft(true);
    const pending = saveGate.current.persist(() => saveDraft(value));
    // 이전 저장의 결과는 최신 요청의 저장 중·실패 표시를 덮어쓰지 않는다.
    pending.then(
      () => { if (!finishing.current && requestId === saveRequestId.current) setSaveStatus('saved'); },
      () => { if (!finishing.current && requestId === saveRequestId.current) setSaveStatus('error'); },
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
    if (field === 'dietaryPattern' && !isDietaryPattern(value)) return;
    if (field === 'caregiverName' || field === 'caregiverEmail') accountFieldsInitialized.current = true;
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);
  const setConsent = useCallback((field: ConsentField, value: boolean) => {
    setDraft((current) => ({ ...current, consent: { ...current.consent, [field]: value } }));
  }, []);
  const toggleList = useCallback((field: ListField, value: string) => {
    setDraft((current) => ({ ...current, [field]: toggleExclusive(current[field], value) }));
  }, []);
  const setSensory = useCallback((sensoryTextures: string[], sensoryNote: string) => {
    setDraft((current) => ({ ...current, sensoryTextures, sensoryNote }));
  }, []);
  const setRefusedFoodInput = useCallback((input: OnboardingDraft['refusedFoodInput']) => {
    setDraft((current) => ({ ...current, refusedFoodInput: input }));
  }, []);
  const addRefusedFood = useCallback(() => {
    setDraft((current) => {
      const name = current.refusedFoodInput.name.trim();
      if (!name || name.length > 200) return current;
      return { ...current, refusedFoods: [...(current.refusedFoods ?? []), {
        ...current.refusedFoodInput, name, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }], refusedFoodInput: { name: '', cookingMethod: null, reasons: [] } };
    });
  }, []);
  const removeRefusedFood = useCallback((id: string) => {
    setDraft((current) => ({ ...current, refusedFoods: (current.refusedFoods ?? []).filter((food) => food.id !== id) }));
  }, []);
  const setStep = useCallback((step: OnboardingStep) => {
    setDraft((current) => ({ ...current, step }));
  }, []);
  const draftFromProfile = useCallback((step: OnboardingStep): OnboardingDraft | null => {
    if (!profile) return null;
    const { id: _id, updatedAt: _updatedAt, ...values } = profile;
    return { ...values, step, refusedFoodInput: { name: '', cookingMethod: null, reasons: [] } };
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
      const { step: _step, refusedFoodInput: _refusedFoodInput, ...values } = draft;
      const next: ChildProfile = {
        ...values,
        id: profile?.id ?? auth.session?.user.id ?? `child-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      await commitProfile(next);
      await clearDraft();
      setEditing(false);
      setHasDraft(false);
      setSaveStatus('saved');
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
    try {
      await saveGate.current.discard(clearDraft);
      setSaveStatus('saved');
    } finally { finishing.current = false; }
  }, []);
  const archiveForAccountSwitch = useCallback(async () => {
    const userId = auth.session?.user.id;
    if (!userId || finishing.current) throw new Error('Account is unavailable');
    finishing.current = true;
    try {
      await saveGate.current.discard(async () => {
        await archiveDraft(userId, draft);
        await clearDraft();
      });
      const next = emptyDraft();
      clearedDraft.current = next;
      accountFieldsInitialized.current = false;
      setDraft(next);
      setPassword('');
      setEditing(false);
      setHasDraft(false);
      setSaveStatus('saved');
    } finally { finishing.current = false; }
  }, [auth.session, draft]);
  const restoreAfterSignIn = useCallback(async () => {
    const user = (await readSession())?.user;
    if (!user) throw new Error('Account is unavailable');
    const stored = await readArchivedDraft(user.id);
    if (stored == null) return;
    const restored = restoreDraft(stored);
    if (!restored) throw new Error('Archived draft is invalid');
    await saveDraft(restored);
    try { await clearArchivedDraft(user.id); }
    catch (error) { await clearDraft(); throw error; }
    clearedDraft.current = null;
    accountFieldsInitialized.current = true;
    setDraft(restored);
    setHasDraft(true);
    setSaveStatus('saved');
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
      const { step: _step, refusedFoodInput: _refusedFoodInput, ...values } = draft;
      const next: ChildProfile = {
        ...values,
        id: profile?.id ?? auth.session?.user.id ?? `child-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      await commitProfile(next);
      await clearDraft();
      setEditing(false);
      setHasDraft(false);
      setSaveStatus('saved');
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
    setPassword, setField, setConsent, toggleList,
    setSensory, setRefusedFoodInput, addRefusedFood, removeRefusedFood, setStep,
    startEdit, startProfileEdit, cancelEdit, applyEdit, resetLocal, archiveForAccountSwitch, restoreAfterSignIn,
    retrySave, retryLoad, finish, canContinue: (step) => (step === 'review' || step === 'sensory') ? canFinish(draft)
      : step === 'account' && (editing || !!auth.session) ? !!draft.caregiverName.trim() && validEmail(draft.caregiverEmail)
        : canContinue(step, draft, password),
  }}>{children}</OnboardingContext.Provider>;
}
