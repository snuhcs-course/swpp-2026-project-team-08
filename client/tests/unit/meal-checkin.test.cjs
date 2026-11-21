// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-17, reviewed by Haechan Jung
// Changed: 선택 장소 요구에 따라 필수 장소 거절 기대 제거

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { completeDraft } = require('../fixtures/meal-checkin.cjs');

const { confirmFoods, mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');

const { validDate } = require('../../src/util/date.ts');

const { isDraft } = require('../../src/data/storage/mealValidation.ts');

test('valid calendar dates', () => {
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2026-02-29'), false); assert.equal(validDate('2026-04-31'), false);
});

test('unconfirmed AI and incomplete/empty meals cannot be saved', () => {
  const draft = completeDraft('rules'); draft.foods[0].source = 'ai'; draft.foods[0].confirmed = false; assert.throws(() => mealFromDraft(draft));
  const foods = confirmFoods(draft.foods); assert.equal(foods[0].id, draft.foods[0].id); assert.equal(draft.foods[0].source, 'ai');
  assert.equal(mealFromDraft({ ...draft, foods }).foods[0].source, 'ai');
  assert.equal(foods[0].confirmed, true);
  assert.equal(draft.foods[0].confirmed, false);
  assert.equal(mealFromDraft({ ...draft, foods, setting: null }).setting, null);
  for (const patch of [{ foods: [] }, { mealType: null }, { mealDate: '2026-13-01' }]) assert.throws(() => mealFromDraft({ ...draft, foods, ...patch }));
});

test('stored input is validated, including child ownership and duplicate foods', () => {
  const draft = completeDraft('validate'); assert.equal(isDraft(draft, 'validate'), true); assert.equal(isDraft(draft, 'other-child'), false);
  assert.equal(isDraft({ ...draft, foods: [draft.foods[0], draft.foods[0]] }, 'validate'), false);
});
