// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 조리법 저장·재조회·번역 및 기타 기록 미입력 처리 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
require('../helpers/mock-modules.cjs').mockModules(name => name.endsWith('/network/apiClient')
  ? { apiRequest: () => { throw new Error('Unexpected HTTP'); } } : undefined);
const { cookingMethodIds, normalizeCookingMethod, cookingMethodLabel } = require('../../src/util/cookingMethods.ts');
const { abcCopyFor } = require('../../src/util/strings.ts');
const { prepareMealWrite, cookingMethodFor } = require('../../src/data/api/mealWriteApi.ts');
const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../src/data/dto/mealLegacyDto.ts');
const { mealResponse } = require('../fixtures/server-meal.cjs');

test('저장된 조리법은 재조회와 언어 전환 후에도 같은 의미를 유지한다', () => {
  const expected = ['raw','boiled','steamed','pan_fried','stir_fried','baked_roasted','mashed_blended'];
  assert.deepEqual([...cookingMethodIds], expected);
  assert.deepEqual(abcCopyFor('en').cookingOptions, ['Raw/unheated','Boiled','Steamed','Pan-fried','Stir-fried','Baked/roasted','Mashed/blended']);
  for (const language of ['en','ko']) {
    const labels = abcCopyFor(language).cookingOptions;
    assert.equal(labels.length,7);
    for (const [index,id] of expected.entries()) {
      const response = mealResponse();
      const meal = toLegacyMeal(toMealDetail(response));
      meal.foods[0].preparation = id;
      const body = prepareMealWrite(meal).body;
      assert.equal(body.foods[0].cooking_method,id.toUpperCase());
      response.foods[0].cooking_method = body.foods[0].cooking_method;
      const restored = toLegacyMeal(toMealDetail(response)).foods[0].preparation;
      assert.equal(restored,id);
      assert.equal(cookingMethodLabel(restored,abcCopyFor(language)),labels[index]);
      assert.equal(cookingMethodFor(labels[index]),id);
    }
  }
});
test('old localized drafts keep their meaning while unknown values cannot be saved', () => {
  for (const value of ['Baked','Roasted','오븐에 굽기','로스팅']) {
    assert.equal(normalizeCookingMethod(value),'baked_roasted');
    assert.equal(cookingMethodLabel(value,abcCopyFor('en')),'Baked/roasted');
  }
  assert.equal(cookingMethodFor('Grilled'),null);
  assert.equal(cookingMethodFor(''),null);
  for (const value of ['invalid','constructor','toString']) assert.throws(()=>cookingMethodFor(value));
  assert.equal(cookingMethodLabel('custom',abcCopyFor('en')),'custom');
});


test('기타로 기록된 음식은 조리법 미입력으로 표시하고 저장한다', () => {
  const response = mealResponse();
  response.foods[0].cooking_method = 'OTHER';
  response.foods[0].outcome = 'UNTOUCHED';
  const detail = toMealDetail(response);
  assert.equal(detail.foods[0].cookingMethod, null);
  assert.equal(detail.review.foodResults[0].foodSnapshot.cookingMethod, null);
  const meal = toLegacyMeal(detail);
  assert.equal(cookingMethodLabel(meal.foods[0].preparation, abcCopyFor('en')), '');
  assert.equal(cookingMethodLabel(meal.foods[0].preparation, abcCopyFor('ko')), '');
  assert.equal(prepareMealWrite(meal).body.foods[0].cooking_method, null);
});


test('기존 초안의 기타 조리법은 저장 요청에서 미입력으로 정리한다', () => {
  for (const preparation of ['other', 'OTHER', 'Other', '기타', 'Grilled', '직화 구이']) {
    const meal = toLegacyMeal(toMealDetail(mealResponse()));
    meal.foods[0].preparation = preparation;
    assert.equal(cookingMethodLabel(preparation, abcCopyFor('en')), '');
    assert.equal(prepareMealWrite(meal).body.foods[0].cooking_method, null);
  }
});
