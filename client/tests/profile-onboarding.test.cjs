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
let failedKey = null;
const storage = {
  async getItem(key) { return values.get(key) ?? null; },
  async setItem(key, value) {
    if (key === failedKey) { failedKey = null; throw new Error('Disk full'); }
    values.set(key, value);
  },
  async removeItem(key) { values.delete(key); },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  return name === '@react-native-async-storage/async-storage' ? storage : originalLoad.call(this, name, ...args);
};

const { emptyDraft } = require('../src/features/onboarding/types.ts');
const { canFinish, isDraft } = require('../src/features/onboarding/rules.ts');
const { readProfile, saveProfile, readDraft, saveDraft, clearDraft, readLanguage, saveLanguage } =
  require('../src/data/storage/profileStorage.ts');

function completedDraft() {
  return {
    ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'toddler',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], approaches: ['none'],
  };
}

test('saved profile, language, and in-progress draft remain independent', async () => {
  values.clear();
  const draft = completedDraft();
  const profile = { ...draft, id: 'child-1', updatedAt: '2026-10-08T00:00:00.000Z' };
  delete profile.step;
  delete profile.safeFoodInput;
  assert.equal(canFinish(draft), true);
  await saveProfile(profile);
  await saveLanguage('ko');
  await saveDraft({ ...draft, step: 'review' });
  assert.equal((await readProfile()).id, 'child-1');
  assert.equal(await readLanguage(), 'ko');
  assert.equal(isDraft(await readDraft()), true);
  await clearDraft();
  assert.equal(await readDraft(), null);
  assert.deepEqual(await readProfile(), profile);
});

test('failed profile write preserves the previous profile and recoverable draft', async () => {
  values.clear();
  const draft = completedDraft();
  const oldProfile = { ...draft, id: 'child-1', updatedAt: '2026-10-08T00:00:00.000Z' };
  delete oldProfile.step;
  delete oldProfile.safeFoodInput;
  await saveProfile(oldProfile);
  await saveDraft({ ...draft, step: 'review' });
  failedKey = 'nurturebites.profile.v1';
  await assert.rejects(saveProfile({ ...oldProfile, childName: 'Edited' }));
  assert.deepEqual(await readProfile(), oldProfile);
  assert.equal((await readDraft()).step, 'review');
});

test('invalid persisted profile and draft are rejected at their boundaries', async () => {
  values.clear();
  values.set('nurturebites.profile.v1', JSON.stringify({ id: 'broken' }));
  await assert.rejects(readProfile());
  assert.equal(isDraft({ ...completedDraft(), step: 'unknown' }), false);
  assert.equal(canFinish({ ...completedDraft(), caregiverEmail: 'invalid' }), false);
});
