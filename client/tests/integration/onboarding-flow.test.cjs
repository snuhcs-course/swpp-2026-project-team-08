// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Connects Auth/Profile/Onboarding providers, validation, API conversion and draft storage.
// Only HTTP and native storage boundaries are mocked.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
const { values, failNextWrite } = require('../helpers/native-boundaries.cjs').nativeBoundaries();
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
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child 1', ageRange: '4-5',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false }, allergies: ['none'], restrictions: ['none'],
    familyFoods: ['eggs'], approaches: ['none'], step: 'review' };
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

test('restored draft keeps its step and edits are persisted without storing the password', async t => {
  await saveDraft({ ...completeDraft(), step: 'child' });
  const hook = await mount(t);
  assert.equal(hook.current.onboarding.draft.step, 'child');
  await act(async () => { hook.current.onboarding.setField('childName', 'Edited'); hook.current.onboarding.setPassword('private-password'); });
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  const stored = await readDraft();
  assert.equal(stored.childName, 'Edited');
  assert.equal('password' in stored, false);
});

test('invalid draft cannot finish or send a profile write', async t => {
  let writes = 0;
  const hook = await mount(t, () => { writes++; throw new Error('Unexpected write'); });
  await act(async () => assert.equal(await hook.current.onboarding.finish(), false));
  assert.equal(writes, 0);
  assert.equal(hook.current.profile.profile, null);
});

for (const aiTraining of [false, true]) {
  test(`successful completion restores family foods and all consents (AI training: ${aiTraining})`, async t => {
    const draft = completeDraft();
    draft.consent.aiTraining = aiTraining;
    await saveDraft(draft);
    const hook = await mount(t, body => {
      assert.deepEqual(body.profile.food_preferences.family_foods, [{ code: 'eggs', custom_name: null }]);
      assert.deepEqual(body.consents, [
        { kind: 'account_privacy', granted: true },
        { kind: 'photo_analysis', granted: true },
        { kind: 'ai_training', granted: aiTraining },
      ]);
      return new Response(JSON.stringify(profileResponse('1', { aiTraining })));
    });
    await act(async () => assert.equal(await hook.current.onboarding.finish(), true));
    await waitFor(() => hook.current.profile.profile?.id === '1');
    assert.deepEqual(hook.current.profile.profile.familyFoods, ['eggs']);
    assert.deepEqual(hook.current.profile.profile.consent,
      { accountPrivacy: true, photoAnalysis: true, aiTraining });
    assert.equal(await readDraft(), null);
    assert.equal(hook.current.onboarding.hasDraft, false);
  });
}

test('failed completion preserves the draft and retry commits profile before clearing it', async t => {
  // Arrange: a complete stored draft and a failing HTTP boundary.
  await saveDraft(completeDraft());
  let fail = true;
  const hook = await mount(t, body => {
    assert.equal(body.profile.child_name, 'Child 1');
    assert.deepEqual(body.profile.food_preferences.family_foods, [{ code: 'eggs', custom_name: null }]);
    assert.deepEqual(body.consents, [
      { kind: 'account_privacy', granted: true },
      { kind: 'photo_analysis', granted: true },
      { kind: 'ai_training', granted: false },
    ]);
    return fail ? new Response('{}', { status: 503 }) : new Response(JSON.stringify(profileResponse()));
  });
  // Act/Assert: failure keeps recoverable data and does not publish a profile.
  await act(async () => assert.equal(await hook.current.onboarding.finish(), false));
  assert.equal(hook.current.onboarding.saveStatus, 'error');
  const retained = await readDraft();
  assert.equal(retained.childName, 'Child 1');
  assert.deepEqual(retained.familyFoods, ['eggs']);
  assert.deepEqual(retained.consent, { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.equal(hook.current.profile.profile, null);
  fail = false;
  await act(async () => assert.equal(await hook.current.onboarding.finish(), true));
  await waitFor(() => hook.current.profile.profile?.id === '1');
  assert.equal(hook.current.profile.profile.childName, 'Child 1');
  assert.deepEqual(hook.current.profile.profile.familyFoods, ['eggs']);
  assert.deepEqual(hook.current.profile.profile.consent,
    { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.equal(await readDraft(), null);
  assert.equal(hook.current.onboarding.hasDraft, false);
});

test('duplicate finish calls share the in-progress guard and submit only once', async t => {
  await saveDraft(completeDraft());
  const response = deferred();
  const started = deferred();
  let writes = 0;
  const hook = await mount(t, () => { writes++; started.resolve(); return response.promise; });
  let first;
  await act(async () => { first = hook.current.onboarding.finish(); await started.promise; });
  await act(async () => assert.equal(await hook.current.onboarding.finish(), false));
  await act(async () => { response.resolve(new Response(JSON.stringify(profileResponse()))); assert.equal(await first, true); });
  assert.equal(writes, 1);
  assert.equal(await readDraft(), null);
});

test('draft write failure is visible and retry saves the edited value', async t => {
  await saveDraft(completeDraft());
  const hook = await mount(t);
  failNextWrite('nurturebites.onboarding.v1');
  await act(async () => hook.current.onboarding.setField('childName', 'Retry child'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'error');
  assert.equal((await readDraft()).childName, 'Child 1');
  await act(async () => hook.current.onboarding.retrySave());
  assert.equal((await readDraft()).childName, 'Retry child');
});

test('corrupt stored draft reports load error and can be reloaded after storage recovery', async t => {
  values.set('nurturebites.onboarding.v1', '{invalid');
  const hook = await mount(t);
  assert.equal(hook.current.onboarding.loadError, true);
  assert.equal(values.get('nurturebites.onboarding.v1'), '{invalid');
  await saveDraft(completeDraft());
  await act(async () => hook.current.onboarding.retryLoad());
  await waitFor(() => hook.current.onboarding.ready && !hook.current.onboarding.loadError);
  assert.equal(hook.current.onboarding.draft.childName, 'Child 1');
  assert.equal(hook.current.onboarding.draft.step, 'review');
});

test('reset clears draft and password without committing a profile', async t => {
  await saveDraft(completeDraft());
  const hook = await mount(t);
  await act(async () => hook.current.onboarding.setPassword('private-password'));
  await act(async () => hook.current.onboarding.resetLocal());
  assert.equal(await readDraft(), null);
  assert.equal(hook.current.onboarding.password, '');
  assert.equal(hook.current.onboarding.hasDraft, false);
  assert.equal(hook.current.profile.profile, null);
  await act(async () => hook.current.onboarding.setField('childName', 'New child'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  assert.equal((await readDraft()).childName, 'New child');
});
