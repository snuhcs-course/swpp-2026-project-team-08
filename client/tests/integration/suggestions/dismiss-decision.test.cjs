// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 추천 카드의 버튼 이름, 제외 사유와 완료 화면의 재생성·재시도·한도·홈 복귀 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, deferred } = require('../../helpers/meal-checkin-screen.cjs');
const { homeSuggestionResponse } = require('../../fixtures/server-suggestion.cjs');

for (const [action, selectReason, expectedReasons] of [
  ['Skip', false, []],
  ['Skip', true, []],
  ['Done', true, ['DISLIKE']],
]) {
  test(`추천 카드에서 사유 ${selectReason ? '선택' : '미선택'} 후 ${action}으로 제외한다`, async t => {
    const decisions = [];
    const app = await mountMeal(t, { initialPath: '/recommendation', respond(path, method, init) {
      if (path === '/api/v1/suggestions' && method === 'POST') return Response.json(homeSuggestionResponse());
      if (path === '/api/v1/suggestions/31/decision' && method === 'PUT') {
        const decision = JSON.parse(init.body);
        decisions.push(decision);
        return Response.json(homeSuggestionResponse(decision));
      }
    } });
    await waitFor(() => control(app, 'button', 'Dismiss suggestion'));
    await click(control(app, 'button', 'Dismiss suggestion'));
    assert.equal(control(app, 'button', 'Done').getAttribute('aria-disabled'), 'true');
    if (selectReason) {
      await click(control(app, 'checkbox', 'My child dislikes this food or form'));
      assert.notEqual(control(app, 'button', 'Done').getAttribute('aria-disabled'), 'true');
    }
    await click(control(app, 'button', action));
    await waitFor(() => app.container.textContent.includes('Suggestion dismissed'));
    assert.deepEqual(decisions, [{ status: 'DISMISSED', dismiss_reasons: expectedReasons }]);
    assert.equal(app.container.textContent.includes('My child dislikes this food or form'), expectedReasons.length > 0);
  });
}

test('재생성 응답을 잃으면 같은 요청으로 새 카드를 복구하고 마지막 횟수 사용 후 홈으로 나간다', async t => {
  const requests = [];
  const pending = deferred();
  const app = await mountMeal(t, { initialPath: '/recommendation', respond(path, method, init) {
    if (path === '/api/v1/suggestions' && method === 'POST') {
      requests.push(init.body && JSON.parse(init.body));
      if (requests.length === 1) return Response.json(homeSuggestionResponse({ remaining_regenerations: 1 }));
      if (requests.length === 2) return pending.promise;
      return Response.json(homeSuggestionResponse({ id: '32', food_name: 'Corn', remaining_regenerations: 0 }));
    }
    if (method === 'PUT' && path.endsWith('/decision')) {
      return Response.json(homeSuggestionResponse({ id: path.split('/')[4], ...JSON.parse(init.body) }));
    }
  } });
  await waitFor(() => control(app, 'button', 'Dismiss suggestion'));
  assert.equal(control(app, 'button', 'Dismiss suggestion').textContent, 'Dismiss');
  assert.equal(control(app, 'button', 'Save suggestion').textContent, 'Save');
  await click(control(app, 'button', 'Dismiss suggestion'));
  await click(control(app, 'checkbox', 'My child dislikes this food or form'));
  await click(control(app, 'button', 'Done'));
  await waitFor(() => control(app, 'button', 'Regenerate'));
  const regenerate = control(app, 'button', 'Regenerate');
  await act(async () => { regenerate.click(); regenerate.click(); });
  assert.equal(requests.length, 2);
  await act(async () => pending.reject(new TypeError('Network request failed')));
  await waitFor(() => control(app, 'button', 'Retry'));
  assert.ok(app.container.textContent.includes('Suggestion dismissed'));
  await click(control(app, 'button', 'Retry'));
  await waitFor(() => app.container.textContent.includes('Corn') && control(app, 'button', 'Save suggestion'));
  assert.equal(requests[0], undefined);
  assert.match(requests[1].regeneration_request_id, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(requests[1], requests[2]);
  await click(control(app, 'button', 'Save suggestion'));
  await waitFor(() => control(app, 'button', 'Regenerate').getAttribute('aria-disabled') === 'true');
  await click(control(app, 'button', 'Leave'));
  await waitFor(() => app.pathname === '/home');
  assert.equal(requests.length, 3);
});

test('다른 기기에서 한도를 채우면 서버 응답으로 현재 완료 화면의 재생성을 막는다', async t => {
  const app = await mountMeal(t, { initialPath: '/recommendation', respond(path, method, init) {
    if (path === '/api/v1/suggestions' && method === 'POST') {
      return init.body
        ? Response.json({ error_code: 'REGENERATION_LIMIT_REACHED' }, { status: 429 })
        : Response.json(homeSuggestionResponse());
    }
    if (path === '/api/v1/suggestions/31/decision' && method === 'PUT') {
      return Response.json(homeSuggestionResponse({ status: 'SAVED' }));
    }
  } });
  await waitFor(() => control(app, 'button', 'Save suggestion'));
  await click(control(app, 'button', 'Save suggestion'));
  await waitFor(() => control(app, 'button', 'Regenerate'));
  await click(control(app, 'button', 'Regenerate'));
  await waitFor(() => control(app, 'button', 'Regenerate').getAttribute('aria-disabled') === 'true');
  assert.ok(app.container.textContent.includes('Suggestion saved'));
});
