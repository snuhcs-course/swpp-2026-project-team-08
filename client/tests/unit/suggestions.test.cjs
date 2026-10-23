// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

let request;

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...args) => request(...args) };
  return undefined;
});

const {
  parseSuggestion,
  parseBatch,
  savedSuggestions,
  generateSuggestions,
  eligibleMeals,
  recordSuggestionTry,
  parseTry,
} = require('../../src/data/api/suggestionApi.ts');

const {
  canUpdateFoods,
  toggleFood,
  nextSuggestion,
  latestLinkedTry,
  suggestionTryChips,
  suggestionPreview,
} = require('../../src/features/suggestions/rules.ts');

const suggestion = {
  id: 's1',
  child_id: 'child',
  meal_id: 'meal',
  food_id: 'food',
  revision: 'v1',
  content: {
    food_id: 'food',
    food_name: 'Rice',
    ingredients: ['Rice'],
    preparation: '',
    meal_date: '2026-10-17',
    meal_type: 'lunch',
    what_to_try: 'Small portion.',
    why_this_may_help: 'Familiar presentation.',
    serving_tip: 'No pressure.',
    linked_reason: [],
  },
  status: 'pending',
  dismiss_reasons: [],
  saved_at: null,
  created_at: '2026-10-17T00:00:00Z',
  version: 0,
  tries: [],
};

test('food changes enforce one to three distinct choices and compare sets', () => {
  assert.equal(canUpdateFoods(['a', 'b'], ['b', 'a']), false);
  assert.equal(canUpdateFoods(['a'], []), false);
  assert.equal(canUpdateFoods(['a'], ['a', 'a']), false);
  assert.equal(canUpdateFoods(['a'], ['b']), true);
  assert.deepEqual(toggleFood(['a', 'b', 'c'], 'd'), ['a', 'b', 'c']);
  assert.deepEqual(toggleFood(['a', 'b', 'c'], 'b'), ['a', 'c']);
});

test('resumes the next pending card, with terminal completion persisted in statuses', () => {
  const batch = { items: [{ ...suggestion, id: 'old', status: 'saved' }, suggestion] };
  assert.equal(nextSuggestion(batch).id, 's1');
  assert.equal(
    nextSuggestion({ items: batch.items.map((i) => ({ ...i, status: 'dismissed' })) }),
    null,
  );
});

test('rejects incomplete, duplicate, mismatched, and empty generator responses', () => {
  const batch = { revision: 'v1', selected_food_ids: ['food'], items: [suggestion] };
  assert.equal(parseBatch(batch).items.length, 1);
  assert.throws(() => parseBatch({ ...batch, items: [] }));
  assert.throws(() => parseBatch({ ...batch, selected_food_ids: ['wrong'] }));
  assert.throws(() =>
    parseBatch({ ...batch, selected_food_ids: ['food', 'food'], items: [suggestion, suggestion] }),
  );
  assert.throws(() =>
    parseSuggestion({ ...suggestion, content: { ...suggestion.content, serving_tip: ' ' } }),
  );
});

test('saved queries reject another child, and network failures remain visible', async () => {
  request = async () => [{ ...suggestion, saved_at: suggestion.created_at, child_id: 'other' }];
  await assert.rejects(savedSuggestions('child'));
  request = async () => {
    throw new Error('offline');
  };
  await assert.rejects(savedSuggestions('child'), /offline/);
  await assert.rejects(eligibleMeals('child', 's1'), /offline/);
});

test('generation has cancellation and preserves selected IDs at the API boundary', async () => {
  let body;
  request = async (url, init) => {
    body = JSON.parse(init.body);
    assert.ok(init.signal);
    return { revision: 'v1', selected_food_ids: ['food'], items: [suggestion] };
  };
  await generateSuggestions('child', 'meal', ['food']);
  assert.deepEqual(body.selected_food_ids, ['food']);
  const controller = new AbortController();
  controller.abort();
  request = async (_, init) => {
    assert.equal(init.signal.aborted, true);
    throw new Error('aborted');
  };
  await assert.rejects(
    generateSuggestions('child', 'meal', undefined, controller.signal),
    /aborted/,
  );
});

test('try requests carry exactly one food or tracked ingredient target', async () => {
  request = async (_, init) => {
    assert.deepEqual(JSON.parse(init.body), {
      meal_id: 'new-meal',
      target_id: 'ingredient:food:rice',
    });
    return {
      id: 'try1',
      meal_id: 'new-meal',
      target_id: 'ingredient:food:rice',
      tried_on: '2026-10-17',
      meal_type: 'lunch',
      feedback: null,
      linked_available: true,
    };
  };
  assert.equal(
    (await recordSuggestionTry('child', 's1', 'new-meal', 'ingredient:food:rice')).id,
    'try1',
  );
});

test('saved list date ignores deleted meals and previews only the first sentence', () => {
  const item = {
    ...suggestion,
    tries: [
      { tried_on: '2026-10-16', linked_available: true, meal_id: 'first' },
      { tried_on: '2026-10-17', linked_available: false, meal_id: 'deleted' },
    ],
  };
  assert.equal(latestLinkedTry(item).meal_id, 'first');
  assert.equal(suggestionPreview('Try this. Another sentence.'), 'Try this.');
});

test('trial chips retain every trial and distinguish only dates with multiple trials', () => {
  const tries = [
    { id: 'older', tried_on: '2026-10-15', meal_id: 'old-meal', meal_type: 'dinner', linked_available: true },
    { id: 'lunch', tried_on: '2026-10-17', meal_id: 'lunch-meal', meal_type: 'lunch', linked_available: true },
    { id: 'dinner', tried_on: '2026-10-17', meal_id: 'dinner-meal', meal_type: 'dinner', linked_available: true },
    { id: 'deleted', tried_on: '2026-10-16', meal_id: 'deleted-meal', meal_type: null, linked_available: false },
  ];
  const chips = suggestionTryChips(tries);
  assert.deepEqual(chips.map(({ trial }) => trial.id), ['lunch', 'dinner', 'deleted', 'older']);
  assert.deepEqual(chips.map(({ showMealType }) => showMealType), [true, true, false, false]);
  assert.deepEqual(tries.map((trial) => trial.id), ['older', 'lunch', 'dinner', 'deleted']);
  assert.deepEqual(suggestionTryChips([]), []);
  assert.equal(suggestionTryChips([tries[0]])[0].showMealType, false);
});

test('trial API preserves meal type and rejects invalid meal types', () => {
  const trial = {
    id: 'try', meal_id: 'meal', target_id: 'food:rice', tried_on: '2026-10-17',
    feedback: null, linked_available: true, meal_type: 'lunch',
  };
  assert.equal(parseTry(trial).meal_type, 'lunch');
  assert.equal(parseSuggestion({ ...suggestion, tries: [trial] }).tries[0].meal_type, 'lunch');
  assert.equal(parseTry({ ...trial, linked_available: false, meal_type: null }).meal_type, null);
  assert.throws(() => parseTry({ ...trial, meal_type: 'unknown' }));
});
