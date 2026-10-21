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
const storage = {
  getItem: async (key) => values.get(key) ?? null,
  setItem: async (key, value) => { values.set(key, value); },
  removeItem: async (key) => { values.delete(key); },
  getAllKeys: async () => [...values.keys()],
  multiRemove: async (keys) => { for (const key of keys) values.delete(key); },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return storage;
  return originalLoad.call(this, name, ...args);
};

const {
  caregiverLine, canSendEmailCode, familySummary,
  optionSummary, safeFoodSummary, safetySummary,
} = require('../src/features/my-page/rules.ts');
const { wipeAccountLocalData } = require('../src/data/storage/accountWipe.ts');
const { createDraftSaveGate } = require('../src/features/onboarding/draftSaveGate.ts');
const { onboardingRouteParams } = require('../src/features/onboarding/navigation.ts');

test('empty food summaries show nothing and skip none', () => {
  assert.equal(optionSummary([], 'allergies', 'en'), 'nothing');
  assert.equal(optionSummary(['none'], 'allergies', 'en'), 'nothing');
  assert.equal(safetySummary(['peanut'], ['none'], 'en'), 'Peanuts');
  assert.equal(safetySummary(['peanut'], ['gluten-free'], 'en'), 'Peanuts, Gluten-free');
  assert.equal(familySummary([], 'en'), 'nothing');
  assert.equal(familySummary(['eggs', 'poultry'], 'en'), 'Eggs, Poultry');
  assert.equal(safeFoodSummary([], true, 'en'), 'nothing');
  assert.equal(
    safeFoodSummary([{ id: '1', name: 'Apple', preparation: 'peeled', presentationNote: 'thin slices' }], false, 'en'),
    'Apple (peeled, thin slices)',
  );
});

test('caregiver line and email send rules follow the My Page rules', () => {
  assert.equal(caregiverLine('Alex', 'alex@example.com'), 'Alex - alex@example.com');
  assert.equal(canSendEmailCode('alex@example.com', 'alex@example.com'), false);
  assert.equal(canSendEmailCode('alex@example.com', 'not-an-email'), false);
  assert.equal(canSendEmailCode('alex@example.com', 'new@example.com'), true);
});

test('review return drops the from=review origin so Previous leaves review', () => {
  assert.deepEqual(onboardingRouteParams('allergies', 'review'), { step: 'allergies', from: 'review' });
  assert.deepEqual(onboardingRouteParams('review', 'review'), { step: 'review' });
  assert.deepEqual(onboardingRouteParams('review'), { step: 'review' });
  assert.deepEqual(onboardingRouteParams('family', 'child-profile'), { step: 'family', from: 'child-profile' });
});

test('discard waits out an in-flight save so a deleted draft is not rewritten', async () => {
  let stored = 'kept';
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const gate = createDraftSaveGate();
  const writing = gate.persist(async () => {
    await blocked;
    stored = 'stale';
  });
  const discarded = gate.discard(async () => { stored = null; });
  release();
  await writing;
  await discarded;
  assert.equal(stored, null);
});

test('account wipe removes profile, draft, meals, and photos for the child', async () => {
  values.clear();
  await storage.setItem('nurturebites.profile.v1', '{}');
  await storage.setItem('nurturebites.onboarding.v1', '{}');
  await storage.setItem('nurturebites.meals.child-1.v1', '[]');
  await storage.setItem('nurturebites.meal-draft.child-1.v1', '{}');
  await storage.setItem('nurturebites.home.child-1.v1', '{}');
  await storage.setItem('nurturebites.after-meal.child-1.meal-1.draft.v1', '{}');
  await storage.setItem('nurturebites.auth.user.v1', '{}');
  await storage.setItem('nurturebites.language.v1', '"en"');
  await wipeAccountLocalData(['child-1']);
  assert.equal(values.has('nurturebites.profile.v1'), false);
  assert.equal(values.has('nurturebites.onboarding.v1'), false);
  assert.equal(values.has('nurturebites.meals.child-1.v1'), false);
  assert.equal(values.has('nurturebites.after-meal.child-1.meal-1.draft.v1'), false);
  assert.equal(values.has('nurturebites.auth.user.v1'), true);
  assert.equal(values.has('nurturebites.language.v1'), true);
});
