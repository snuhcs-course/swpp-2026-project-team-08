// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 추천 제외 시 Skip과 Done의 사유 저장 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor } = require('../../helpers/meal-checkin-screen.cjs');
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
  });
}
