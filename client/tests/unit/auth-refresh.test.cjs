// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

let session = { accessToken: 'expired', refreshToken: 'refresh', user: { id: '1', email: 'a@example.com', fullName: 'A' } };

const { mockModules } = require('../helpers/mock-modules.cjs');
const restoreMocks = mockModules((name) => {
  if (name === 'expo-constants') return { default: {} };
  if (name.endsWith('/storage/authStorage')) return {
    readSession: async () => session,
    saveSession: async (value) => { session = value; },
  };
  return undefined;
});

const { apiRequest } = require('../../src/data/network/apiClient.ts');

restoreMocks();

test('a 401 renews the session and retries the original request once', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, authorization: new Headers(init.headers).get('Authorization') });
    if (url.endsWith('/api/v1/auth/refresh')) {
      assert.deepEqual(JSON.parse(init.body), { refresh_token: 'refresh' });
      return new Response(JSON.stringify({ access_token: 'new-access', refresh_token: 'new-refresh' }), { status: 200 });
    }
    if (calls.length === 1) return new Response(JSON.stringify({ error_code: 'UNAUTHENTICATED' }), { status: 401 });
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  };
  try {
    assert.deepEqual(await apiRequest('/api/v1/suggestions'), { items: [] });
    assert.equal(calls.length, 3);
    assert.equal(calls[2].authorization, 'Bearer new-access');
    assert.equal(session.refreshToken, 'new-refresh');
  } finally {
    global.fetch = originalFetch;
  }
});


beforeEach(() => {
  session = { accessToken: 'expired', refreshToken: 'refresh', user: { id: '1', email: 'a@example.com', fullName: 'A' } };
});

for (const [name, refreshResponse] of [
  ['rejected refresh', () => new Response('{}', { status: 401 })],
  ['malformed tokens', () => new Response(JSON.stringify({ access_token: 'new' }))],
]) {
  test(`${name} preserves the old session and does not retry the request`, async (t) => {
    const before = structuredClone(session);
    const calls = [];
    t.mock.method(global, 'fetch', async url => {
      calls.push(url);
      return url.endsWith('/refresh') ? refreshResponse() : new Response('{}', { status: 401 });
    });
    await assert.rejects(apiRequest('/api/v1/meals'));
    assert.equal(calls.length, 2);
    assert.deepEqual(session, before);
  });
}

test('simultaneous unauthorized requests share one token refresh', async (t) => {
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const refreshing = new Promise(resolve => { started = resolve; });
  let refreshes = 0;
  t.mock.method(global, 'fetch', async (url, init) => {
    if (url.endsWith('/refresh')) {
      refreshes++; started(); await gate;
      return new Response(JSON.stringify({ access_token: 'new', refresh_token: 'next' }));
    }
    return new Headers(init.headers).get('Authorization') === 'Bearer new'
      ? new Response('{"ok":true}') : new Response('{}', { status: 401 });
  });
  const first = apiRequest('/api/v1/meals');
  const second = apiRequest('/api/v1/suggestions');
  await refreshing;
  release();
  assert.deepEqual(await Promise.all([first, second]), [{ ok: true }, { ok: true }]);
  assert.equal(refreshes, 1);
  assert.equal(session.refreshToken, 'next');
});

test('account change during refresh rejects stale tokens without replacing the new session', async (t) => {
  const other = { accessToken: 'other', refreshToken: 'other-refresh', user: { id: '2', email: 'b@example.com', fullName: 'B' } };
  t.mock.method(global, 'fetch', async url => {
    if (!url.endsWith('/refresh')) return new Response('{}', { status: 401 });
    session = other;
    return new Response(JSON.stringify({ access_token: 'stale', refresh_token: 'stale' }));
  });
  await assert.rejects(apiRequest('/api/v1/meals'), /UNAUTHENTICATED/);
  assert.deepEqual(session, other);
});

test('a second unauthorized response stops after one retry', async (t) => {
  let calls = 0;
  t.mock.method(global, 'fetch', async url => {
    calls++;
    return url.endsWith('/refresh')
      ? new Response(JSON.stringify({ access_token: 'new', refresh_token: 'next' }))
      : new Response('{"error_code":"UNAUTHENTICATED"}', { status: 401 });
  });
  await assert.rejects(apiRequest('/api/v1/meals'), /UNAUTHENTICATED/);
  assert.equal(calls, 3);
});

test('login failures never trigger session refresh', async (t) => {
  let calls = 0;
  t.mock.method(global, 'fetch', async url => {
    calls++;
    assert.ok(url.endsWith('/api/v1/auth/login'));
    return new Response('{"error_code":"INVALID_CREDENTIALS"}', { status: 401 });
  });
  await assert.rejects(apiRequest('/api/v1/auth/login', { method: 'POST' }), /INVALID_CREDENTIALS/);
  assert.equal(calls, 1);
});
