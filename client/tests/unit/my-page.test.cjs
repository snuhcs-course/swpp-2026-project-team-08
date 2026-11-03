// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 요약 함수와 단계 이름을 채식 제한 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 채식 제한 요약을 제거하고 식생활 유형 단계(family) 이동 기준으로 수정
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const {
  caregiverLine, canSendEmailCode,
  optionSummary, safeFoodSummary, safetySummary,
} = require('../../src/features/my-page/rules.ts');

const { createDraftSaveGate } = require('../../src/features/onboarding/draftSaveGate.ts');

const { onboardingRouteParams } = require('../../src/features/onboarding/navigation.ts');

test('empty food summaries show nothing and skip none', () => {
  assert.equal(optionSummary([], 'allergies', 'en'), 'nothing');
  assert.equal(optionSummary(['none'], 'allergies', 'en'), 'nothing');
  assert.equal(safetySummary(['PEANUTS'], ['none'], 'en'), 'Peanuts');
  assert.equal(safetySummary(['PEANUTS'], ['GLUTEN_FREE'], 'en'), 'Peanuts, Gluten-free');
  assert.equal(safeFoodSummary([], 'en'), 'nothing');
  assert.equal(
    safeFoodSummary([{ id: '1', name: 'Apple', preparation: 'peeled', presentationNote: 'thin slices' }], 'en'),
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
