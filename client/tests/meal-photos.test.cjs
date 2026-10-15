// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim
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
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '127.0.0.1:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return originalLoad.call(this, name, ...args);
};

const { newDraft, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { newReviewDraft, setOutcome, reviewFromDraft } = require('../src/features/after-meal-review/rules.ts');
const { recognizeMealPhoto } = require('../src/data/api/recognitionApi.ts');
const { compareMealPhotos } = require('../src/data/api/afterMealComparisonApi.ts');
const { mealToUpsertBody, reviewToBody } = require('../src/data/api/mealLogApi.ts');

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const beforePhoto = { id: 'before-1', uri: PNG, mimeType: 'image/png' };
const afterPhoto = { id: 'after-1', uri: 'file:///after.png', mimeType: 'image/png' };

function mealWithBeforePhoto(childId = 'child-photo') {
  const draft = newDraft(childId);
  draft.mealType = 'lunch';
  draft.setting = 'home';
  draft.photo = beforePhoto;
  draft.foods = [{ ...newFood(), id: 'food-1', name: 'Rice', ingredients: ['Egg'], source: 'parent' }];
  draft.step = 'goal';
  return mealFromDraft(draft);
}

test('before-meal photo recognition accepts an image and rejects a non-image', async () => {
  const result = await recognizeMealPhoto({ photo: beforePhoto, signal: new AbortController().signal });
  assert.equal(result.photoId, beforePhoto.id);
  assert.equal(result.foods[0].source, 'ai');
  await assert.rejects(
    recognizeMealPhoto({
      photo: { id: 'bad', uri: '', mimeType: 'application/pdf' },
      signal: new AbortController().signal,
    }),
    /Invalid photo/,
  );
});

test('after-meal comparison needs both photos and does not invent consumption', async () => {
  const meal = mealWithBeforePhoto();
  const result = await compareMealPhotos({
    mealId: meal.id,
    before: meal.photo,
    after: afterPhoto,
    foods: meal.foods,
    signal: new AbortController().signal,
  });
  assert.equal(result.beforePhotoId, beforePhoto.id);
  assert.equal(result.afterPhotoId, afterPhoto.id);
  assert.equal(result.suggestions.every((item) => item.outcome === 'unclear'), true);
  await assert.rejects(compareMealPhotos({
    mealId: meal.id,
    before: { ...beforePhoto, uri: '' },
    after: afterPhoto,
    foods: meal.foods,
    signal: new AbortController().signal,
  }));
  await assert.rejects(compareMealPhotos({
    mealId: meal.id,
    before: meal.photo,
    after: { ...afterPhoto, uri: '' },
    foods: meal.foods,
    signal: new AbortController().signal,
  }));
});

test('saving a meal keeps the before photo; the after-meal review requires an after photo', () => {
  const meal = mealWithBeforePhoto();
  assert.equal(meal.photo.uri, PNG);
  assert.equal(mealToUpsertBody(meal).before_photo_uri, PNG);
  assert.equal(mealToUpsertBody({ ...meal, photo: null }).before_photo_uri, null);

  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  for (const ingredient of draft.outcomes[0].ingredients) {
    draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted', ingredient.id);
  }
  assert.throws(() => reviewFromDraft(draft, meal), /photo/);
  draft.afterPhoto = afterPhoto;
  const review = reviewFromDraft(draft, meal);
  assert.equal(review.afterPhoto.id, afterPhoto.id);
  assert.equal(reviewToBody(review).after_photo_uri, afterPhoto.uri);
});

test('live API stores a before-meal photo then an after-meal photo', async (t) => {
  const api = process.env.API_URL || 'http://127.0.0.1:8000';
  let health;
  try {
    health = await fetch(`${api}/health`);
  } catch {
    t.skip('API is not running');
    return;
  }
  if (!health.ok) {
    t.skip('API health check failed');
    return;
  }

  const childId = `photo-test-${Date.now()}`;
  const mealId = `meal-${Date.now()}`;
  const food = {
    id: 'food-1',
    name: 'Rice',
    ingredients: ['Egg'],
    preparation: '',
    serving_note: '',
    traits: {
      texture: [], tasteType: [], tasteIntensity: [], smell: [],
      shape: [], visibility: [], temperature: [], color: [],
    },
    history: null,
    source: 'parent',
  };
  const mealRes = await fetch(`${api}/api/v1/children/${encodeURIComponent(childId)}/meals/${encodeURIComponent(mealId)}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meal_date: '2026-10-15',
      meal_type: 'lunch',
      setting: 'home',
      before_photo_uri: PNG,
      exposure_food_id: 'food-1',
      saved_at: new Date().toISOString(),
      foods: [food],
    }),
  });
  const mealText = await mealRes.text();
  assert.equal(mealRes.status, 200, mealText);
  const savedMeal = JSON.parse(mealText);
  assert.equal(savedMeal.before_photo_uri, PNG);
  assert.equal(savedMeal.review, null);

  const emptyReview = await fetch(`${api}/api/v1/children/${encodeURIComponent(childId)}/meals/${encodeURIComponent(mealId)}/review`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      after_photo_uri: '',
      outcomes: [],
      difficulties: {},
      goal_feedback: 'tried',
      saved_at: new Date().toISOString(),
    }),
  });
  assert.equal(emptyReview.status, 422);

  const afterUri = 'file:///meal-photos/after.png';
  const reviewRes = await fetch(`${api}/api/v1/children/${encodeURIComponent(childId)}/meals/${encodeURIComponent(mealId)}/review`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      after_photo_uri: afterUri,
      outcomes: [{
        food_id: 'food-1',
        decision: { confirmed: 'eaten', suggested: 'unclear' },
        ingredients: [{ id: 'ing-egg', name: 'Egg', decision: { confirmed: 'tasted', suggested: null } }],
      }],
      difficulties: { 'food-1': [] },
      goal_feedback: 'tried',
      saved_at: new Date().toISOString(),
    }),
  });
  const reviewText = await reviewRes.text();
  assert.equal(reviewRes.status, 200, reviewText);
  const reviewed = JSON.parse(reviewText);
  assert.equal(reviewed.before_photo_uri, PNG);
  assert.equal(reviewed.review.after_photo_uri, afterUri);

  const detailRes = await fetch(`${api}/api/v1/children/${encodeURIComponent(childId)}/meals/${encodeURIComponent(mealId)}`);
  assert.equal(detailRes.status, 200);
  const detail = await detailRes.json();
  assert.equal(detail.before_photo_uri, PNG);
  assert.equal(detail.review.after_photo_uri, afterUri);

  const deleted = await fetch(`${api}/api/v1/children/${encodeURIComponent(childId)}/meals/${encodeURIComponent(mealId)}`, {
    method: 'DELETE',
  });
  assert.equal(deleted.status, 204);
});
