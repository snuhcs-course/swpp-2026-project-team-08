// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 조리법 열 개의 저장·표시와 기존 통합값의 미입력 처리 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: Unit 테스트를 담당 기능·공통 컴포넌트 폴더로 이동
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 추천 응답에서 조리법이 빠져 추천의 조리법 변환 검증 제거
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
require('../../helpers/mock-modules.cjs').mockModules(name => name.endsWith('/network/apiClient')
  ? { apiRequest: () => { throw new Error('Unexpected HTTP'); } } : undefined);
const { cookingMethodIds } = require('../../../src/types/recordValues.ts');
const { abcCopyFor, suggestionCopyFor } = require('../../../src/util/strings.ts');
const { prepareMealWrite } = require('../../../src/data/api/mealWriteApi.ts');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { mealResponse } = require('../../fixtures/server-meal.cjs');

const methods = [
  ['raw', 'RAW', 'Raw'],
  ['boiled', 'BOILED', 'Boiled'],
  ['steamed', 'STEAMED', 'Steamed'],
  ['pan_fried', 'PAN_FRIED', 'Pan-fried'],
  ['stir_fried', 'STIR_FRIED', 'Stir-fried'],
  ['baked', 'BAKED', 'Baked'],
  ['roasted', 'ROASTED', 'Roasted'],
  ['mashed', 'MASHED', 'Mashed'],
  ['blended', 'BLENDED', 'Blended'],
  ['other', 'OTHER', 'Other'],
];

test('조리법 열 개는 저장과 재조회 후 식사·리뷰에서 같은 의미를 갖는다', () => {
  assert.deepEqual([...cookingMethodIds], methods.map(([id]) => id));
  for (const [id, apiValue, englishLabel] of methods) {
    const response = mealResponse();
    const meal = toLegacyMeal(toMealDetail(response));
    meal.foods[0].preparation = id;
    const body = prepareMealWrite(meal).body;
    assert.equal(body.foods[0].cooking_method, apiValue);

    response.foods[0].cooking_method = body.foods[0].cooking_method;
    response.foods[0].outcome = 'UNTOUCHED';
    const detail = toMealDetail(response);
    assert.equal(detail.foods[0].cookingMethod, id);
    assert.equal(detail.review.foodResults[0].foodSnapshot.cookingMethod, id);
    assert.equal(toLegacyMeal(detail).foods[0].preparation, id);
    assert.equal(abcCopyFor('en').cookingMethods[id], englishLabel);
    for (const language of ['en', 'ko']) {
      const label = abcCopyFor(language).cookingMethods[id];
      assert.equal(typeof label, 'string');
      assert.ok(label.length > 0);
      assert.equal(suggestionCopyFor(language).cookingMethods[id], label);
    }
  }
});

test('기존 통합 조리법은 식사·리뷰에서 미입력으로 읽고 다시 저장한다', () => {
  for (const method of ['BAKED_ROASTED', 'MASHED_BLENDED']) {
    const response = mealResponse();
    response.foods[0].cooking_method = method;
    response.foods[0].outcome = 'UNTOUCHED';
    response.foods[0].serving_note = 'Small pieces';
    const detail = toMealDetail(response);
    const meal = toLegacyMeal(detail);
    assert.equal(detail.foods[0].cookingMethod, null);
    assert.equal(detail.review.foodResults[0].foodSnapshot.cookingMethod, null);
    assert.equal(meal.foods[0].preparation, '');
    assert.equal(meal.foods[0].servingNote, 'Small pieces');
    assert.equal(prepareMealWrite(meal).body.foods[0].cooking_method, null);
  }
});

test('조리법 응답은 기존 통합값 외의 잘못된 형식을 거절한다', () => {
  for (const method of ['baked_roasted', 'steamed', 'UNKNOWN', '', 1, {}, undefined]) {
    const response = mealResponse();
    response.foods[0].cooking_method = method;
    assert.throws(() => toMealDetail(response));
  }
});

test('새 식사 저장은 현재 조리법 ID와 미입력만 받는다', () => {
  const meal = toLegacyMeal(toMealDetail(mealResponse()));
  assert.equal(prepareMealWrite(meal).body.foods[0].cooking_method, null);
  for (const preparation of ['baked_roasted', 'mashed_blended', 'Baked', '삶기', 'constructor']) {
    meal.foods[0].preparation = preparation;
    assert.throws(() => prepareMealWrite(meal));
  }
});
