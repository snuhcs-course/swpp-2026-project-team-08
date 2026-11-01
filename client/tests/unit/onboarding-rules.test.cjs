// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');
const { validPassword, canAddSafeFood, toggleExclusive, canContinue, canFinish,
  matchingSafeFoods, isDraft } = require('../../src/features/onboarding/rules.ts');

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'] };
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
test('vegetarian step and safe foods are optional and may stay empty', () => {
  const draft = { ...completeDraft(), vegetarianRestrictions: [], safeFoods: [] };
  assert.equal(canContinue('vegetarian', draft, 'password'), true);
  assert.equal(canFinish(draft), true);
});
test('retired dietary approaches are omitted on restore and do not block completion', () => {
  const { restoreDraft } = require('../../src/features/onboarding/rules.ts');
  const restored = restoreDraft({ ...completeDraft(), step: 'approaches', approaches: [] });
  assert.deepEqual(restored, { ...completeDraft(), step: 'vegetarian' });
  assert.equal(canFinish(restored), true);
});
test('none is exclusive and toggling a choice preserves the input array', () => {
  const selected = ['EGGS', 'MILK_DAIRY'];
  assert.deepEqual(toggleExclusive(selected, 'none'), ['none']);
  assert.deepEqual(selected, ['EGGS', 'MILK_DAIRY']);
  assert.deepEqual(toggleExclusive(['none'], 'EGGS'), ['EGGS']);
  assert.deepEqual(toggleExclusive(['none'], 'none'), []);
  assert.deepEqual(toggleExclusive(selected, 'EGGS'), ['MILK_DAIRY']);
});
test('safe foods require a nonblank name and preparation', () => {
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: 'Boiled' }), true);
  assert.equal(canAddSafeFood({ name: ' ', preparation: 'Boiled' }), false);
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: ' ' }), false);
});
test('safe food warnings match a selected allergy but ignore none', () => {
  const draft = { ...completeDraft(), allergies: ['EGGS'], safeFoods: [
    { name: 'Eggs soup', preparation: 'Boiled' }, { name: 'Rice', preparation: 'Boiled' },
  ] };
  assert.deepEqual(matchingSafeFoods(draft, 'en'), ['Eggs soup']);
  assert.deepEqual(matchingSafeFoods({ ...draft, allergies: ['none'] }, 'en'), []);
});
test('draft validation rejects missing fields and invalid consent types', () => {
  assert.equal(isDraft(emptyDraft()), true);
  for (const invalid of [null, {}, { ...emptyDraft(), step: 'unknown' },
    { ...emptyDraft(), consent: { accountPrivacy: 'true' } }, { ...emptyDraft(), safeFoodInput: null }]) {
    assert.equal(isDraft(invalid), false);
  }
});
