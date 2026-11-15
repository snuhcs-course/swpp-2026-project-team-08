// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 동의 테스트 분리·보강 및 사례 이름 한글화 · 음식 없음 응답 반영
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { canContinue, canFinish } = require('../../../src/features/onboarding/rules.ts');

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'], noSafeFoods: true };
}

function assertProgressAllowed(consent, expected) {
  const draft = { ...completeDraft(), consent };
  assert.equal(canContinue('consent', draft, 'password'), expected);
  assert.equal(canFinish(draft), expected);
}

test('필수 항목에만 동의해도 다음 단계 진행과 온보딩 완료를 허용한다', () => {
  assertProgressAllowed({ accountPrivacy: true, photoAnalysis: true, aiTraining: false }, true);
});

test('필수 동의에 AI 학습 동의를 더해도 다음 단계 진행과 온보딩 완료를 허용한다', () => {
  assertProgressAllowed({ accountPrivacy: true, photoAnalysis: true, aiTraining: true }, true);
});

test('계정·아이 정보에 동의하지 않으면 AI 학습에 동의해도 진행과 완료를 차단한다', () => {
  assertProgressAllowed({ accountPrivacy: false, photoAnalysis: true, aiTraining: true }, false);
});

test('식사 기록을 활용한 맞춤 추천에 동의하지 않으면 AI 학습에 동의해도 진행과 완료를 차단한다', () => {
  assertProgressAllowed({ accountPrivacy: true, photoAnalysis: false, aiTraining: true }, false);
});
