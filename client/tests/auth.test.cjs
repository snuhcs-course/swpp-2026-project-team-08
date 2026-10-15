const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);

const values = new Map();
const storage = {
  async getItem(key) { return values.get(key) ?? null; },
  async setItem(key, value) { values.set(key, value); },
  async removeItem(key) { values.delete(key); },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '192.168.1.20:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return originalLoad.call(this, name, ...args);
};

const { readSession, saveSession, clearSession } = require('../src/data/storage/authStorage.ts');
const { authFailure } = require('../src/data/api/authApi.ts');
const { ApiError, apiBaseUrl } = require('../src/data/network/apiClient.ts');

test('auth session round-trips and clears on sign out', async () => {
  values.clear();
  await clearSession();
  const session = {
    accessToken: 'access', refreshToken: 'refresh',
    user: { id: 'user-1', email: 'parent@example.com', fullName: 'Parent' },
  };
  await saveSession(session);
  assert.deepEqual(await readSession(), session);
  await clearSession();
  assert.equal(await readSession(), null);
});

test('auth failures map server codes and network errors', () => {
  assert.equal(authFailure(new ApiError(401, 'INVALID_CREDENTIALS')), 'invalid-credentials');
  assert.equal(authFailure(new ApiError(409, 'EMAIL_ALREADY_EXISTS')), 'email-taken');
  assert.equal(authFailure(new Error('fetch failed')), 'network');
});

test('Expo Go uses the Metro LAN host when no API URL is set', () => {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;
  assert.equal(apiBaseUrl(), 'http://192.168.1.20:8000');
  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = previous;
});
