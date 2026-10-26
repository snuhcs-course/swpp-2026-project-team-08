// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
const { values, failNextWrite } = require('../helpers/native-boundaries.cjs').nativeBoundaries();
const { profileResponse } = require('../fixtures/account-profile.cjs');
const { AuthProvider, useAuth } = require('../../src/providers/AuthProvider.tsx');
const { ProfileProvider, useProfile } = require('../../src/providers/ProfileProvider.tsx');
const { QueryScopeBoundary } = require('../../src/providers/QueryScopeBoundary.tsx');
const { clearSession, readSession } = require('../../src/data/storage/authStorage.ts');
const { readLanguage } = require('../../src/data/storage/languageStorage.ts');

beforeEach(async () => { await clearSession(); values.clear(); });
function server(t, { onboarding = id => profileResponse(id), failUser = false } = {}) {
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/auth/login') {
      const id = JSON.parse(init.body).email.startsWith('second') ? '2' : '1';
      return new Response(JSON.stringify({ access_token: `access-${id}`, refresh_token: `refresh-${id}`, token_type: 'bearer' }));
    }
    const authorization = new Headers(init.headers).get('Authorization');
    assert.match(authorization, /^Bearer access-[12]$/);
    const id = authorization.endsWith('2') ? '2' : '1';
    if (path === '/api/v1/auth/me') return new Response(JSON.stringify(failUser ? { error_code: 'UNAVAILABLE' }
      : { id, email: `user${id}@example.com`, full_name: `Parent ${id}`, created_at: '2026-10-23T00:00:00Z' }), { status: failUser ? 503 : 200 });
    if (path === '/api/v1/onboarding') return new Response(JSON.stringify(await onboarding(id)));
    throw new Error(`Unexpected request: ${path}`);
  });
}
async function mount(t) {
  const harness = await renderHook(t, () => ({ auth: useAuth(), profile: useProfile() }), {
    wrapper: child => React.createElement(AuthProvider, null,
      React.createElement(ProfileProvider, null, React.createElement(QueryScopeBoundary), child)),
  });
  await waitFor(() => harness.current.auth.status === 'ready' && harness.current.profile.status === 'ready');
  return harness;
}
async function signIn(harness, email = 'first@example.com') {
  await act(async () => {
    assert.deepEqual(await harness.current.auth.signIn({ email, password: 'password' }), { ok: true });
  });
}

test('sign-in loads the authenticated profile and persists the confirmed session', async (t) => {
  server(t);
  const harness = await mount(t);
  assert.equal(harness.current.auth.session, null);
  await signIn(harness);
  await waitFor(() => harness.current.profile.status === 'ready');
  assert.equal(harness.current.profile.profile.childName, 'Child 1');
  assert.equal(harness.current.profile.profile.caregiverName, 'Parent 1');
  assert.deepEqual(harness.current.profile.profile.familyFoods, ['eggs']);
  assert.deepEqual(harness.current.profile.profile.consent,
    { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.equal((await readSession()).user.id, '1');
});

test('failed user lookup removes temporary tokens and leaves the user signed out', async (t) => {
  server(t, { failUser: true });
  const harness = await mount(t);
  await act(async () => {
    assert.deepEqual(await harness.current.auth.signIn({ email: 'first@example.com', password: 'password' }),
      { ok: false, error: 'unknown' });
  });
  assert.equal(harness.current.auth.session, null);
  assert.equal(await readSession(), null);
  assert.equal(values.has('nurturebites.auth.accessToken'), false);
});

test('switching accounts cancels the previous request and removes cached account data', async (t) => {
  server(t);
  const harness = await mount(t);
  await signIn(harness);
  await waitFor(() => harness.current.profile.profile?.id === '1');
  harness.client.setQueryData(['meal', '1', '10'], { owner: '1' });
  let aborted = false;
  const pending = harness.client.fetchQuery({ queryKey: ['pending', '1'], queryFn: ({ signal }) =>
    new Promise((resolve, reject) => { signal.addEventListener('abort', () => {
      aborted = true; reject(new Error('Cancelled'));
    }, { once: true }); }) }).catch(error => error);
  await signIn(harness, 'second@example.com');
  await waitFor(() => harness.current.profile.profile?.id === '2');
  await pending;
  assert.equal(aborted, true);
  assert.equal(harness.client.getQueryData(['meal', '1', '10']), undefined);
  assert.equal(harness.client.getQueryCache().getAll().length, 0);
  assert.equal((await readSession()).user.id, '2');
});

test('a delayed profile from the previous account cannot replace the current profile', async (t) => {
  const old = deferred();
  let requested = false;
  server(t, { onboarding: id => { if (id === '1') { requested = true; return old.promise; } return profileResponse(id); } });
  const harness = await mount(t);
  await signIn(harness);
  await waitFor(() => requested);
  assert.equal(harness.current.profile.status, 'loading');
  await signIn(harness, 'second@example.com');
  await waitFor(() => harness.current.profile.profile?.id === '2');
  await act(async () => { old.resolve(profileResponse('1')); });
  assert.equal(harness.current.profile.profile.id, '2');
  assert.equal(harness.current.profile.profile.childName, 'Child 2');
});

test('language save failure preserves the displayed language and a retry persists it', async (t) => {
  server(t);
  const harness = await mount(t);
  failNextWrite('nurturebites.language.v1');
  await act(async () => { await assert.rejects(harness.current.profile.changeLanguage('ko'), /Disk full/); });
  assert.equal(harness.current.profile.language, 'en');
  await act(async () => { await harness.current.profile.changeLanguage('ko'); });
  assert.equal(harness.current.profile.language, 'ko');
  assert.equal(await readLanguage(), 'ko');
});

test('sign-out clears tokens, profile, and cached account data', async (t) => {
  server(t);
  const harness = await mount(t);
  await signIn(harness);
  await waitFor(() => harness.current.profile.profile?.id === '1');
  harness.client.setQueryData(['home', '1'], { private: true });
  await act(async () => { await harness.current.auth.signOut(); });
  await waitFor(() => harness.current.profile.status === 'ready');
  assert.equal(harness.current.auth.session, null);
  assert.equal(harness.current.profile.profile, null);
  assert.equal(await readSession(), null);
  assert.equal(harness.client.getQueryCache().getAll().length, 0);
});
