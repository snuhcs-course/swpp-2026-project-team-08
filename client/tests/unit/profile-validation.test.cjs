// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../helpers/register.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');

const { values, storage } = createMemoryStorage();

const { mockModules } = require('../helpers/mock-modules.cjs');

mockModules((name) => {
  return name === '@react-native-async-storage/async-storage' ? storage : undefined;
});

const { emptyDraft } = require('../../src/features/onboarding/types.ts');

const { canFinish, isDraft } = require('../../src/features/onboarding/rules.ts');

const { readProfile } = require('../../src/data/storage/profileStorage.ts');

function completedDraft() {
  return {
    ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'toddler',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], approaches: ['none'], familyFoods: ['dairy'],
  };
}

test('invalid persisted profile and draft are rejected at their boundaries', async () => {
  values.clear();
  values.set('nurturebites.profile.v1', JSON.stringify({ id: 'broken' }));
  await assert.rejects(readProfile());
  assert.equal(isDraft({ ...completedDraft(), step: 'unknown' }), false);
  assert.equal(canFinish({ ...completedDraft(), caregiverEmail: 'invalid' }), false);
});
