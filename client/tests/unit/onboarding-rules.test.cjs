// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');
const { validPassword, canAddSafeFood, toggleExclusive, canContinue, canFinish,
  addUnique, matchingSafeFoods, isDraft } = require('../../src/features/onboarding/rules.ts');

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: '4-5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], familyFoods: ['eggs'] };
}

test('password requires at least eight characters', () => {
  for (const length of [0, 7, 8, 9]) assert.equal(validPassword('a'.repeat(length)), length >= 8);
});
const required = [
  ['account', { caregiverName: ' ' }], ['account', { caregiverEmail: 'invalid' }],
  ['consent', { consent: { accountPrivacy: false, photoAnalysis: true, aiTraining: false } }],
  ['consent', { consent: { accountPrivacy: true, photoAnalysis: false, aiTraining: false } }],
  ['child', { childName: ' ' }], ['child', { ageRange: '' }],
  ['allergies', { allergies: [] }], ['restrictions', { restrictions: [] }],
  ['family', { familyFoods: [] }],
];
for (const [step, missing] of required) {
  test(`${step} rejects ${JSON.stringify(missing)} before continuing or finishing`, () => {
    const draft = completeDraft();
    assert.equal(canContinue(step, draft, 'password'), true);
    assert.equal(canContinue(step, { ...draft, ...missing }, 'password'), false);
    assert.equal(canFinish({ ...draft, ...missing }), false);
    assert.equal(canFinish(draft), true);
  });
}
test('account step rejects a short password while optional steps allow skipping', () => {
  assert.equal(canContinue('account', completeDraft(), 'short'), false);
  assert.equal(canContinue('safe-foods', emptyDraft(), ''), true);
});
test('retired dietary approaches are omitted on restore and do not block completion', () => {
  const { restoreDraft } = require('../../src/features/onboarding/rules.ts');
  const restored = restoreDraft({ ...completeDraft(), step: 'approaches', approaches: [] });
  assert.deepEqual(restored, { ...completeDraft(), step: 'family' });
  assert.equal(canFinish(restored), true);
});
test('none is exclusive and toggling a choice preserves the input array', () => {
  const selected = ['egg', 'milk'];
  assert.deepEqual(toggleExclusive(selected, 'none'), ['none']);
  assert.deepEqual(selected, ['egg', 'milk']);
  assert.deepEqual(toggleExclusive(['none'], 'egg'), ['egg']);
  assert.deepEqual(toggleExclusive(['none'], 'none'), []);
  assert.deepEqual(toggleExclusive(selected, 'egg'), ['milk']);
});
test('custom choices are trimmed, case-insensitively unique, and replace none', () => {
  const input = ['Rice'];
  assert.deepEqual(addUnique(input, ' rice '), ['Rice']);
  assert.deepEqual(addUnique(input, ' '), ['Rice']);
  assert.deepEqual(addUnique(['none'], ' Soup '), ['Soup']);
  assert.deepEqual(input, ['Rice']);
});
test('safe foods require a nonblank name and preparation', () => {
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: 'Boiled' }), true);
  assert.equal(canAddSafeFood({ name: ' ', preparation: 'Boiled' }), false);
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: ' ' }), false);
});
test('safe food warnings match a selected allergy but ignore none', () => {
  const draft = { ...completeDraft(), allergies: ['egg'], safeFoods: [
    { name: 'Egg soup', preparation: 'Boiled' }, { name: 'Rice', preparation: 'Boiled' },
  ] };
  assert.deepEqual(matchingSafeFoods(draft, 'en'), ['Egg soup']);
  assert.deepEqual(matchingSafeFoods({ ...draft, allergies: ['none'] }, 'en'), []);
});
test('draft validation rejects missing fields and invalid consent types', () => {
  assert.equal(isDraft(emptyDraft()), true);
  for (const invalid of [null, {}, { ...emptyDraft(), step: 'unknown' },
    { ...emptyDraft(), consent: { accountPrivacy: 'true' } }, { ...emptyDraft(), safeFoodInput: null }]) {
    assert.equal(isDraft(invalid), false);
  }
});
