// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 편집 후 로그아웃·재가입과 늦은 초안 저장의 계정 간 분리 검증
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 정상 온보딩 준비 데이터에 음식 없음 응답 반영
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 로그아웃·재가입 흐름을 auth 폴더로 이동
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const navigations = [];
const uiNames = ['AccountStepView', 'ChoiceStepView', 'ConsentStepView', 'SafeFoodsStepView',
  'ReviewStepView', 'OnboardingFlowView', 'OnboardingReadyView'];
const { values, storage } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name === 'expo-router') return { router: {
    replace: route => navigations.push(route), back: () => {},
  } };
  if (name === 'react-native') return { View: 'div', StyleSheet: { create: value => value } };
  if (name.endsWith('/FontReadyContext')) return { useFontReady: () => true };
  const ui = uiNames.find(component => name === `./${component}`);
  if (ui) return { [ui]: () => null };
});
const { AuthProvider, useAuth } = require('../../../src/providers/AuthProvider.tsx');
const { ProfileProvider, useProfile } = require('../../../src/providers/ProfileProvider.tsx');
const { OnboardingProvider } = require('../../../src/features/onboarding/OnboardingProvider.tsx');
const { useOnboarding } = require('../../../src/features/onboarding/hooks/useOnboarding.ts');
const { useAccountSession } = require('../../../src/features/my-page/hooks/useAccountSession.ts');
const { OnboardingScreen } = require('../../../src/features/onboarding/screens/OnboardingScreen.tsx');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { clearSession, saveSession, readSession } = require('../../../src/data/storage/authStorage.ts');
const { readDraft, saveDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
const { profileResponse } = require('../../fixtures/account-profile.cjs');
beforeEach(async () => { await clearSession(); values.clear(); navigations.length = 0; });
async function mount(t, { restoredEdit = false, failFirstWrite = false } = {}) {
  const signups = [], writes = [];
  const oldProfile = profileResponse('1');
  let newProfile = null;
  await saveSession({ accessToken: 'old-access', refreshToken: 'old-refresh',
    user: { id: '1', email: 'old@example.com', fullName: 'Old parent' } });
  if (restoredEdit) await saveDraft({ ...emptyDraft(), childName: 'Old restored draft' });
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    const bearer = new Headers(init.headers).get('Authorization');
    const user = { id: '2', email: 'new@example.com', full_name: 'New parent' };
    if (path === '/api/v1/auth/signup') {
      assert.equal(bearer, null);
      signups.push(JSON.parse(init.body));
      return Response.json(user, { status: 201 });
    }
    if (path === '/api/v1/auth/login') return Response.json({
      access_token: 'new-access', refresh_token: 'new-refresh',
    });
    if (path === '/api/v1/auth/me') {
      assert.equal(bearer, 'Bearer new-access');
      return Response.json(user);
    }
    assert.equal(path, '/api/v1/onboarding');
    if (init.method === 'PUT') {
      assert.equal(bearer, 'Bearer new-access');
      const body = JSON.parse(init.body);
      writes.push(body);
      if (failFirstWrite && writes.length === 1) {
        return Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
      }
      newProfile = profileResponse('2');
      newProfile.profile = { ...newProfile.profile, ...body.profile };
      newProfile.consents = newProfile.consents.map(row => ({ ...row,
        granted: body.consents.find(item => item.kind === row.kind).granted,
      }));
      return Response.json(newProfile);
    }
    assert.ok(['Bearer old-access', 'Bearer new-access'].includes(bearer));
    return Response.json(bearer === 'Bearer old-access' ? oldProfile
      : newProfile ?? { profile: null, consents: [] });
  });
  let route = null, screen;
  function ScreenProbe() { screen = OnboardingScreen(route); return null; }
  const hook = await renderHook(t, () => ({ auth: useAuth(), profile: useProfile(),
    onboarding: useOnboarding(), account: useAccountSession() }), {
    wrapper: child => React.createElement(AuthProvider, null,
      React.createElement(ProfileProvider, null, React.createElement(OnboardingProvider, null,
        child, route && React.createElement(ScreenProbe)))),
  });
  await waitFor(() => hook.current.onboarding.ready && hook.current.profile.profile?.id === '1');
  return { hook, signups, writes, oldProfile, get screen() { return screen; },
    async route(next) { route = next; screen = null; await hook.rerender(); },
  };
}
async function confirmLogout(hook) {
  await act(async () => hook.current.account.onLogOut());
  await act(async () => hook.current.account.onConfirm());
  await waitFor(() => !hook.current.account.busy && hook.current.auth.session === null
    && hook.current.profile.status === 'ready');
}

for (const priorState of ['abandoned edit', 'restored edit', 'no edit', 'save failure with retry']) {
  test(`${{ 'abandoned edit': '편집 중 이탈', 'restored edit': '편집 초안 복원', 'no edit': '편집 없음', 'save failure with retry': '재가입 후 저장 실패·재시도' }[priorState]} 상태에서 로그아웃하고 재가입하면 새 계정의 프로필만 저장된다`, async t => {
    const retry = priorState === 'save failure with retry';
    const app = await mount(t, { restoredEdit: priorState === 'restored edit', failFirstWrite: retry });
    const { hook } = app;
    if (priorState === 'abandoned edit') {
      await act(async () => hook.current.onboarding.startProfileEdit());
      await app.route({ routeStep: 'allergies', from: 'child-profile' });
      await act(async () => hook.current.onboarding.toggleList('allergies', 'PEANUTS'));
      // Simulate native Back removing the route, without pressing the screen's Previous button.
      await app.route(null);
    }
    if (priorState.includes('edit') && priorState !== 'no edit') assert.equal(hook.current.onboarding.editing, true);
    await confirmLogout(hook);
    assert.equal(hook.current.onboarding.editing, false);
    assert.deepEqual(hook.current.onboarding.draft, emptyDraft());
    assert.equal(hook.current.onboarding.password, '');
    assert.equal(hook.current.onboarding.hasDraft, false);
    assert.equal(await readDraft(), null);
    assert.equal(await readSession(), null);

    await app.route({ routeStep: 'account' });
    assert.equal(app.screen.props.content.props.editing, false); // Password field is visible.
    assert.equal(app.screen.props.canContinue, false);
    await act(async () => {
      const account = app.screen.props.content.props;
      account.onNameChange('New parent');
      account.onEmailChange('new@example.com');
    });
    assert.equal(app.screen.props.canContinue, false);
    await act(async () => app.screen.props.onContinue());
    assert.equal(app.signups.length, 0);
    await act(async () => app.screen.props.content.props.onPasswordChange('new-password'));
    await act(async () => app.screen.props.onContinue());
    await waitFor(() => hook.current.auth.session?.user.id === '2' && hook.current.onboarding.ready);
    assert.deepEqual(app.signups, [{ email: 'new@example.com', password: 'new-password', full_name: 'New parent' }]);
    assert.equal(navigations.at(-1).params.step, 'consent');
    assert.equal(hook.current.onboarding.draft.caregiverEmail, 'new@example.com');
    await act(async () => {
      hook.current.onboarding.setConsent('accountPrivacy', true);
      hook.current.onboarding.setConsent('photoAnalysis', true);
      hook.current.onboarding.setField('childName', 'New child');
      hook.current.onboarding.setField('ageRange', 'AGE_6_8');
      hook.current.onboarding.toggleList('allergies', 'MILK_DAIRY');
      hook.current.onboarding.toggleList('restrictions', 'GLUTEN_FREE');
      hook.current.onboarding.setField('dietaryPattern', 'flexitarian');
      hook.current.onboarding.setNoSafeFoods(true);
    });
    await app.route({ routeStep: 'review' });
    assert.equal(app.screen.props.canContinue, true);
    await act(async () => app.screen.props.onContinue());
    if (retry) {
      await waitFor(() => hook.current.onboarding.saveStatus === 'error');
      assert.equal(hook.current.profile.profile, null);
      assert.equal(hook.current.auth.session.user.id, '2');
      assert.equal((await readDraft()).childName, 'New child');
      assert.equal(app.signups.length, 1);
      await act(async () => app.screen.props.onContinue());
    }
    await waitFor(() => hook.current.profile.profile?.id === '2');
    assert.equal(app.writes.length, retry ? 2 : 1);
    if (retry) assert.deepEqual(app.writes[1], app.writes[0]);
    assert.deepEqual(app.writes[0].profile, { child_name: 'New child', age_group: 'AGE_6_8',
      restrictions: ['ALLERGY.MILK_DAIRY', 'DIETARY_APPROACH.GLUTEN_FREE'],
      dietary_pattern: 'FLEXITARIAN', safe_foods: null });
    assert.equal(hook.current.onboarding.saveStatus, 'saved');
    assert.equal(await readDraft(), null);
    assert.equal(app.oldProfile.profile.child_name, 'Child 1');
  });
}

test('로그아웃은 이전 초안의 저장이 끝난 뒤 초안과 인증 세션을 삭제한다', async t => {
  const { hook } = await mount(t);
  await act(async () => hook.current.onboarding.startProfileEdit());
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  const started = deferred(), release = deferred();
  const write = storage.setItem.bind(storage);
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === 'nurturebites.onboarding.v1') { started.resolve(); await release.promise; }
    return write(key, value);
  });
  await act(async () => hook.current.onboarding.setField('childName', 'Pending old child'));
  await started.promise;
  await act(async () => hook.current.account.onLogOut());
  await act(async () => hook.current.account.onConfirm());
  try {
    assert.equal(hook.current.account.busy, true);
    assert.equal((await readSession()).user.id, '1');
  } finally { await act(async () => release.resolve()); }
  await waitFor(() => !hook.current.account.busy && hook.current.auth.session === null);
  assert.equal(await readDraft(), null);
  assert.deepEqual(hook.current.onboarding.draft, emptyDraft());
});

test('로그아웃을 취소하면 현재 계정과 프로필 수정 초안을 유지한다', async t => {
  const { hook } = await mount(t);
  await act(async () => hook.current.onboarding.startProfileEdit());
  await act(async () => hook.current.onboarding.setField('childName', 'Keep this edit'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  await act(async () => hook.current.account.onLogOut());
  await act(async () => hook.current.account.onCancelConfirm());
  assert.equal(hook.current.account.confirm, null);
  assert.equal(hook.current.auth.session.user.id, '1');
  assert.equal(hook.current.onboarding.editing, true);
  assert.equal((await readDraft()).childName, 'Keep this edit');
});
