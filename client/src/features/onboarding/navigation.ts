// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim

export function onboardingRouteParams(step: string, from?: string): { step: string; from?: string } {
  if (!from || step === 'review') return { step };
  return { step, from };
}
