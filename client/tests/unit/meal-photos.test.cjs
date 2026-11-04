// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 mealLogApi 대신 prepareMealWrite 로 사진 저장 요청 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
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
  return undefined;
});

const { newDraft, mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');

const { newFood } = require('../../src/rules/foodDraft.ts');

const { newReviewDraft, setOutcome, reviewFromDraft } = require('../../src/features/after-meal-review/rules.ts');

const { prepareMealWrite } = require('../../src/data/api/mealWriteApi.ts');

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
  assert.equal(prepareMealWrite(meal).body.before_photo_uri, PNG);
  assert.equal(prepareMealWrite({ ...meal, photo: null }).body.before_photo_uri, null);

  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  for (const ingredient of draft.outcomes[0].ingredients) {
    draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted', ingredient.id);
  }
  assert.equal(reviewFromDraft(draft, meal).afterPhoto, null);
  draft.afterPhoto = afterPhoto;
  const review = reviewFromDraft(draft, meal);
  assert.equal(review.afterPhoto.id, afterPhoto.id);
  assert.equal(review.afterPhoto.uri, afterPhoto.uri);
});
