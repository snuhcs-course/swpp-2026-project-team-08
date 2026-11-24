// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 알레르기·식이 제한 화면별 진행·선택 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { canContinue, toggleExclusive } = require('../../../src/features/onboarding/rules.ts');

function validDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'] };
}

test('알레르기 없음이나 실제 항목을 선택하면 알레르기 화면의 진행을 허용한다', () => {
  for (const allergies of [['none'], ['EGGS']]) {
    const draft = { ...validDraft(), allergies };
    assert.equal(canContinue('allergies', draft, 'password'), true);
  }
});

test('알레르기 미응답이면 알레르기 화면의 진행을 차단한다', () => {
  const draft = { ...validDraft(), allergies: [] };
  assert.equal(canContinue('allergies', draft, 'password'), false);
});

test('식이 제한 없음이나 실제 항목을 선택하면 식이 제한 화면의 진행을 허용한다', () => {
  for (const restrictions of [['none'], ['GLUTEN_FREE']]) {
    const draft = { ...validDraft(), restrictions };
    assert.equal(canContinue('restrictions', draft, 'password'), true);
  }
});

test('식이 제한 미응답이면 식이 제한 화면의 진행을 차단한다', () => {
  const draft = { ...validDraft(), restrictions: [] };
  assert.equal(canContinue('restrictions', draft, 'password'), false);
});

test('복수 선택을 추가하고 하나를 해제해도 나머지 선택과 원본 배열을 보존한다', () => {
  const selected = ['EGGS'];
  const added = toggleExclusive(selected, 'MILK_DAIRY');
  assert.deepEqual(added, ['EGGS', 'MILK_DAIRY']);
  assert.deepEqual(selected, ['EGGS']);
  assert.deepEqual(toggleExclusive(added, 'EGGS'), ['MILK_DAIRY']);
  assert.deepEqual(added, ['EGGS', 'MILK_DAIRY']);
});

test('마지막 항목을 해제하면 없음이 아닌 미응답으로 돌아간다', () => {
  assert.deepEqual(toggleExclusive(['EGGS'], 'EGGS'), []);
});

test('없음은 기존 선택을 지우고 다른 항목 선택이나 재선택으로 해제된다', () => {
  const selected = ['EGGS', 'MILK_DAIRY'];
  assert.deepEqual(toggleExclusive(selected, 'none'), ['none']);
  assert.deepEqual(selected, ['EGGS', 'MILK_DAIRY']);
  assert.deepEqual(toggleExclusive(['none'], 'EGGS'), ['EGGS']);
  assert.deepEqual(toggleExclusive(['none'], 'none'), []);
});
