// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');
const { values, storage } = createMemoryStorage();

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name === '@react-native-async-storage/async-storage') return storage;
  return undefined;
});

const { wipeAccountLocalData } = require('../../src/data/storage/accountWipe.ts');

const { readProfile, saveProfile, clearProfile } = require('../../src/data/storage/profileStorage.ts');

const { emptyDraft } = require('../../src/features/onboarding/types.ts');

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

test('saved profiles can be cleared', async () => {
  values.clear();
  const draft = emptyDraft();
  const profile = {
    ...draft,
    id: 'child-1',
    caregiverName: 'Alex',
    caregiverEmail: 'alex@example.com',
    childName: 'Child',
    ageRange: '4-5',
    updatedAt: '2026-10-17T00:00:00.000Z',
  };
  delete profile.step;
  delete profile.safeFoodInput;
  await saveProfile(profile);
  assert.equal((await readProfile()).childName, 'Child');
  await clearProfile();
  assert.equal(await readProfile(), null);
});
