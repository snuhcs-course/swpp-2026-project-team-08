// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 추가·삭제·선택 정보 초안 복원 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리·실행 환경 추출 및 사례 이름 한글화
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
