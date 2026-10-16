// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
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

let secureAvailable = true;
const secrets = new Map();
const secureStore = {
  WHEN_UNLOCKED: 1,
  isAvailableAsync: async () => secureAvailable,
  getItemAsync: async (key) => secrets.get(key) ?? null,
  setItemAsync: async (key, value) => { secrets.set(key, value); },
  deleteItemAsync: async (key) => { secrets.delete(key); },
};

const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (name === 'expo-secure-store') return { __esModule: true, ...secureStore, default: secureStore };
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '192.168.1.20:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return originalLoad.call(this, name, ...args);
};

const { readSession, saveSession, clearSession } = require('../src/data/storage/authStorage.ts');
const { authFailure } = require('../src/data/api/authApi.ts');
const { ApiError, apiBaseUrl } = require('../src/data/network/apiClient.ts');

const session = {
  accessToken: 'access-secret',
  refreshToken: 'refresh-secret',
  user: { id: 'user-1', email: 'parent@example.com', fullName: 'Parent' },
};

test('auth session stores tokens in SecureStore and user in AsyncStorage', async () => {
  values.clear();
  secrets.clear();
  secureAvailable = true;
  await clearSession();
  await saveSession(session);
  assert.deepEqual(await readSession(), session);
  assert.equal(secrets.get('nurturebites.auth.accessToken'), 'access-secret');
  assert.equal(secrets.get('nurturebites.auth.refreshToken'), 'refresh-secret');
  assert.equal(values.get('nurturebites.auth.user.v1'), JSON.stringify(session.user));
  assert.equal(values.get('nurturebites.auth.session.v1'), undefined);
  assert.equal(values.get('nurturebites.auth.accessToken'), undefined);
  await clearSession();
  assert.equal(await readSession(), null);
  assert.equal(secrets.size, 0);
});

test('auth session migrates plaintext AsyncStorage tokens into SecureStore', async () => {
  values.clear();
  secrets.clear();
  secureAvailable = true;
  await clearSession();
  await storage.setItem('nurturebites.auth.session.v1', JSON.stringify(session));
  assert.deepEqual(await readSession(), session);
  assert.equal(secrets.get('nurturebites.auth.accessToken'), 'access-secret');
  assert.equal(values.get('nurturebites.auth.session.v1'), undefined);
});

test('auth session falls back to AsyncStorage when SecureStore is unavailable', async () => {
  values.clear();
  secrets.clear();
  secureAvailable = false;
  await clearSession();
  await saveSession(session);
  assert.deepEqual(await readSession(), session);
  assert.equal(values.get('nurturebites.auth.accessToken'), 'access-secret');
  assert.equal(values.get('nurturebites.auth.refreshToken'), 'refresh-secret');
  assert.equal(secrets.size, 0);
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
