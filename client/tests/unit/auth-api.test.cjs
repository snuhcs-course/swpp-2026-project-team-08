// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
require('../helpers/native-boundaries.cjs').nativeBoundaries();
const network = require('../../src/data/network/apiClient.ts');
const api = require('../../src/data/api/authApi.ts');
const user = { id: '1', email: 'parent@example.com', full_name: 'Parent' };
const mappedUser = { id: '1', email: user.email, fullName: 'Parent' };
const input = { email: user.email, password: 'password', fullName: 'Parent' };
const operations = [
  ['signup', () => api.signUpAccount(input), '/api/v1/auth/signup', 'POST',
    { email: input.email, password: input.password, full_name: input.fullName }, user, mappedUser],
  ['login', () => api.loginAccount(input), '/api/v1/auth/login', 'POST',
    { email: input.email, password: input.password }, { access_token: 'access', refresh_token: 'refresh' },
    { accessToken: 'access', refreshToken: 'refresh' }],
  ['read user', () => api.readCurrentUser(), '/api/v1/auth/me', 'GET', undefined, user, mappedUser],
  ['rename user', () => api.updateCurrentName('Parent'), '/api/v1/auth/me', 'PATCH', { full_name: 'Parent' }, user, mappedUser],
  ['request email change', () => api.requestEmailChange('new@example.com'), '/api/v1/auth/email-change', 'POST',
    { email: 'new@example.com' }, { dev_code: '482190' }, '482190'],
  ['confirm email change', () => api.confirmEmailChange(user.email, '482190'), '/api/v1/auth/email-change/confirm', 'POST',
    { email: user.email, code: '482190' }, user, mappedUser],
  ['delete account', () => api.deleteAccount(), '/api/v1/auth/me', 'DELETE', undefined, undefined, undefined],
];
for (const [name, invoke, path, method, body, response, expected] of operations) {
  test(`${name} sends the documented request and maps the response`, async (t) => {
    t.mock.method(network, 'apiRequest', async (actualPath, init = {}) => {
      assert.equal(actualPath, path);
      assert.equal(init.method ?? 'GET', method);
      assert.deepEqual(init.body ? JSON.parse(init.body) : undefined, body);
      return response;
    });
    assert.deepEqual(await invoke(), expected);
  });
  test(`${name} propagates request failures`, async (t) => {
    const failure = new network.ApiError(503, 'UNAVAILABLE');
    t.mock.method(network, 'apiRequest', async () => { throw failure; });
    await assert.rejects(invoke(), error => error === failure);
  });
}
for (const [name, invoke] of operations.filter(([name]) => ['signup', 'login', 'read user'].includes(name))) {
  test(`${name} rejects malformed server responses`, async (t) => {
    let response;
    t.mock.method(network, 'apiRequest', async () => response);
    for (response of [null, [], {}, { ...user, id: 'not-an-id' }, { access_token: 'access', refresh_token: 1 }]) {
      await assert.rejects(invoke(), /Invalid .* response/);
    }
  });
}
