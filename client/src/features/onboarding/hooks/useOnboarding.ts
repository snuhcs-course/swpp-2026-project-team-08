// This Code is generated with AI

import { useContext } from 'react';
import { OnboardingContext } from '../onboardingContext';

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('OnboardingProvider is missing');
  return context;
}
