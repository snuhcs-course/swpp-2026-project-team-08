// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 이전 음식 데이터 보존과 현재 거부 음식 단계 검증
// AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
// Changed: 삭제된 단계의 초안 복원 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { emptyDraft, steps } = require('../../../src/features/onboarding/types.ts');
const { restoreDraft } = require('../../../src/features/onboarding/rules.ts');

test('기존 Safe Food 초안은 감각 단계로 복원하고 음식 정보는 제거한다', () => {
  const draft = restoreDraft({ ...emptyDraft(), step: 'safe-foods',
    noSafeFoods: false, safeFoods: [{ name: 'Apple' }], safeFoodInput: { name: 'Pear' } });
  assert.equal(steps.includes('safe-foods'), false);
  assert.equal(draft.step, 'sensory');
  assert.equal('safeFoods' in draft, false);
  assert.equal('safeFoodInput' in draft, false);
});
