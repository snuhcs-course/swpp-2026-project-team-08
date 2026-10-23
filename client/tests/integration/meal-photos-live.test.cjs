// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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
    source: 'parent', confirmed: true,
  };
  const mealRes = await fetch(`${api}/api/v1/children/${encodeURIComponent(childId)}/meals/${encodeURIComponent(mealId)}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meal_date: '2026-10-15',
      meal_type: 'lunch',
      setting: 'home',
      before_photo_uri: PNG,
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
