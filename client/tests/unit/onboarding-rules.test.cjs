// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
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
test('dietary pattern step and safe foods are optional and may stay empty', () => {
  const draft = { ...completeDraft(), dietaryPattern: null, safeFoods: [] };
  assert.equal(canContinue('family', draft, 'password'), true);
  assert.equal(canFinish(draft), true);
});
test('retired steps are omitted on restore and resume at the dietary pattern step', () => {
  const { restoreDraft } = require('../../src/features/onboarding/rules.ts');
  for (const step of ['approaches', 'vegetarian']) {
    const restored = restoreDraft({ ...completeDraft(), step, approaches: [] });
    assert.deepEqual(restored, { ...completeDraft(), step: 'family' });
    assert.equal(canFinish(restored), true);
  }
});
test('saved vegetarian restrictions survive a draft restore even without an input screen', () => {
  const { restoreDraft } = require('../../src/features/onboarding/rules.ts');
  const draft = { ...completeDraft(), vegetarianRestrictions: ['EGGS', 'POULTRY'], step: 'review' };
  assert.deepEqual(restoreDraft(JSON.parse(JSON.stringify(draft))).vegetarianRestrictions,
    ['EGGS', 'POULTRY']);
});
test('none is exclusive and toggling a choice preserves the input array', () => {
  const selected = ['EGGS', 'MILK_DAIRY'];
  assert.deepEqual(toggleExclusive(selected, 'none'), ['none']);
  assert.deepEqual(selected, ['EGGS', 'MILK_DAIRY']);
  assert.deepEqual(toggleExclusive(['none'], 'EGGS'), ['EGGS']);
  assert.deepEqual(toggleExclusive(['none'], 'none'), []);
  assert.deepEqual(toggleExclusive(selected, 'EGGS'), ['MILK_DAIRY']);
});
test('safe foods require a nonblank name; cooking method is optional', () => {
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: 'Boiled' }), true);
  assert.equal(canAddSafeFood({ name: ' ', preparation: 'Boiled' }), false);
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: ' ' }), true);
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: '' }), true);
  assert.equal(canAddSafeFood({ name: '', preparation: '' }), false);
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

test('dietary pattern is optional and a draft without it restores as unanswered', () => {
  const { restoreDraft } = require('../../src/features/onboarding/rules.ts');
  const { dietaryPatternLabel } = require('../../src/util/dietaryPattern.ts');
  const legacy = completeDraft();
  delete legacy.dietaryPattern;
  assert.equal(restoreDraft(legacy).dietaryPattern, null);
  assert.equal(dietaryPatternLabel(null, 'en'), 'Not answered');
  assert.equal(dietaryPatternLabel('no_specific_pattern', 'en'), 'No specific dietary pattern');
  for (const dietaryPattern of [null, 'flexitarian', 'no_specific_pattern']) {
    const draft = { ...completeDraft(), dietaryPattern };
    assert.equal(canContinue('family', draft, ''), true);
    assert.equal(canFinish(draft), true);
    assert.equal(restoreDraft(JSON.parse(JSON.stringify(draft))).dietaryPattern, dietaryPattern);
  }
  assert.equal(isDraft({ ...legacy, dietaryPattern: 'eggs' }), false);
});
