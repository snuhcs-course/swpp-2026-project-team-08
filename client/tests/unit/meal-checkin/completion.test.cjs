// AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
// Changed: Photo persistence coverage and API runner instructions
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 mealLogApi 대신 prepareMealWrite 로 사진 저장 요청 검증
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 실제 서버 사진 저장 테스트 제거
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 저장 조건·장소 미응답·식전 사진 요청 검증을 완료 행동으로 분리

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { completeDraft } = require('../../fixtures/meal-checkin.cjs');

const { confirmFoods, mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');

const { prepareMealWrite } = require('../../../src/data/api/mealWriteApi.ts');
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

test('식사를 저장하면 선택한 식전 사진을 요청에 포함하고 사진이 없으면 미첨부로 보낸다', () => {
  const uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const draft = { ...completeDraft('photo'), photo: { id: 'before', uri, mimeType: 'image/png' } };
  const meal = mealFromDraft(draft);
  assert.equal(meal.photo.uri, uri);
  assert.equal(prepareMealWrite(meal).body.before_photo_uri, uri);
  assert.equal(prepareMealWrite({ ...meal, photo: null }).body.before_photo_uri, null);
});
