// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 기본값 시간 경계·현지 날짜 검증
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { mealTypeAt, newDraft } = require('../../../src/features/meal-checkin/rules.ts');

const previousTimezone = process.env.TZ;
process.env.TZ = 'Asia/Seoul';
after(() => {
  if (previousTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = previousTimezone;
});

function assertTypeBoundary(hour, before, at) {
  assert.equal(mealTypeAt(new Date(2026, 10, 17, hour - 1, 59, 59, 999)), before);
  assert.equal(mealTypeAt(new Date(2026, 10, 17, hour)), at);
}

test('현지 05시 직전에는 간식, 05시부터는 아침을 기본 유형으로 정한다', () => {
  assertTypeBoundary(5, 'snack', 'breakfast');
});

test('현지 11시 직전에는 아침, 11시부터는 점심을 기본 유형으로 정한다', () => {
  assertTypeBoundary(11, 'breakfast', 'lunch');
});

test('현지 15시 직전에는 점심, 15시부터는 간식을 기본 유형으로 정한다', () => {
  assertTypeBoundary(15, 'lunch', 'snack');
});

test('현지 17시 직전에는 간식, 17시부터는 저녁을 기본 유형으로 정한다', () => {
  assertTypeBoundary(17, 'snack', 'dinner');
});

test('현지 22시 직전에는 저녁, 22시부터는 간식을 기본 유형으로 정한다', () => {
  assertTypeBoundary(22, 'dinner', 'snack');
});

test('새 초안은 UTC와 날짜가 달라도 현지 오늘·아침을 기본값으로 두고 장소는 비운다', () => {
  // UTC 전날 22시는 서울 다음 날 07시다.
  const draft = newDraft('1', new Date('2026-11-16T22:00:00Z'));
  assert.equal(draft.mealDate, '2026-11-17');
  assert.equal(draft.initialMealDate, '2026-11-17');
  assert.equal(draft.mealType, 'breakfast');
  assert.equal(draft.initialMealType, 'breakfast');
  assert.equal(draft.setting, null);
});
