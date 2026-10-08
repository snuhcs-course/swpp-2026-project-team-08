import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { clearDraft, readDraft, saveDraft } from '../../../data/storage/onboardingDraftStorage';
import { useProfile } from '../../../providers/ProfileProvider';
import type { ChildProfile, Language, SafeFood } from '../../../types/profile';
import { addUnique, canAddSafeFood, canContinue, canFinish, isDraft, toggleExclusive, validEmail } from '../rules';
import { emptyDraft, steps, type OnboardingDraft, type OnboardingStep } from '../types';

type SaveStatus = 'saving' | 'saved' | 'error';
type DraftField = keyof Pick<OnboardingDraft, 'caregiverName' | 'caregiverEmail' | 'childName' | 'ageRange' | 'smell' | 'temperature' | 'familiarity'>;
type ListField = keyof Pick<OnboardingDraft, 'allergies' | 'restrictions' | 'familyFoods' | 'approaches' | 'texture' | 'taste' | 'presentation'>;
type ConsentField = keyof OnboardingDraft['consent'];

export type OnboardingContextValue = {
  ready: boolean;
  loadError: boolean;
  profile: ChildProfile | null;
  draft: OnboardingDraft;
  password: string;
  language: Language;
  saveStatus: SaveStatus;
  editing: boolean;
  hasDraft: boolean;
  setPassword: (value: string) => void;
  setLanguage: (value: Language) => void;
  setField: (field: DraftField, value: string) => void;
  setConsent: (field: ConsentField, value: boolean) => void;
  toggleList: (field: ListField, value: string) => void;
  setList: (field: ListField, values: string[]) => void;
  addListItem: (field: ListField, value: string) => void;
  removeListItem: (field: ListField, value: string) => void;
  addSafeFood: (food: Omit<SafeFood, 'id'>) => void;
  setSafeFoodInput: (field: keyof OnboardingDraft['safeFoodInput'], value: string) => void;
  removeSafeFood: (id: string) => void;
  setNoSafeFoods: (value: boolean) => void;
  setStep: (step: OnboardingStep) => void;
  startEdit: () => void;
  retrySave: () => Promise<void>;
  retryLoad: () => void;
  finish: () => Promise<boolean>;
  canContinue: (step: OnboardingStep) => boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { status, profile, language, commitProfile, changeLanguage } = useProfile();
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
  const startEdit = useCallback(() => {
    if (!profile) return;
    if (editing) return;
    const { id: _id, updatedAt: _updatedAt, ...values } = profile;
    setDraft({ ...values, step: 'review', safeFoodInput: { name: '', preparation: '', presentationNote: '' } });
    setEditing(true);
  }, [profile, editing]);
  const setLanguage = useCallback((value: Language) => {
    void changeLanguage(value).catch(() => setSaveStatus('error'));
  }, [changeLanguage]);
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
        id: profile?.id ?? `child-${Date.now()}`,
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
  }, [draft, profile, persist, commitProfile]);

  return <OnboardingContext.Provider value={{
    ready: ready && status !== 'loading', loadError: loadError || status === 'error',
    profile, draft, password, language, saveStatus, editing, hasDraft,
    setPassword, setLanguage, setField, setConsent, toggleList, setList, addListItem,
    removeListItem, addSafeFood, setSafeFoodInput, removeSafeFood, setNoSafeFoods, setStep,
    startEdit, retrySave, retryLoad, finish, canContinue: (step) => step === 'review' ? canFinish(draft)
      : step === 'account' && editing ? !!draft.caregiverName.trim() && validEmail(draft.caregiverEmail)
        : canContinue(step, draft, password),
  }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('OnboardingProvider is missing');
  return context;
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  return steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)];
}

export function previousStep(step: OnboardingStep): OnboardingStep {
  return steps[Math.max(steps.indexOf(step) - 1, 0)];
}
