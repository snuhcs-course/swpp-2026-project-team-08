// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 인증·언어 설정 Integration의 Provider·서버 준비 공유
const assert = require('node:assert/strict');
require('./register.cjs');
const { React, act, renderHook, waitFor } = require('./react-harness.cjs');
const { values, failNextWrite } = require('./native-boundaries.cjs').nativeBoundaries();
const { profileResponse } = require('../fixtures/account-profile.cjs');
const { AuthProvider, useAuth } = require('../../src/providers/AuthProvider.tsx');
const { ProfileProvider, useProfile } = require('../../src/providers/ProfileProvider.tsx');
const { QueryScopeBoundary } = require('../../src/providers/QueryScopeBoundary.tsx');
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

module.exports = { server, mount, signIn, values, failNextWrite };
