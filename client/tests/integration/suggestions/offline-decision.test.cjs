// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 오프라인에서 추천 사용·되돌리기 실패 후 나가기와 재연결 동작 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act } = require('../../helpers/meal-checkin-screen.cjs');
const { onlineManager } = require('@tanstack/react-query');
const { homeSuggestionResponse } = require('../../fixtures/server-suggestion.cjs');

for (const action of ['Use now', '↶ Undo last action']) {
  test(`오프라인에서 ${action} 실패 후 홈에 돌아갈 수 있고 재연결은 결정을 보내지 않는다`, async t => {
    const card = homeSuggestionResponse();
    const attempts = [];
    const app = await mountMeal(t, { initialPath: '/recommendation', respond(path, method, init) {
      if (path === '/api/v1/suggestions' && method === 'POST') return Response.json(card);
      if (path === `/api/v1/suggestions/${card.id}/decision`) {
        attempts.push(method);
        if (!onlineManager.isOnline()) throw new TypeError('Network request failed');
        return Response.json({ ...card, ...JSON.parse(init.body ?? '{}') });
      }
    } });
    await waitFor(() => control(app, 'button', 'Use now'));
    if (action === '↶ Undo last action') {
      await click(control(app, 'button', 'Save suggestion'));
      await waitFor(() => control(app, 'button', action));
    }
    const expected = action === 'Use now' ? ['PUT'] : ['PUT', 'DELETE'];
    t.after(() => onlineManager.setOnline(true));
    await act(async () => window.dispatchEvent(new window.Event('offline')));
    await click(control(app, 'button', action));
    await waitFor(() => app.container.querySelector('[role="alert"]'));
    assert.deepEqual(attempts, expected);
    assert.equal(app.pathname, '/recommendation');
    await click(control(app, 'button', 'Back to Home'));
    await waitFor(() => app.pathname === '/home');
    await act(async () => window.dispatchEvent(new window.Event('online')));
    assert.deepEqual(attempts, expected);
    assert.equal(app.pathname, '/home');
  });
}
