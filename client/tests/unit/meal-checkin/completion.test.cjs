// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 저장 조건과 장소 미응답 요청·응답 검증을 완료 행동으로 분리

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { completeDraft } = require('../../fixtures/meal-checkin.cjs');

const { confirmFoods, mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');

const { toMealWrite, toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { mealResponse } = require('../../fixtures/server-meal.cjs');

test('확인하지 않은 자동 생성 음식·빈 음식 목록·미선택 식사 유형·잘못된 날짜는 저장을 거부한다', () => {
  const draft = completeDraft('rules'); draft.foods[0].source = 'ai'; draft.foods[0].confirmed = false; assert.throws(() => mealFromDraft(draft));
  const foods = confirmFoods(draft.foods); assert.equal(foods[0].id, draft.foods[0].id); assert.equal(draft.foods[0].source, 'ai');
  assert.equal(mealFromDraft({ ...draft, foods }).foods[0].source, 'ai');
  assert.equal(foods[0].confirmed, true);
  assert.equal(draft.foods[0].confirmed, false);
  assert.equal(mealFromDraft({ ...draft, foods, setting: null }).setting, null);
  for (const patch of [{ foods: [] }, { mealType: null }, { mealDate: '2026-13-01' }]) assert.throws(() => mealFromDraft({ ...draft, foods, ...patch }));
});

test('장소를 선택하지 않으면 저장 요청에서도 장소를 미응답으로 유지한다', () => {
  const body = toMealWrite({
    mealDate: '2026-11-17', mealType: 'lunch', setting: null, beforePhotoUri: null,
    foods: [{ id: 'local-food', name: 'Rice', ingredients: [], cookingMethod: null,
      servingNote: null, acceptance: null }], suggestionLinks: [],
  });
  assert.equal(body.setting, null);
  assert.equal(body.meal_date, '2026-11-17');
  assert.equal(body.meal_type, 'LUNCH');
});

test('서버에서 받은 장소 미응답은 식사 기록과 화면에서도 미응답으로 유지한다', () => {
  const detail = toMealDetail({ ...mealResponse(), setting: null });
  assert.equal(detail.setting, null);
  assert.equal(toLegacyMeal(detail).setting, null);
});
