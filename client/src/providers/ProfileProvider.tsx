// This Code is generated with AI

import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { readLanguage, saveLanguage } from '../data/storage/languageStorage';
import { readProfile, saveProfile } from '../data/storage/profileStorage';
import type { ChildProfile, Language } from '../types/profile';

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
  const [status, setStatus] = useState<ProfileContextValue['status']>('loading');
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [language, setLanguage] = useState<Language>(deviceLanguage);
  const languageQueue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(false);

  const load = useCallback(() => Promise.all([readProfile(), readLanguage()]).then(
    ([storedProfile, storedLanguage]) => {
      if (!mounted.current) return;
      setProfile(storedProfile);
      if (storedLanguage) setLanguage(storedLanguage);
      setStatus('ready');
    },
    () => { if (mounted.current) setStatus('error'); },
  ), []);
  const retryLoad = useCallback(() => {
    setStatus('loading');
    return load();
  }, [load]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);

  const commitProfile = useCallback(async (value: ChildProfile) => {
    await saveProfile(value);
    setProfile(value);
  }, []);
  const changeLanguage = useCallback((value: Language) => {
    const next = languageQueue.current.catch(() => undefined).then(() => saveLanguage(value));
    languageQueue.current = next;
    return next.then(() => setLanguage(value));
  }, []);

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
