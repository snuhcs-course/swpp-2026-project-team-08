// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 계정 변경과 늦은 응답 Integration 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { loginInput } = require('../../fixtures/auth.cjs');
const { profileResponse } = require('../../fixtures/account-profile.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { AuthProvider, useAuth } = require('../../../src/providers/AuthProvider.tsx');
const { ProfileProvider, useProfile } = require('../../../src/providers/ProfileProvider.tsx');
const { clearSession } = require('../../../src/data/storage/authStorage.ts');

test('계정을 바꾼 뒤 이전 계정의 응답이 도착해도 현재 프로필을 유지한다', async (t) => {
  // 준비: deferred로 이전 응답의 도착 시점을 직접 제어한다.
  await clearSession();
  const previousResponse = deferred();
  let previousRequested = false;
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/auth/login') {
      assert.equal(options.method, 'POST');
      const id = JSON.parse(options.body).email === 'first@example.com' ? '1' : '2';
      return json({ access_token: `access-${id}`, refresh_token: `refresh-${id}` });
    }
    const token = new Headers(options.headers).get('Authorization');
    assert.match(token, /^Bearer access-[12]$/);
    const id = token.endsWith('1') ? '1' : '2';
    if (path === '/api/v1/auth/me') {
      return json({ id, email: `user${id}@example.com`, full_name: `Parent ${id}` });
    }
    if (path === '/api/v1/onboarding') {
      if (id === '1') {
        previousRequested = true;
        return json(await previousResponse.promise);
      }
      return json(profileResponse('2'));
    }
    throw new Error(`예상하지 않은 요청: ${path}`);
  });
  const hook = await renderHook(t, () => ({ auth: useAuth(), profile: useProfile() }), {
    wrapper: child => React.createElement(AuthProvider, null,
      React.createElement(ProfileProvider, null, child)),
  });
  await waitFor(() => hook.current.auth.status === 'ready');

  // 실행: 첫 계정 조회가 진행 중인 상태에서 두 번째 계정으로 로그인한다.
  await act(async () => {
    assert.deepEqual(await hook.current.auth.signIn(loginInput('first@example.com')), { ok: true });
  });
  await waitFor(() => previousRequested);
  assert.equal(hook.current.profile.status, 'loading');
  await act(async () => {
    assert.deepEqual(await hook.current.auth.signIn(loginInput('second@example.com')), { ok: true });
  });
  await waitFor(() => hook.current.profile.profile?.id === '2');
  await act(async () => { previousResponse.resolve(profileResponse('1')); });

  // 검증: 실제 Provider가 이전 응답을 무시했는지 확인한다.
  assert.equal(hook.current.auth.session.user.id, '2');
  assert.equal(hook.current.profile.profile.id, '2');
  assert.equal(hook.current.profile.profile.childName, 'Child 2');
});

function json(body) {
  return new Response(JSON.stringify(body));
}
