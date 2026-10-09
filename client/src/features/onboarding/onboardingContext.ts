// This Code is generated with AI

import { createContext } from 'react';
import type { SafeFood } from '../../types/profile';
import type { OnboardingDraft, OnboardingStep } from './types';

export type SaveStatus = 'saving' | 'saved' | 'error';
export type DraftField = keyof Pick<OnboardingDraft, 'caregiverName' | 'caregiverEmail' | 'childName' | 'ageRange' | 'smell' | 'temperature' | 'familiarity'>;
export type ListField = keyof Pick<OnboardingDraft, 'allergies' | 'restrictions' | 'familyFoods' | 'approaches' | 'texture' | 'taste' | 'presentation'>;
export type ConsentField = keyof OnboardingDraft['consent'];

export type OnboardingContextValue = {
  ready: boolean;
  loadError: boolean;
  draft: OnboardingDraft;
  password: string;
  saveStatus: SaveStatus;
  editing: boolean;
  hasDraft: boolean;
  setPassword: (value: string) => void;
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

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);
