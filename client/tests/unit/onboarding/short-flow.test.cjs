// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필과 검토 단계 순서 검증
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 간소화된 온보딩 단계 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { emptyDraft, nextStep, previousStep } = require('../../../src/features/onboarding/types.ts');
const { canFinish, restoreDraft } = require('../../../src/features/onboarding/rules.ts');

test('onboarding skips removed screens and restores their saved drafts', () => {
  assert.equal(nextStep('allergies'), 'family');
  assert.equal(nextStep('family'), 'sensory');
  assert.equal(nextStep('sensory'), 'review');
  assert.equal(previousStep('review'), 'sensory');
  assert.equal(restoreDraft({ ...emptyDraft(), step: 'restrictions' }).step, 'family');
  assert.equal(restoreDraft({ ...emptyDraft(), step: 'safe-foods' }).step, 'sensory');
});

test('completion requires allergies but not removed answers', () => {
  const draft = { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', allergies: ['none'],
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false } };
  assert.equal(canFinish(draft), true);
  assert.equal(canFinish({ ...draft, allergies: [] }), false);
});
