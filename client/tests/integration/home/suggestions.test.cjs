// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 추천 조회·실패 복구·캐시 공유와 사용자 전환 검증
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 진입·중복 탭·재진입·부족한 정보·조회 실패 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, act, waitFor, deferred } = require('../../helpers/meal-checkin-screen.cjs');
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { profileResponse } = require('../../fixtures/account-profile.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');

const getSuggestion = app => control(app, 'button', 'Get a suggestion');

test('홈 추천 버튼은 식후 리뷰 전에도 추천 한 장을 열고 홈으로 돌아온 뒤 새로 열 수 있다', async t => {
  let requests = 0;
  const app = await mountMeal(t, { initialPath: '/home', meals: [mealResponse()], respond(path, method, init) {
    if (path === '/api/v1/suggestions' && method === 'POST') {
      assert.equal(init.body, undefined);
      requests++;
      return Response.json(suggestionResponse({ id: String(requests), meal_id: null, origin_food_id: null,
        food_name: 'Potato mash', serving_tip: 'Serve it warm.' }));
    }
  } });
  await waitFor(() => app.container.textContent.includes('Awaiting review'));
  assert.equal(requests, 0);
  const button = getSuggestion(app);
  await act(async () => { button.click(); button.click(); });
  await waitFor(() => app.pathname === '/recommendation' && app.container.textContent.includes('Potato mash'));
  assert.equal(requests, 1);
  await click(control(app, 'button', 'Back to Home'));
  await waitFor(() => app.pathname === '/home' && getSuggestion(app));
  assert.equal(requests, 1);
  await click(getSuggestion(app));
  await waitFor(() => app.pathname === '/recommendation' && app.container.textContent.includes('Potato mash'));
  assert.equal(requests, 2);
});

for (const [title, meals, restrictions, reason] of [
  ['알레르기 미응답', [mealResponse()], ['VEGETARIAN.EGGS'], 'Answer the food allergy question'],
  ['식사 없음', [], ['ALLERGY.NONE'], 'Log a meal with at least one food'],
  ['음식 없는 식사만 있음', [{ ...mealResponse(), foods: [] }], ['ALLERGY.NONE'], 'Log a meal with at least one food'],
]) {
  test(`${title}이면 홈에서 부족한 정보를 안내한다`, async t => {
    const app = await mountMeal(t, { initialPath: '/home', meals, respond(path, method) {
      if (method === 'GET' && path === '/api/v1/onboarding') {
        const profile = profileResponse();
        profile.profile.restrictions = restrictions;
        return Response.json(profile);
      }
    } });
    await waitFor(() => getSuggestion(app).getAttribute('aria-disabled') !== 'true');
    await click(getSuggestion(app));
    assert.ok(app.container.querySelector('[role="alert"]').textContent.includes(reason));
    assert.equal(app.pathname, '/home');
  });
}

test('식사 조회 중이거나 처음 조회에 실패하면 빈 기록 안내 대신 로딩·재시도를 제공한다', async t => {
  const pending = deferred();
  let reads = 0;
  const app = await mountMeal(t, { initialPath: '/home', respond(path, method) {
    if (method === 'GET' && path === '/api/v1/meals') {
      return ++reads === 1 ? pending.promise : Response.json([mealResponse()]);
    }
  } });
  await waitFor(() => getSuggestion(app));
  assert.equal(getSuggestion(app).getAttribute('aria-disabled'), 'true');
  await act(async () => pending.resolve(Response.json({}, { status: 503 })));
  await waitFor(() => control(app, 'button', 'Retry'));
  assert.equal(getSuggestion(app).getAttribute('aria-disabled'), 'true');
  assert.doesNotMatch(app.container.textContent, /Log a meal with at least one food/);
  await click(control(app, 'button', 'Retry'));
  await waitFor(() => getSuggestion(app).getAttribute('aria-disabled') !== 'true');
});
