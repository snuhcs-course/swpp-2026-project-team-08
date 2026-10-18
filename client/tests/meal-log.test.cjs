// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') {
    return { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined };
  }
  // AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
  if (name === 'expo-secure-store') {
    const store = {
      WHEN_UNLOCKED: 1,
      isAvailableAsync: async () => false,
      getItemAsync: async () => null,
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    };
    return { __esModule: true, ...store, default: store };
  }
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '127.0.0.1:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return originalLoad.call(this, name, ...args);
};

const {
  calendarCells, countsByDate, densityLevel, filterMeals, foodResponseCards,
  isoDate, matchesMealQuery, mealDateParts, mealThumbnail, monthKey, shiftMonth,
  sortMealsLatestFirst,
} = require('../src/features/meal-log/rules.ts');
const { emptyTraits } = require('../src/rules/foodDraft.ts');
const { mealToUpsertBody, reviewToBody, suggestionToBody } = require('../src/data/api/mealLogApi.ts');
const { demoMealCounts, demoMealDetail, demoMealList, mergeDemoMealList } = require('../src/data/api/mealLogFixtures.ts');
const { applySuggestionSaved } = require('../src/data/storage/homeStorage.ts');

const rice = {
  id: 'food-1',
  mealDate: '2026-10-12',
  mealType: 'breakfast',
  setting: 'home',
  beforePhotoUri: null,
  afterPhotoUri: null,
  foods: [{ name: 'Kimchi fried rice', ingredients: ['rice', 'kimchi'] }],
  reviewStatus: 'awaiting_review',
};
const soup = {
  id: 'food-2',
  mealDate: '2026-10-12',
  mealType: 'lunch',
  setting: 'school',
  beforePhotoUri: null,
  afterPhotoUri: 'file:///after.png',
  foods: [{ name: 'Seaweed soup', ingredients: ['seaweed'] }],
  reviewStatus: 'reviewed',
};

test('calendar uses Sunday-first weeks and ISO month keys', () => {
  const cells = calendarCells(2026, 9);
  assert.equal(cells[0].day, 27);
  assert.equal(cells[0].inMonth, false);
  assert.equal(cells[4].day, 1);
  assert.equal(cells[4].inMonth, true);
  assert.equal(cells[4].date, '2026-10-01');
  assert.equal(isoDate(2026, 9, 12), '2026-10-12');
  assert.equal(monthKey(2026, 9), '2026-10');
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(countsByDate([{ date: '2026-10-12', count: 2 }]), { '2026-10-12': 2 });
  assert.equal(densityLevel(0), 0);
  assert.equal(densityLevel(1), 1);
  assert.equal(densityLevel(2), 2);
  assert.equal(densityLevel(5), 3);
});

test('meal list sorts latest first and prefers the before photo thumbnail', () => {
  assert.deepEqual(sortMealsLatestFirst([rice, soup]).map((meal) => meal.id), ['food-2', 'food-1']);
  assert.equal(mealThumbnail(rice), null);
  assert.equal(mealThumbnail(soup), 'file:///after.png');
  assert.equal(mealThumbnail({ beforePhotoUri: 'file:///before.png', afterPhotoUri: 'file:///after.png' }), 'file:///before.png');
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
      outcomes: [{
        foodId: 'food-1',
        decision: { confirmed: 'tasted', suggested: 'tasted' },
        ingredients: [{ id: 'ing-egg', name: 'Egg', decision: { confirmed: 'tasted', suggested: null } }],
      }],
      difficulties: { 'food-1': [{ id: 'd1', category: 'texture', value: 'soft' }] },
    },
    [{ id: 'sug-1', foodId: 'food-1', title: 'Offer a small portion', description: 'Keep the same form', servingTip: 'Place separately' }],
  );
  assert.equal(cards[0].outcome, 'tasted');
  assert.deepEqual(cards[0].reasons, [{ category: 'texture', value: 'soft', note: undefined }]);
  assert.equal(cards[0].kind, 'food');
  assert.equal(cards[0].suggestion.id, 'sug-1');
  assert.equal(cards[0].suggestion.title, 'Offer a small portion');
  assert.equal(cards[1].kind, 'ingredient');
  assert.equal(cards[1].name, 'Egg');
  assert.equal(cards[1].parentName, 'Rice');
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
    savedAt: '2026-10-12T12:00:00.000Z',
  });
  assert.equal(body.meal_date, '2026-10-12');
  assert.equal(body.before_photo_uri, 'file:///before.png');
  assert.equal(body.foods[0].serving_note, 'small bowl');
  const review = reviewToBody({
    mealId: 'meal-1', childId: 'child-1',
    afterPhoto: { id: 'p2', uri: 'file:///after.png', mimeType: 'image/png' },
    comparisonMethod: 'manual', outcomes: [], difficulties: {}, suggestionFeedback: {},
    savedAt: '2026-10-12T13:00:00.000Z',
  });
  assert.equal(review.after_photo_uri, 'file:///after.png');
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

test('demo meals vary by day so the calendar can show different densities', () => {
  const counts = demoMealCounts('2026-10');
  assert.equal(counts['2026-10-09'], 1);
  assert.equal(counts['2026-10-12'], 2);
  assert.equal(counts['2026-10-16'], 2);
  assert.equal(counts['2026-10-17'], 3);
  assert.equal(counts['2026-10-21'], 1);
  assert.equal(counts['2026-10-24'], 3);
  assert.equal(demoMealList('2026-10-16').map((meal) => meal.mealType).sort().join(','), 'dinner,lunch');
  assert.equal(demoMealList('2026-10-17').length, 3);
  const remote = [{ ...rice, id: 'demo-2026-10-16-lunch', mealDate: '2026-10-16' }];
  assert.equal(mergeDemoMealList(remote, '2026-10-16').length, 2);
  const dinner = demoMealDetail('child-1', 'demo-2026-10-16-dinner');
  assert.equal(dinner.suggestions[0].id, 'sug-2026-10-16-dinner');
  assert.equal(dinner.suggestions[0].foodId, 'food-omelet');
  assert.equal(dinner.suggestions[0].title, 'Offer a smaller piece beside a familiar food.');
  assert.equal(dinner.suggestions[0].servingTip, 'Keep the slices thin and serve warm.');
});

// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
test('bookmarking a linked suggestion toggles the saved flag without dropping it on a later unsave', () => {
  const records = { meals: [], suggestions: [] };
  const draft = {
    id: 'sug-2026-10-16-dinner',
    title: 'Offer a smaller piece beside a familiar food.',
    description: 'Rolled omelet was eaten last time, so a similar texture may feel safer.',
    servingTip: 'Keep the slices thin and serve warm.',
    ingredients: ['Egg', 'Carrot'],
  };
  assert.equal(applySuggestionSaved(records, 'child-1', draft, true, 'v1'), true);
  assert.equal(records.suggestions[0].isSaved, true);
  assert.equal(applySuggestionSaved(records, 'child-1', draft, false, 'v1'), false);
  assert.equal(records.suggestions[0].isSaved, false);
  assert.equal(applySuggestionSaved(records, 'child-1', draft, true, 'v1'), true);
  assert.equal(records.suggestions[0].id, 'sug-2026-10-16-dinner');
});


// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
test('meal history food and ingredient cards preserve managed suggestion routing', () => {
  const food = {
    id: 'food-managed', name: 'Omelet', ingredients: ['Egg'], preparation: 'pan-fried',
    servingNote: '', traits: emptyTraits(), history: 'usually', source: 'parent',
  };
  const cards = foodResponseCards([food], {
    outcomes: [{ foodId: food.id, decision: { confirmed: 'tasted', suggested: null },
      ingredients: [{ id: 'ingredient-egg', name: 'Egg', decision: { confirmed: 'eaten', suggested: null } }],
    }], difficulties: {},
  }, [
    { managed: true, id: 'managed-food', foodId: food.id, title: 'Try a slice', description: 'Familiar form', servingTip: null },
    { managed: true, id: 'managed-ingredient', foodId: 'ingredient-egg', title: 'Try egg', description: 'Keep familiar', servingTip: 'Small piece' },
  ]);
  assert.deepEqual(cards.map((card) => [card.kind, card.foodId, card.suggestion.managed]), [
    ['food', 'food-managed', true], ['ingredient', 'ingredient-egg', true],
  ]);
  assert.equal(cards[1].parentName, 'Omelet');
  assert.equal(cards[1].outcome, 'eaten');
});
