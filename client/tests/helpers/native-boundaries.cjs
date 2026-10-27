// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { createMemoryStorage } = require('./memory-storage.cjs');
const { mockModules } = require('./mock-modules.cjs');

// Only native/device boundaries are replaced; app, React and Query code stay real.
function nativeBoundaries(overrides = () => undefined) {
  const memory = createMemoryStorage();
  const secureStore = {
    WHEN_UNLOCKED: 1,
    isAvailableAsync: async () => false,
    getItemAsync: async () => null,
    setItemAsync: async () => undefined,
    deleteItemAsync: async () => undefined,
  };
  mockModules((name) => {
    const override = overrides(name);
    if (override !== undefined) return override;
    if (name === '@react-native-async-storage/async-storage') return memory.storage;
    if (name === 'expo-secure-store') return secureStore;
    if (name === 'expo-constants') return {};
    if (name === 'expo-localization') return { getLocales: () => [{ languageCode: 'en' }] };
    return undefined;
  });
  return memory;
}
module.exports = { nativeBoundaries };
