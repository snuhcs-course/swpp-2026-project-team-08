// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');
const { storage } = createMemoryStorage();

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

const { authFailure, issuedEmailCode } = require('../../src/data/api/authApi.ts');

const { ApiError, apiBaseUrl } = require('../../src/data/network/apiClient.ts');

test('auth failures map server codes and network errors', () => {
  assert.equal(authFailure(new ApiError(401, 'INVALID_CREDENTIALS')), 'invalid-credentials');
  assert.equal(authFailure(new ApiError(409, 'EMAIL_ALREADY_EXISTS')), 'email-taken');
  assert.equal(authFailure(new ApiError(400, 'INVALID_EMAIL_CODE')), 'invalid-email-code');
  assert.equal(authFailure(new Error('fetch failed')), 'network');
});

test('email-change uses a server-issued code instead of a local 123456', () => {
  assert.equal(issuedEmailCode({ sent: true, dev_code: '482190' }), '482190');
  assert.equal(issuedEmailCode({ sent: true }), undefined);
  assert.equal(issuedEmailCode({ sent: true, dev_code: '12345' }), undefined);
});

test('Expo Go uses the Metro LAN host when no API URL is set', () => {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;
  assert.equal(apiBaseUrl(), 'http://192.168.1.20:8000');
  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = previous;
});
