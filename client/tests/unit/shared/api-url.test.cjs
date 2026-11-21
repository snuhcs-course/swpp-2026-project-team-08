// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 인증 오류·이메일 코드와 공통 API 주소 검증 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { createMemoryStorage } = require('../../helpers/memory-storage.cjs');

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

const { mockModules } = require('../../helpers/mock-modules.cjs');

mockModules((name) => {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (name === 'expo-secure-store') return { __esModule: true, ...secureStore, default: secureStore };
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '192.168.1.20:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return undefined;
});

const { ApiError, apiBaseUrl } = require('../../../src/data/network/apiClient.ts');

test('Expo Go uses the Metro LAN host when no API URL is set', () => {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;
  assert.equal(apiBaseUrl(), 'http://192.168.1.20:8000');
  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = previous;
});
