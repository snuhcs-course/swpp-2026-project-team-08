// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 온보딩 계정 전환과 초안 복원 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { React, act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values, failNextWrite } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { AuthProvider, useAuth } = require('../../../src/providers/AuthProvider.tsx');
const { ProfileProvider, useProfile } = require('../../../src/providers/ProfileProvider.tsx');
const { OnboardingProvider } = require('../../../src/features/onboarding/OnboardingProvider.tsx');
const { useOnboarding } = require('../../../src/features/onboarding/hooks/useOnboarding.ts');
const { saveSession, clearSession } = require('../../../src/data/storage/authStorage.ts');
const { saveDraft, readDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');

beforeEach(async () => { await clearSession(); values.clear(); });
const account = id => ({ accessToken: `access-${id}`, refreshToken: `refresh-${id}`,
  user: { id, email: `user${id}@example.com`, fullName: `Parent ${id}` } });
const savedDraft = { ...emptyDraft(), step: 'child', caregiverName: 'Parent 1',
  caregiverEmail: 'user1@example.com', childName: 'First child' };

async function setup(t) {
  await saveSession(account('1'));
  await saveDraft(savedDraft);
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/auth/login') {
      const id = JSON.parse(init.body).email.includes('user2') ? '2' : '1';
      return Response.json({ access_token: `access-${id}`, refresh_token: `refresh-${id}`, token_type: 'bearer' });
    }
    const id = new Headers(init.headers).get('Authorization')?.endsWith('2') ? '2' : '1';
    if (path === '/api/v1/auth/me') return Response.json({ id, email: `user${id}@example.com`,
      full_name: `Parent ${id}`, created_at: '2026-10-23T00:00:00Z' });
    if (path === '/api/v1/onboarding') return Response.json({ profile: null, consents: [] });
    throw new Error(`Unexpected request: ${path}`);
  });
  const hook = await renderHook(t, () => ({ auth: useAuth(), profile: useProfile(), onboarding: useOnboarding() }), {
    wrapper: child => React.createElement(AuthProvider, null, React.createElement(ProfileProvider, null,
      React.createElement(OnboardingProvider, null, child))),
  });
  await waitFor(() => hook.current.onboarding.ready && hook.current.auth.session?.user.id === '1');
  return hook;
}

test('switching accounts isolates the unfinished draft and restores it for its owner', async t => {
  const h = await setup(t);
  await act(async () => { await h.current.onboarding.archiveForAccountSwitch(); await h.current.auth.signOut(); });
  assert.equal(await readDraft(), null);
  assert.equal(h.current.onboarding.hasDraft, false);
  await act(async () => { assert.equal((await h.current.auth.signIn({ email: 'user2@example.com', password: 'password' })).ok, true);
    await h.current.onboarding.restoreAfterSignIn(); });
  await waitFor(() => h.current.profile.status === 'ready' && h.current.auth.session?.user.id === '2');
  assert.equal(h.current.onboarding.draft.childName, '');
  assert.equal(h.current.onboarding.draft.step, 'consent');
  await act(async () => { await h.current.onboarding.archiveForAccountSwitch(); await h.current.auth.signOut(); });
  await act(async () => { assert.equal((await h.current.auth.signIn({ email: 'user1@example.com', password: 'password' })).ok, true);
    await h.current.onboarding.restoreAfterSignIn(); });
  await waitFor(() => h.current.onboarding.hasDraft);
  assert.equal(h.current.onboarding.draft.childName, 'First child');
  assert.deepEqual(await readDraft(), savedDraft);
});

test('failed archive keeps the current session and draft', async t => {
  const h = await setup(t);
  failNextWrite('nurturebites.onboarding.v1.account.1');
  await act(async () => { await assert.rejects(h.current.onboarding.archiveForAccountSwitch()); });
  assert.equal(h.current.auth.session.user.id, '1');
  assert.deepEqual(h.current.onboarding.draft, savedDraft);
  assert.deepEqual(await readDraft(), savedDraft);
});
