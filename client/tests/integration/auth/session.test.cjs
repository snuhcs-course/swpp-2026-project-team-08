// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 프로필 기대값을 채식 제한 필드로 변경
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 영어 시작 언어 및 사용자 언어 전환 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 인증·계정 전환 검증을 auth로 분리
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { server, mount, signIn, values } = require('../../helpers/account-session.cjs');
const { profileResponse } = require('../../fixtures/account-profile.cjs');
const { act, waitFor, deferred } = require('../../helpers/react-harness.cjs');

const { clearSession, readSession } = require('../../../src/data/storage/authStorage.ts');
beforeEach(async () => { await clearSession(); values.clear(); });

test('로그인에 성공하면 해당 계정의 자녀 프로필을 불러오고 인증 세션을 저장한다', async (t) => {
  server(t);
  const harness = await mount(t);
  assert.equal(harness.current.auth.session, null);
  await signIn(harness);
  await waitFor(() => harness.current.profile.status === 'ready');
  assert.equal(harness.current.profile.profile.childName, 'Child 1');
  assert.equal(harness.current.profile.profile.caregiverName, 'Parent 1');
  assert.deepEqual(harness.current.profile.profile.vegetarianRestrictions, ['EGGS']);
  assert.deepEqual(harness.current.profile.profile.consent,
    { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.equal((await readSession()).user.id, '1');
});

test('로그인 후 사용자 조회가 실패하면 임시 토큰을 지우고 로그아웃 상태를 유지한다', async (t) => {
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

test('다른 계정으로 로그인하면 이전 계정의 요청을 취소하고 캐시를 지운다', async (t) => {
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

test('이전 계정의 프로필 응답이 늦게 도착해도 현재 계정의 프로필을 유지한다', async (t) => {
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

test('로그아웃하면 토큰·자녀 프로필·계정 캐시가 삭제된다', async (t) => {
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
