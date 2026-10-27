// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
function createMemoryStorage() {
  const values = new Map();
  let failedKey = null;
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) {
      if (key === failedKey) {
        failedKey = null;
        throw new Error('Disk full');
      }
      values.set(key, value);
    },
    async removeItem(key) { values.delete(key); },
    async getAllKeys() { return [...values.keys()]; },
    async multiRemove(keys) { for (const key of keys) values.delete(key); },
  };
  return { values, storage, failNextWrite: (key) => { failedKey = key; } };
}

module.exports = { createMemoryStorage };
