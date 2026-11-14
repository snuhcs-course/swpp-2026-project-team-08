// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Verify reset discards pending autosaves and current onboarding fixtures
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 요청 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 요청·응답 기준으로 수정
// Connects Auth/Profile/Onboarding providers, validation, API conversion and draft storage.
// Only HTTP and native storage boundaries are mocked.
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
const { beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('./register.cjs');
const { React, act, renderHook, waitFor, deferred } = require('./react-harness.cjs');
const { values, storage, failNextWrite } = require('./native-boundaries.cjs').nativeBoundaries();
const { AuthProvider } = require('../../src/providers/AuthProvider.tsx');
const { ProfileProvider, useProfile } = require('../../src/providers/ProfileProvider.tsx');
const { OnboardingProvider } = require('../../src/features/onboarding/OnboardingProvider.tsx');
const { useOnboarding } = require('../../src/features/onboarding/hooks/useOnboarding.ts');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');
const { saveDraft, readDraft } = require('../../src/data/storage/onboardingDraftStorage.ts');
const { saveSession, clearSession } = require('../../src/data/storage/authStorage.ts');
const { profileResponse } = require('../fixtures/account-profile.cjs');
beforeEach(async () => { await clearSession(); values.clear(); });
function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child 1', ageRange: 'AGE_4_5',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false }, allergies: ['none'], restrictions: ['none'],
    vegetarianRestrictions: ['EGGS'], step: 'review' };
}
async function mount(t, put = () => new Response(JSON.stringify(profileResponse()))) {
  await saveSession({ accessToken: 'access', refreshToken: 'refresh', user: { id: '1', email: 'parent@example.com', fullName: 'Parent' } });
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/onboarding');
    if (init.method === 'PUT') return put(JSON.parse(init.body));
    return new Response(JSON.stringify({ profile: null, consents: [] }));
  });
  const hook = await renderHook(t, () => ({ onboarding: useOnboarding(), profile: useProfile() }), {
    wrapper: child => React.createElement(AuthProvider, null, React.createElement(ProfileProvider, null,
      React.createElement(OnboardingProvider, null, child))),
  });
  await waitFor(() => hook.current.onboarding.ready);
  return hook;
}

module.exports = { act, waitFor, deferred, values, storage, failNextWrite, saveDraft, readDraft, profileResponse, completeDraft, mount };
