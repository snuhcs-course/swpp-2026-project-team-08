// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: Wiki 조리법 8개·기존 초안 호환·저장 재조회 및 번역 검증
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

test('Wiki eight methods retain their ID through serialization, reload and either display language', () => {
  const expected = ['raw','boiled','steamed','pan_fried','stir_fried','baked_roasted','mashed_blended','other'];
  assert.deepEqual([...cookingMethodIds], expected);
  assert.deepEqual(abcCopyFor('en').cookingOptions, ['Raw/unheated','Boiled','Steamed','Pan-fried','Stir-fried','Baked/roasted','Mashed/blended','Other']);
  for (const language of ['en','ko']) {
    const labels = abcCopyFor(language).cookingOptions;
    assert.equal(labels.length,8);
    for (const [index,id] of expected.entries()) {
      const response = mealResponse();
      const meal = toLegacyMeal(toMealDetail(response));
      meal.foods[0].preparation = id;
      const body = prepareMealWrite(meal).body;
      assert.equal(body.foods[0].cooking_method,id.toUpperCase());
      response.foods[0].cooking_method = body.foods[0].cooking_method;
      const restored = toLegacyMeal(toMealDetail(response)).foods[0].preparation;
      assert.equal(restored,id);
      assert.equal(cookingMethodLabel(restored,labels),labels[index]);
      assert.equal(cookingMethodFor(labels[index]),id);
    }
  }
});
test('old localized drafts keep their meaning while unknown values cannot be saved', () => {
  for (const value of ['Baked','Roasted','오븐에 굽기','로스팅']) {
    assert.equal(normalizeCookingMethod(value),'baked_roasted');
    assert.equal(cookingMethodLabel(value,abcCopyFor('en').cookingOptions),'Baked/roasted');
  }
  assert.equal(cookingMethodFor('Grilled'),'other');
  assert.equal(cookingMethodFor(''),null);
  for (const value of ['invalid','constructor','toString']) assert.throws(()=>cookingMethodFor(value));
  assert.equal(cookingMethodLabel('custom',abcCopyFor('en').cookingOptions),'custom');
});
