// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
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
  calendarCells, densityLevel,
  isoDate, mealDateParts, mealThumbnail, monthKey, shiftMonth,
  filterMealDetails, foodResponseCardsFromDetail, sortMealDetailsLatestFirst,
} = require('../src/features/meal-log/rules.ts');

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
  assert.equal(densityLevel(0), 0);
  assert.equal(densityLevel(1), 1);
  assert.equal(densityLevel(2), 2);
  assert.equal(densityLevel(5), 3);
});

test('meal thumbnail prefers the before photo', () => {
  assert.equal(mealThumbnail(rice), null);
  assert.equal(mealThumbnail(soup), 'file:///after.png');
  assert.equal(mealThumbnail({ beforePhotoUri: 'file:///before.png', afterPhotoUri: 'file:///after.png' }), 'file:///before.png');
});

test('server meal details drive history search, review filter, and linked suggestion cards', () => {
  const reviewed = {
    id: '8', userId: '2', mealDate: '2026-10-12', mealType: 'lunch', setting: 'home',
    beforePhotoUri: null, afterPhotoUri: null, savedAt: '2026-10-12T12:00:00Z',
    foods: [{ id: '4', mealId: '8', name: 'Rice', cookingMethod: null, servingNote: null,
      acceptance: null, ingredients: [{ id: '3', name: 'Egg' }] }],
    review: { foodResults: [{ foodId: '4', outcome: 'tasted', difficulties: [] }],
      ingredientResults: [{ foodId: '4', ingredientId: '3', outcome: 'eaten', difficulties: [] }] },
    suggestionLinks: [{ id: '10', suggestionId: '20', mealId: '8', foodId: '4', ingredientId: '3',
      suggestion: { whatToTry: 'Try egg', whyThisMayHelp: 'Familiar food', servingTip: 'Small piece' } }],
  };
  const pending = { ...reviewed, id: '9', review: null, suggestionLinks: [] };
  assert.deepEqual(sortMealDetailsLatestFirst([reviewed, pending]).map((meal) => meal.id), ['9', '8']);
  assert.deepEqual(filterMealDetails([reviewed, pending], 'egg', true).map((meal) => meal.id), ['9']);
  const cards = foodResponseCardsFromDetail(reviewed);
  assert.deepEqual(cards.map((card) => [card.kind, card.outcome]), [['food', 'tasted'], ['ingredient', 'eaten']]);
  assert.equal(cards[1].suggestion.title, 'Try egg');
  assert.equal(cards[1].suggestion.description, 'Familiar food');
});

test('meal history requests use the authenticated v1 collection and delete route', async () => {
  const api = require('../src/data/network/apiClient.ts');
  const { listMealDetails } = require('../src/data/api/mealReadApi.ts');
  const { deleteMealRecord } = require('../src/data/api/mealHistoryApi.ts');
  const original = api.apiRequest;
  const calls = [];
  api.apiRequest = async (path, init) => {
    calls.push([path, init?.method ?? 'GET']);
    return path === '/api/v1/meals' ? [] : undefined;
  };
  try {
    assert.deepEqual(await listMealDetails(), []);
    await deleteMealRecord('42');
    assert.deepEqual(calls, [['/api/v1/meals', 'GET'], ['/api/v1/meals/42', 'DELETE']]);
  } finally {
    api.apiRequest = original;
  }
});

test('meal date parts stay stable for a fixed ISO date', () => {
  const parts = mealDateParts('2026-10-12', 'en-US');
  assert.equal(parts.year, 2026);
  assert.match(parts.monthDay, /Oct/);
  assert.match(parts.weekday, /Mon/);
});
