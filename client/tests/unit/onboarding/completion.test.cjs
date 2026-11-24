// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 완료 테스트 분리 및 필수 답변·선택 입력·음식 응답 경계 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식생활 단계 진행 중복 검증 제거 및 완료 조건 검증 유지
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { canFinish } = require('../../../src/features/onboarding/rules.ts');

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'], noSafeFoods: true };
}

test('필수 계정·동의·자녀·제한 답변 중 하나라도 유효하지 않으면 완료를 차단한다', () => {
  const draft = completeDraft();
  assert.equal(canFinish(draft), true);
  // 다른 조건은 유효하게 두고 최종 완료에 필요한 조건을 하나씩 제거한다.
  for (const [missing, changes] of [
    ['보호자 이름', { caregiverName: ' ' }],
    ['유효한 이메일', { caregiverEmail: 'invalid' }],
    ['개인정보 필수 동의', { consent: { ...draft.consent, accountPrivacy: false } }],
    ['식사 기록 필수 동의', { consent: { ...draft.consent, photoAnalysis: false } }],
    ['자녀 이름', { childName: ' ' }],
    ['자녀 연령대', { ageRange: '' }],
    ['알레르기 답변', { allergies: [] }],
    ['식이 제한 답변', { restrictions: [] }],
  ]) {
    assert.equal(canFinish({ ...draft, ...changes }), false, missing);
  }
});

test('음식을 추가하거나 없음을 선택하지 않으면 작성 중 입력이 있어도 완료를 차단한다', () => {
  const draft = { ...completeDraft(), noSafeFoods: false, safeFoods: [] };
  for (const safeFoodInput of [
    { name: '', preparation: '', presentationNote: '' },
    { name: 'Apple', preparation: 'Sliced', presentationNote: 'Blue bowl' },
  ]) {
    assert.equal(canFinish({ ...draft, safeFoodInput }), false);
  }
});

test('선택 동의는 거부하고 식생활은 미응답이어도 제한과 음식에 없음으로 답하면 완료를 허용한다', () => {
  const draft = { ...completeDraft(), dietaryPattern: null, safeFoods: [] };
  assert.equal(canFinish(draft), true);
});

test('실제 알레르기·식이 제한·식생활 유형과 추가된 음식이 있으면 완료를 허용한다', () => {
  const draft = completeDraft();
  assert.equal(canFinish({
    ...draft,
    consent: { ...draft.consent, aiTraining: true },
    allergies: ['EGGS'], restrictions: ['GLUTEN_FREE'], dietaryPattern: 'pescatarian',
    noSafeFoods: false,
    safeFoods: [{ id: 'apple', name: 'Apple', preparation: '', presentationNote: '' }],
  }), true);
});
