const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);

const {
  calendarCells, countsByDate, densityLevel, filterMeals, foodResponseCards,
  isoDate, matchesMealQuery, mealDateParts, monthKey, shiftMonth,
} = require('../src/features/meal-log/rules.ts');
const { emptyTraits } = require('../src/rules/foodDraft.ts');
const { mealToUpsertBody, reviewToBody, suggestionToBody } = require('../src/data/api/mealLogApi.ts');

const rice = {
  id: 'food-1',
  mealDate: '2026-10-12',
  mealType: 'breakfast',
  setting: 'home',
  beforePhotoUri: null,
  foods: [{ name: 'Kimchi fried rice', ingredients: ['rice', 'kimchi'] }],
  reviewStatus: 'awaiting_review',
};
const soup = {
  id: 'food-2',
  mealDate: '2026-10-12',
  mealType: 'lunch',
  setting: 'school',
  beforePhotoUri: null,
  foods: [{ name: 'Seaweed soup', ingredients: ['seaweed'] }],
  reviewStatus: 'reviewed',
};

test('calendar uses Sunday-first weeks and ISO month keys', () => {
  const cells = calendarCells(2026, 9);
  assert.equal(cells[4], 1);
  assert.equal(isoDate(2026, 9, 12), '2026-10-12');
  assert.equal(monthKey(2026, 9), '2026-10');
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(countsByDate([{ date: '2026-10-12', count: 2 }]), { '2026-10-12': 2 });
  assert.equal(densityLevel(0), 0);
  assert.equal(densityLevel(1), 1);
  assert.equal(densityLevel(2), 2);
  assert.equal(densityLevel(5), 3);
});

test('frontend search matches food names or ingredients and can hide reviewed meals', () => {
  assert.equal(matchesMealQuery(rice, 'KIMCHI'), true);
  assert.equal(matchesMealQuery(rice, 'seaweed'), false);
  assert.equal(filterMeals([rice, soup], '', false).length, 2);
  assert.deepEqual(filterMeals([rice, soup], 'rice', false).map((meal) => meal.id), ['food-1']);
  assert.deepEqual(filterMeals([rice, soup], '', true).map((meal) => meal.id), ['food-1']);
  assert.deepEqual(filterMeals([rice, soup], 'soup', true), []);
});

test('food cards join stored outcomes, difficulties, and linked suggestions', () => {
  const food = {
    id: 'food-1', name: 'Rice', ingredients: ['rice'], preparation: 'steamed', servingNote: '',
    traits: emptyTraits(), history: 'usually', source: 'parent',
  };
  const cards = foodResponseCards(
    [food],
    {
      outcomes: [{ foodId: 'food-1', decision: { confirmed: 'tasted', suggested: 'tasted' }, ingredients: [] }],
      difficulties: { 'food-1': [{ id: 'd1', category: 'texture', value: 'soft' }] },
    },
    [{ foodId: 'food-1', title: 'Offer a small portion', description: 'Keep the same form', servingTip: 'Place separately' }],
  );
  assert.equal(cards[0].outcome, 'tasted');
  assert.deepEqual(cards[0].reasons, [{ category: 'texture', value: 'soft', note: undefined }]);
  assert.equal(cards[0].suggestion.title, 'Offer a small portion');
  assert.equal(foodResponseCards([food], null, [])[0].outcome, null);
});

test('meal date parts stay stable for a fixed ISO date', () => {
  const parts = mealDateParts('2026-10-12', 'en-US');
  assert.equal(parts.year, 2026);
  assert.match(parts.monthDay, /Oct/);
  assert.match(parts.weekday, /Mon/);
});

test('upsert, review, and suggestion bodies use the server field names', () => {
  const body = mealToUpsertBody({
    id: 'meal-1', childId: 'child-1', mealDate: '2026-10-12', mealType: 'lunch', setting: 'home',
    photo: { id: 'p1', uri: 'file:///before.png', mimeType: 'image/png' },
    foods: [{
      id: 'food-1', name: 'Rice', ingredients: ['rice'], preparation: 'steamed', servingNote: 'small bowl',
      traits: emptyTraits(), history: 'usually', source: 'parent',
    }],
    exposureFoodId: 'food-1', savedAt: '2026-10-12T12:00:00.000Z',
  });
  assert.equal(body.meal_date, '2026-10-12');
  assert.equal(body.before_photo_uri, 'file:///before.png');
  assert.equal(body.foods[0].serving_note, 'small bowl');
  const review = reviewToBody({
    mealId: 'meal-1', childId: 'child-1',
    afterPhoto: { id: 'p2', uri: 'file:///after.png', mimeType: 'image/png' },
    comparisonMethod: 'manual', outcomes: [], difficulties: {}, goalFeedback: null, suggestionFeedback: {},
    savedAt: '2026-10-12T13:00:00.000Z',
  });
  assert.equal(review.after_photo_uri, 'file:///after.png');
  assert.equal(review.goal_feedback, null);
  const suggestion = suggestionToBody({
    id: 's1', childId: 'child-1', title: 'Try rice', description: 'Small separate portion',
    servingTip: 'Keep the form', ingredients: ['rice'], isSaved: true, safetyVerifiedForProfileAt: 'v1',
    recommendation: {
      mealId: 'meal-1', foodId: 'food-1', foodName: 'Rice', foodFormKey: 'rice',
      reviewSavedAt: '2026-10-12T13:00:00.000Z', outcome: 'tasted', kind: 'small-separate-portion',
    },
  });
  assert.equal(suggestion.food_id, 'food-1');
  assert.equal(suggestion.serving_tip, 'Keep the form');
});
