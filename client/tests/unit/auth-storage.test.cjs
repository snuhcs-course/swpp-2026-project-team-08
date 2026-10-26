// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');
const { values, storage } = createMemoryStorage();

let secureAvailable = true;

const secrets = new Map();

const secureStore = {
  WHEN_UNLOCKED: 1,
  isAvailableAsync: async () => secureAvailable,
  getItemAsync: async (key) => secrets.get(key) ?? null,
  setItemAsync: async (key, value) => { secrets.set(key, value); },
  deleteItemAsync: async (key) => { secrets.delete(key); },
};

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (name === 'expo-secure-store') return { __esModule: true, ...secureStore, default: secureStore };
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '192.168.1.20:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return undefined;
});

const { readSession, saveSession, clearSession } = require('../../src/data/storage/authStorage.ts');

const session = {
  accessToken: 'access-secret',
  refreshToken: 'refresh-secret',
  user: { id: '1', email: 'parent@example.com', fullName: 'Parent' },
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

test('stored UUID user session is cleared after the ID change', async () => {
  values.clear();
  secrets.clear();
  secureAvailable = true;
  await clearSession();
  await storage.setItem('nurturebites.auth.user.v1', JSON.stringify({ ...session.user, id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }));
  await secureStore.setItemAsync('nurturebites.auth.accessToken', 'access-secret');
  await secureStore.setItemAsync('nurturebites.auth.refreshToken', 'refresh-secret');
  assert.equal(await readSession(), null);
  assert.equal(secrets.size, 0);
  assert.equal(values.has('nurturebites.auth.user.v1'), false);
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
