const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  filename,
);

let session = { accessToken: 'expired', refreshToken: 'refresh', user: { id: '1', email: 'a@example.com', fullName: 'A' } };
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'expo-constants') return { default: {} };
  if (name.endsWith('/storage/authStorage')) return {
    readSession: async () => session,
    saveSession: async (value) => { session = value; },
  };
  return originalLoad.call(this, name, ...args);
};
const { apiRequest } = require('../src/data/network/apiClient.ts');
Module._load = originalLoad;

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
