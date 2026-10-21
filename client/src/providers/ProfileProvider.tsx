// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung

import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fromOnboardingResponse, readOnboarding, writeOnboarding } from '../data/api/onboardingApi';
import { readLanguage, saveLanguage } from '../data/storage/languageStorage';
import { ApiError } from '../data/network/apiClient';
import type { ChildProfile, Language } from '../types/profile';
import { useAuth } from './AuthProvider';

type ProfileContextValue = {
  status: 'loading' | 'ready' | 'error';
  profile: ChildProfile | null;
  language: Language;
  retryLoad: () => Promise<void>;
  commitProfile: (value: ChildProfile) => Promise<void>;
  changeLanguage: (value: Language) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'ko' ? 'ko' : 'en';
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { signOut } = auth;
  const user = auth.session?.user ?? null;
  const userId = user?.id ?? null;
  const [loadedStatus, setLoadedStatus] = useState<ProfileContextValue['status']>('loading');
  const [storedProfile, setProfile] = useState<ChildProfile | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(deviceLanguage);
  const languageQueue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(false);
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    if (auth.status === 'loading') return;
    const sequence = ++loadSequence.current;
    setLoadedStatus('loading');
    try {
      const storedLanguage = await readLanguage();
      if (storedLanguage && mounted.current && sequence === loadSequence.current) setLanguage(storedLanguage);
      if (!user) {
        if (mounted.current && sequence === loadSequence.current) {
          setProfile(null);
          setLoadedUserId(null);
          setLoadedStatus('ready');
        }
        return;
      }
      const response = await readOnboarding();
      const next = fromOnboardingResponse(response, user);
      if (!mounted.current || sequence !== loadSequence.current) return;
      setProfile(next);
      setLoadedUserId(user.id);
      setLoadedStatus('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await signOut();
        return;
      }
      if (mounted.current && sequence === loadSequence.current) {
        setLoadedUserId(userId);
        setLoadedStatus('error');
      }
    }
  }, [auth.status, signOut, user, userId]);
  const retryLoad = useCallback(() => {
    return load();
  }, [load]);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    if (auth.status === 'ready') {
      void Promise.resolve().then(() => { if (active) void load(); });
    }
    return () => { active = false; mounted.current = false; loadSequence.current += 1; };
  }, [auth.status, load]);

  const commitProfile = useCallback(async (value: ChildProfile) => {
    if (!user) throw new Error('Auth session is missing');
    const response = await writeOnboarding(value);
    const next = fromOnboardingResponse(response, user);
    if (!next) throw new Error('Onboarding response has no profile');
    setProfile(next);
    setLoadedUserId(user.id);
    setLoadedStatus('ready');
  }, [user]);
  const changeLanguage = useCallback((value: Language) => {
    const next = languageQueue.current.catch(() => undefined).then(() => saveLanguage(value));
    languageQueue.current = next;
    return next.then(() => setLanguage(value));
  }, []);

  const status = auth.status === 'loading' || loadedUserId !== userId ? 'loading' : loadedStatus;
  const profile = loadedUserId === userId && storedProfile && user
    ? { ...storedProfile, caregiverName: user.fullName, caregiverEmail: user.email }
    : null;

  return (
    <ProfileContext.Provider value={{ status, profile, language, retryLoad, commitProfile, changeLanguage }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('ProfileProvider is missing');
  return context;
}
