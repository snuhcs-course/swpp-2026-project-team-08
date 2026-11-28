// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 상세 추천 진입의 서버 조회·실패 상태·공유 캐시 검증
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 식사별 조회 없이 시도에 연결된 추천 확인·복귀 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor } = require('../../helpers/meal-checkin-screen.cjs');
const { mealResponse } = require('../../fixtures/server-meal.cjs');

test('식사 상세에서 기존 시도에 연결된 추천을 확인하고 같은 음식으로 돌아온다', async t => {
  const meal = mealResponse();
  meal.foods[0].outcome = 'TASTED';
  meal.foods[0].recommendation_tries = [{
    id: '90', food_recommendation_id: '80', feedback: null,
    created_at: '2026-10-23T00:00:00Z', updated_at: '2026-10-23T00:00:00Z',
    recommendation: { what_to_try: 'Try soup', why_this_may_help: 'Familiar taste', serving_tip: null },
  }];
  const app = await mountMeal(t, { initialPath: '/meal/10', respond(path, method) {
    if (path === '/api/v1/meals/10' && method === 'GET') return Response.json(meal);
  } });
  await waitFor(() => control(app, 'button', 'Linked Suggestion'));
  assert.ok(app.container.textContent.includes('Before Image'));
  assert.ok(app.container.textContent.includes('Foods and responses'));
  assert.equal(app.container.textContent.includes('View Suggestion'), false);
  await click(control(app, 'button', 'Linked Suggestion'));
  assert.ok(app.container.textContent.includes('Try soup'));
  await click(control(app, 'button', 'Go back to meal'));
  assert.ok(control(app, 'button', 'Linked Suggestion'));
  assert.equal(app.pathname, '/meal/10');
});
