// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 레이어별 Unit 테스트와 입력값 선정 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { getIngredientInput } = require('../../../src/features/meal-checkin/rules.ts');

// 순수 규칙의 입력·기대값을 한 표로 정의한다.
const ingredientCases = [
  { title: '공백과 대소문자만 다른 재료는 중복으로 판단한다', input: '  Rice  ', selected: ['rice'], name: 'Rice', canAdd: false },
  { title: '선택한 재료가 없으면 새 재료를 추가할 수 있다', input: '당근', selected: [], name: '당근', canAdd: true },
  { title: '다른 재료가 선택되어 있어도 새 재료를 추가할 수 있다', input: '당근', selected: ['감자'], name: '당근', canAdd: true },
  { title: '빈 문자열은 추가할 수 없다', input: '', selected: [], name: '', canAdd: false },
  { title: '공백만 있는 문자열은 추가할 수 없다', input: ' \t\n ', selected: [], name: '', canAdd: false },
  { title: '새 재료의 앞뒤 공백을 제거한다', input: '  당근  ', selected: [], name: '당근', canAdd: true },
  { title: '단어 사이 공백 수만 다른 재료는 중복으로 판단한다', input: 'brown   rice', selected: ['brown rice'], name: 'brown   rice', canAdd: false },
];

for (const { title, input, selected, name, canAdd } of ingredientCases) {
  test(title, () => {
    // 준비
    const original = [...selected];

    // 실행
    const result = getIngredientInput(input, selected);

    // 검증
    assert.deepEqual(result, { name, canAdd });
    assert.deepEqual(selected, original);
  });
}
