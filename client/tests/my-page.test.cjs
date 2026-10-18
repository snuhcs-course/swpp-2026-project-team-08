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
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') {
    return {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => { values.set(key, value); },
      removeItem: async (key) => { values.delete(key); },
    };
  }
  return originalLoad.call(this, name, ...args);
};

const {
  caregiverLine, canSendEmailCode, familySummary, localEmailCodeMatches, LOCAL_EMAIL_CODE,
  optionSummary, safeFoodSummary, safetySummary,
} = require('../src/features/my-page/rules.ts');
const { readProfile, saveProfile, clearProfile } = require('../src/data/storage/profileStorage.ts');
const { emptyDraft } = require('../src/features/onboarding/types.ts');

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

test('caregiver line and local email code follow the My Page rules', () => {
  assert.equal(caregiverLine('Alex', 'alex@example.com'), 'Alex - alex@example.com');
  assert.equal(canSendEmailCode('alex@example.com', 'alex@example.com'), false);
  assert.equal(canSendEmailCode('alex@example.com', 'not-an-email'), false);
  assert.equal(canSendEmailCode('alex@example.com', 'new@example.com'), true);
  assert.equal(localEmailCodeMatches('000000'), false);
  assert.equal(localEmailCodeMatches(LOCAL_EMAIL_CODE), true);
});

test('saved profiles keep an optional photo and can be cleared', async () => {
  values.clear();
  const draft = emptyDraft();
  const profile = {
    ...draft,
    id: 'child-1',
    caregiverName: 'Alex',
    caregiverEmail: 'alex@example.com',
    childName: 'Child',
    ageRange: '4-5',
    photoUri: 'file:///photo.png',
    updatedAt: '2026-10-17T00:00:00.000Z',
  };
  delete profile.step;
  delete profile.safeFoodInput;
  await saveProfile(profile);
  assert.equal((await readProfile()).photoUri, 'file:///photo.png');
  await clearProfile();
  assert.equal(await readProfile(), null);
});
