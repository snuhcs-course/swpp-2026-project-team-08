// AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

export function onboardingRouteParams(step: string, from?: string): { step: string; from?: string } {
  if (!from || step === 'review') return { step };
  return { step, from };
}
