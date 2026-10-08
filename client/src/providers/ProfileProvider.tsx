import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { readLanguage, saveLanguage } from '../data/storage/languageStorage';
import { readProfile, saveProfile } from '../data/storage/profileStorage';
import type { ChildProfile, Language } from '../types/profile';

type ProfileContextValue = {
  status: 'loading' | 'ready' | 'error';
  profile: ChildProfile | null;
  language: Language;
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

  useEffect(() => {
    let active = true;
    Promise.all([readProfile(), readLanguage()]).then(
      ([storedProfile, storedLanguage]) => {
        if (!active) return;
        setProfile(storedProfile);
        if (storedLanguage) setLanguage(storedLanguage);
        setStatus('ready');
      },
      () => { if (active) setStatus('error'); },
    );
    return () => { active = false; };
  }, []);

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
    <ProfileContext.Provider value={{ status, profile, language, commitProfile, changeLanguage }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('ProfileProvider is missing');
  return context;
}
