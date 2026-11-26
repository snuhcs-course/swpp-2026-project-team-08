// AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
// Changed: 현재 초안 구조 검증
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 초안 fixture 를 채식 제한 필드와 서버 연령 값으로 변경
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Repair onboarding imports and connect the shared storage mock; Dietary Pattern
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: family 단계를 vegetarian 으로, 채식 제한을 선택 사항으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)를 선택 사항으로 되돌려 수정
// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리 및 현재 초안 복원·잘못된 저장값 경계 검증
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Match current onboarding step order in draft restoration
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { isDraft, restoreDraft } = require('../../../src/features/onboarding/rules.ts');

test('필수 필드가 없거나 동의·음식 입력 형식이 잘못되면 초안 검사를 통과하지 못한다', () => {
  assert.equal(isDraft(emptyDraft()), true);
  for (const invalid of [null, {}, { ...emptyDraft(), step: 'unknown' },
    { ...emptyDraft(), consent: { accountPrivacy: 'true' } }, { ...emptyDraft(), refusedFoodInput: null }]) {
    assert.equal(isDraft(invalid), false);
  }
});

test('작성 중인 초안은 미응답·공백 입력과 현재 단계를 그대로 복원한다', () => {
  const draft = { ...emptyDraft(), step: 'child', childName: '  나루  ', caregiverName: '' };
  assert.deepEqual(restoreDraft(JSON.parse(JSON.stringify(draft))), draft);
});

test('없음과 실제 선택을 구분하고 음식 목록·설명·작성 중 입력을 모두 복원한다', () => {
  const draft = {
    ...emptyDraft(), step: 'sensory', childName: '나루', ageRange: 'AGE_4_5',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['EGGS', 'MILK_DAIRY'],
    restrictions: ['none'], dietaryPattern: 'no_specific_pattern',
  };
  assert.deepEqual(restoreDraft(JSON.parse(JSON.stringify(draft))), draft);
});

test('초안의 기본 구조·필드 형식이 잘못되면 복원하지 않는다', () => {
  const draft = emptyDraft();
  for (const invalid of [null, [], 'draft', {}, { ...draft, step: null },
    { ...draft, childName: 1 }, { ...draft, consent: { ...draft.consent, aiTraining: 'false' } },
    { ...draft, allergies: null }, { ...draft, restrictions: 'none' },
    { ...draft, vegetarianRestrictions: {} },
    { ...draft, dietaryPattern: 'unknown' },
  ]) {
    assert.equal(restoreDraft(invalid), null, JSON.stringify(invalid));
  }
});
