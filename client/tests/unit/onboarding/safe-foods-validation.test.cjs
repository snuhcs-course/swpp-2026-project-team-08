// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리 및 경로 정리 · 음식 없음 응답 반영
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 계정 입력과 익숙한 음식 입력의 진행 조건 검증 분리
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
