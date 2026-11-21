// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 미추가 어려움 입력의 저장·중복·미완성·대상 제외 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 음식 편집 규칙과 이전 초안 단계 복원 검증을 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

test('legacy follow-up drafts resume at difficulties without changing current steps', () => {
  const { normalizeReviewStep } = require('../../../src/features/after-meal-review/rules.ts');
  assert.equal(normalizeReviewStep('suggestions'), 'difficulties');
  for (const step of ['photo', 'preview', 'compare', 'outcomes', 'difficulties', 'complete']) assert.equal(normalizeReviewStep(step), step);
});
