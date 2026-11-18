// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 조리법 열 개의 저장·표시와 기존 통합값의 미입력 처리 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
require('../helpers/mock-modules.cjs').mockModules(name => name.endsWith('/network/apiClient')
  ? { apiRequest: () => { throw new Error('Unexpected HTTP'); } } : undefined);
const { cookingMethodIds, cookingMethodLabel } = require('../../src/util/cookingMethods.ts');
const { abcCopyFor, suggestionCopyFor } = require('../../src/util/strings.ts');
const { prepareMealWrite, cookingMethodFor } = require('../../src/data/api/mealWriteApi.ts');
const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../src/data/dto/mealLegacyDto.ts');
const { toSuggestion } = require('../../src/data/dto/suggestionDto.ts');
const { mealResponse } = require('../fixtures/server-meal.cjs');
const { suggestionResponse } = require('../fixtures/server-suggestion.cjs');

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

test('조리법 열 개는 저장과 재조회 후 식사·리뷰·추천에서 같은 의미를 갖는다', () => {
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
    const suggestion = toSuggestion(suggestionResponse({ cooking_method: apiValue }));
    assert.equal(detail.foods[0].cookingMethod, id);
    assert.equal(detail.review.foodResults[0].foodSnapshot.cookingMethod, id);
    assert.equal(toLegacyMeal(detail).foods[0].preparation, id);
    assert.equal(suggestion.cookingMethod, id);
    assert.equal(cookingMethodLabel(id, abcCopyFor('en').cookingOptions), englishLabel);
    for (const language of ['en', 'ko']) {
      const label = cookingMethodLabel(id, abcCopyFor(language).cookingOptions);
      assert.equal(typeof label, 'string');
      assert.ok(label.length > 0);
      assert.equal(suggestionCopyFor(language).cookingMethods[id], label);
      assert.equal(cookingMethodFor(label), id);
    }
  }
});

test('기존 통합 조리법은 식사·리뷰·추천에서 미입력으로 읽고 다시 저장한다', () => {
  for (const method of ['BAKED_ROASTED', 'MASHED_BLENDED']) {
    const response = mealResponse();
    response.foods[0].cooking_method = method;
    response.foods[0].outcome = 'UNTOUCHED';
    response.foods[0].serving_note = 'Small pieces';
    const detail = toMealDetail(response);
    const meal = toLegacyMeal(detail);
    const suggestion = toSuggestion(suggestionResponse({ cooking_method: method }));
    assert.equal(detail.foods[0].cookingMethod, null);
    assert.equal(detail.review.foodResults[0].foodSnapshot.cookingMethod, null);
    assert.equal(meal.foods[0].preparation, '');
    assert.equal(meal.foods[0].servingNote, 'Small pieces');
    assert.equal(prepareMealWrite(meal).body.foods[0].cooking_method, null);
    assert.equal(suggestion.cookingMethod, null);
    assert.equal(suggestion.whatToTry, 'Try a little');
  }
});

test('조리법 응답은 기존 통합값 외의 잘못된 형식을 거절한다', () => {
  for (const method of ['baked_roasted', 'steamed', 'UNKNOWN', '', 1, {}, undefined]) {
    const response = mealResponse();
    response.foods[0].cooking_method = method;
    assert.throws(() => toMealDetail(response));
    assert.throws(() => toSuggestion(suggestionResponse({ cooking_method: method })));
  }
  assert.throws(() => toSuggestion(suggestionResponse({ cooking_method: null })));
});

test('이전 표시 이름은 뜻이 같은 개별 조리법으로 저장된다', () => {
  for (const [value, expected] of [
    ['Baked', 'baked'], ['Roasted', 'roasted'], ['Mashed', 'mashed'], ['Blended', 'blended'],
    ['Steamed', 'steamed'], ['삶기', 'boiled'], ['Other', 'other'], ['기타', 'other'],
  ]) {
    assert.equal(cookingMethodFor(value), expected);
  }
});

test('이전 초안의 통합 조리법은 미입력으로 저장하고 나머지 음식 입력을 보존한다', () => {
  const meal = toLegacyMeal(toMealDetail(mealResponse()));
  meal.foods[0].servingNote = 'Small pieces';
  for (const preparation of [
    'baked_roasted', 'mashed_blended', 'Baked/roasted', 'Mashed/blended',
    '오븐에 굽기·로스팅', '으깨기·갈기',
  ]) {
    meal.foods[0].preparation = preparation;
    const written = prepareMealWrite(meal).body.foods[0];
    assert.equal(written.cooking_method, null);
    assert.equal(written.name, meal.foods[0].name);
    assert.equal(written.serving_note, 'Small pieces');
    assert.equal(meal.foods[0].preparation, preparation);
  }
});

test('새 식사 저장은 미입력을 유지하고 지원하지 않는 조리법을 거절한다', () => {
  const meal = toLegacyMeal(toMealDetail(mealResponse()));
  assert.equal(prepareMealWrite(meal).body.foods[0].cooking_method, null);
  for (const preparation of ['invalid', 'constructor', 'toString']) {
    meal.foods[0].preparation = preparation;
    assert.throws(() => prepareMealWrite(meal));
  }
});
