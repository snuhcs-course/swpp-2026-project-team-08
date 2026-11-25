// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: Use now 저장 실패·재시도와 저장한 추천의 새 식사 체크인 진입 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, deferred } = require('../../helpers/meal-checkin-screen.cjs');
const { homeSuggestionResponse } = require('../../fixtures/server-suggestion.cjs');

test('Use now는 저장에 성공한 뒤에만 해당 추천으로 새 식사 체크인을 연다', async t => {
  const firstSave = deferred();
  const decisions = [];
  const saved = [];
  const card = homeSuggestionResponse({ id: '72' });
  const app = await mountMeal(t, { initialPath: '/recommendation', suggestions: saved, respond(path, method, init) {
    if (path === '/api/v1/suggestions' && method === 'POST') return Response.json(card);
    if (path === '/api/v1/suggestions/72/decision' && method === 'PUT') {
      decisions.push(JSON.parse(init.body));
      if (decisions.length === 1) return firstSave.promise;
      const result = { ...card, ...decisions.at(-1) };
      saved.push(result);
      return Response.json(result);
    }
  } });
  await waitFor(() => control(app, 'button', 'Use now'));
  const button = control(app, 'button', 'Use now');
  await act(async () => { button.click(); button.click(); });
  const save = { status: 'SAVED', dismiss_reasons: [] };
  assert.deepEqual(decisions, [save]);
  assert.equal(app.pathname, '/recommendation');

  await act(async () => firstSave.resolve(Response.json({}, { status: 503 })));
  await waitFor(() => app.container.querySelector('[role="alert"]'));
  assert.ok(app.container.textContent.includes(card.food_name));
  await click(control(app, 'button', 'Use now'));
  await waitFor(() => app.pathname === '/meal-checkin' && app.container.textContent.includes('Trying this suggestion'));
  assert.equal(new URL(window.location.href).searchParams.get('tryingSuggestionId'), card.id);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname !== '/meal-checkin');
  assert.deepEqual(decisions, [save, save]);
  assert.deepEqual(saved.map(item => [item.id, item.status]), [[card.id, 'SAVED']]);
});
