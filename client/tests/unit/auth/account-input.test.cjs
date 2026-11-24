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
// Changed: 계정 입력 진행 조건 분리 및 완료 조건 중복 검증 제거
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { emptyDraft } = require('../../../src/features/onboarding/types.ts');

const { validPassword, canContinue } = require('../../../src/features/onboarding/rules.ts');

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'], noSafeFoods: true };
}

const required = [
  ['account', { caregiverName: ' ' }],
  ['account', { caregiverEmail: 'invalid' }],
];

test('password requires at least eight characters', () => {
  for (const length of [0, 7, 8, 9]) assert.equal(validPassword('a'.repeat(length)), length >= 8);
});

for (const [step, missing] of required) {
  test(`계정 입력이 ${JSON.stringify(missing)}이면 다음 단계 진행 가능 여부는 false다`, () => {
    const draft = completeDraft();
    assert.equal(canContinue(step, draft, 'password'), true);
    assert.equal(canContinue(step, { ...draft, ...missing }, 'password'), false);
  });
}

test('계정의 비밀번호가 짧으면 계정 단계 진행을 차단한다', () => {
  assert.equal(canContinue('account', completeDraft(), 'short'), false);
});
