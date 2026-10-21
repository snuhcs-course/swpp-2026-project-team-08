// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
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
const { readDraft, saveDraft, clearDraft } = require('../src/data/storage/onboardingDraftStorage.ts');
const { readLanguage, saveLanguage } = require('../src/data/storage/languageStorage.ts');

function completedDraft() {
  return {
    ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'toddler',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], approaches: ['none'], familyFoods: ['dairy'],
  };
}

test('language and in-progress draft remain independent', async () => {
  values.clear();
  const draft = completedDraft();
  assert.equal(canFinish({ ...draft, familyFoods: [] }), false);
  assert.equal(canFinish(draft), true);
  await saveLanguage('ko');
  await saveDraft({ ...draft, step: 'review' });
  assert.equal(await readLanguage(), 'ko');
  assert.equal(isDraft(await readDraft()), true);
  await clearDraft();
  assert.equal(await readDraft(), null);
  assert.equal(await readLanguage(), 'ko');
});

test('failed draft write preserves the previous recoverable draft', async () => {
  values.clear();
  const draft = { ...completedDraft(), step: 'review' };
  await saveDraft(draft);
  failedKey = 'nurturebites.onboarding.v1';
  await assert.rejects(saveDraft({ ...draft, childName: 'Edited' }));
  assert.deepEqual(await readDraft(), draft);
});

test('invalid onboarding draft and incomplete input are rejected', () => {
  assert.equal(isDraft({ ...completedDraft(), step: 'unknown' }), false);
  assert.equal(canFinish({ ...completedDraft(), caregiverEmail: 'invalid' }), false);
});
