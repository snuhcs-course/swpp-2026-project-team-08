// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 미추가 어려움 입력의 저장·중복·미완성·대상 제외 검증
// AI-generated with GPT-6, GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 음식 편집 규칙과 이전 초안 단계 복원 검증을 분리 · 통합 사진 확인 흐름 검증
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { normalizeReviewStep } = require('../../../src/features/after-meal-review/rules.ts');
const photo = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };

test('이전 비교 단계는 식후 사진이 있으면 사진 확인으로, 없으면 결과 입력으로 복원된다', () => {
  for (const step of ['compare', 'comparing', 'comparison-error']) {
    assert.equal(normalizeReviewStep(step, photo), 'preview', step);
    assert.equal(normalizeReviewStep(step, null), 'outcomes', step);
  }
});

test('사진 확인 초안에 식후 사진이 없으면 사진 선택으로 돌아간다', () => {
  assert.equal(normalizeReviewStep('preview', null), 'photo');
});

test('이전 추천 단계는 어려움 입력으로 복원되고 현재 단계는 그대로 열린다', () => {
  assert.equal(normalizeReviewStep('suggestions', null), 'difficulties');
  for (const step of ['photo', 'preview', 'outcomes', 'difficulties', 'complete']) {
    assert.equal(normalizeReviewStep(step, photo), step);
  }
});
