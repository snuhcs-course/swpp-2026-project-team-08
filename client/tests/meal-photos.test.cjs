// AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
// Changed: Photo persistence coverage and API runner instructions
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
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

const { newDraft, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { newReviewDraft, setOutcome, reviewFromDraft } = require('../src/features/after-meal-review/rules.ts');
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
  draft.foods = [{ ...newFood(), id: 'food-1', name: 'Rice', ingredients: ['Egg'], source: 'parent', confirmed: true }];
  draft.step = 'foods';
  return mealFromDraft(draft);
}
test('saving a meal keeps the before photo; manual after-meal review may omit its photo', () => {
  const meal = mealWithBeforePhoto();
  assert.equal(meal.photo.uri, PNG);
  assert.equal(mealToUpsertBody(meal).before_photo_uri, PNG);
  assert.equal(mealToUpsertBody({ ...meal, photo: null }).before_photo_uri, null);

  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  for (const ingredient of draft.outcomes[0].ingredients) {
    draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted', ingredient.id);
  }
  assert.equal(reviewFromDraft(draft, meal).afterPhoto, null);
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
  } catch (error) {
    if (process.env.API_URL) throw error;
    t.skip('API is not running; run uv run python -m tests.run_client_integration from server/');
    return;
  }
  assert.equal(health.status, 200, 'API health check failed');
  process.env.EXPO_PUBLIC_API_URL = api;

  const { signUpAccount, loginAccount, deleteAccount } = require('../src/data/api/authApi.ts');
  const { saveSession, clearSession } = require('../src/data/storage/authStorage.ts');
  const { apiRequest, ApiError } = require('../src/data/network/apiClient.ts');
  const { writeMeal } = require('../src/data/api/mealWriteApi.ts');
  const { getMealDetail } = require('../src/data/api/mealReadApi.ts');
  const { writeMealReview } = require('../src/data/api/mealReviewApi.ts');
  const email = `photo-test-${require('node:crypto').randomUUID()}@example.com`;
  const password = 'integration-test-password';
  const user = await signUpAccount({ email, password, fullName: 'Photo test caregiver' });
  const tokens = await loginAccount({ email, password });
  await saveSession({ ...tokens, user });
  t.after(async () => {
    try { await deleteAccount(); } finally { await clearSession(); }
  });

  const saved = await writeMeal(mealWithBeforePhoto(user.id));
  const detail = await getMealDetail(saved.id);
  assert.equal(detail.beforePhotoUri, PNG);
  assert.equal(detail.afterPhotoUri, null);
  assert.equal(detail.review, null);
  assert.equal(detail.foods[0].ingredients[0].name, 'Egg');

  await assert.rejects(apiRequest(`/api/v1/meals/${saved.id}/review`, {
    method: 'PUT',
    body: JSON.stringify({ after_photo_uri: null, food_results: [] }),
  }), (error) => error instanceof ApiError && error.status === 422);
  assert.equal((await getMealDetail(saved.id)).review, null);

  const draft = newReviewDraft(saved);
  const foodId = saved.foods[0].id;
  draft.outcomes = setOutcome(draft.outcomes, foodId, 'eaten');
  const ingredientId = draft.outcomes[0].ingredients[0].id;
  draft.outcomes = setOutcome(draft.outcomes, foodId, 'tasted', ingredientId);
  draft.afterPhoto = afterPhoto;
  const reviewed = await writeMealReview(reviewFromDraft(draft, saved), detail);
  assert.equal(reviewed.beforePhotoUri, PNG);
  assert.equal(reviewed.afterPhotoUri, afterPhoto.uri);
  assert.equal(reviewed.review.foodResults[0].outcome, 'eaten');
  assert.equal(reviewed.review.ingredientResults[0].outcome, 'tasted');
  const restored = await getMealDetail(saved.id);
  assert.equal(restored.beforePhotoUri, PNG);
  assert.equal(restored.afterPhotoUri, afterPhoto.uri);
  assert.deepEqual(restored.review, reviewed.review);

  await apiRequest(`/api/v1/meals/${saved.id}`, { method: 'DELETE' });
  await assert.rejects(getMealDetail(saved.id), (error) => error instanceof ApiError && error.status === 404);
});
