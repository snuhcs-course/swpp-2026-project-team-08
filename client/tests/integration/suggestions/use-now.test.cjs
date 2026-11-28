// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: Use now 저장·재시도와 체크인 취소·저장 후 되돌리기 검증
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 저장 실패 후 남은 카드를 추천 음식 이름으로 확인

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, deferred } = require('../../helpers/meal-checkin-screen.cjs');
const { homeSuggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { completionDraft, completionResponse } = require('../../fixtures/meal-completion.cjs');
const { saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');

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
    if (path === '/api/v1/suggestions/72/decision' && method === 'DELETE') {
      saved.pop();
      return Response.json(card);
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
  assert.ok(app.container.textContent.includes(card.what_to_try));
  await click(control(app, 'button', 'Use now'));
  await waitFor(() => app.pathname === '/meal-checkin' && app.container.textContent.includes('Trying this suggestion'));
  assert.equal(new URL(window.location.href).searchParams.get('tryingSuggestionId'), card.id);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/recommendation' && control(app, 'button', '↶ Undo last action'));
  assert.deepEqual(decisions, [save, save]);
  assert.deepEqual(saved.map(item => [item.id, item.status]), [[card.id, 'SAVED']]);
  await click(control(app, 'button', '↶ Undo last action'));
  await waitFor(() => control(app, 'button', 'Use now'));
  assert.deepEqual(saved, []);
});

async function saveUseNowCheckin(t, linked) {
  const draft = completionDraft();
  await saveMealDraft({ ...draft, foods: draft.foods.slice(0, 1) });
  const card = homeSuggestionResponse({ id: '31' });
  const saved = [];
  const meals = [];
  const app = await mountMeal(t, { initialPath: '/recommendation', suggestions: saved, meals,
    respond(path, method, init) {
      if (path === '/api/v1/suggestions' && method === 'POST') return Response.json(card);
      if (path === '/api/v1/suggestions/31/decision' && method === 'PUT') {
        saved.push({ ...card, ...JSON.parse(init.body) });
        return Response.json(saved[0]);
      }
      if (path === '/api/v1/meals' && method === 'PUT') {
        assert.deepEqual(JSON.parse(init.body).foods[0].food_recommendation_ids, linked ? [card.id] : []);
        if (linked) saved[0].status = 'TRIED';
        meals.push(completionResponse({ linked, single: true }));
        return Response.json(meals[0]);
      }
    },
  });
  await waitFor(() => control(app, 'button', 'Use now'));
  await click(control(app, 'button', 'Use now'));
  await waitFor(() => control(app, 'button', 'Continue draft'));
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'button', 'Save check-in'));
  if (!linked) await click(control(app, 'checkbox', '☑ Trying this suggestion'));
  await click(control(app, 'button', 'Save check-in'));
  await waitFor(() => app.container.textContent.includes('Check-in saved'));
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/recommendation' && app.container.textContent.includes('Suggestion saved')
    && control(app, 'button', 'Regenerate'));
  return app;
}

test('Use now로 연결한 식사를 저장하면 추천 화면에서 되돌리기를 숨긴다', async t => {
  const app = await saveUseNowCheckin(t, true);
  await waitFor(() => !app.container.querySelector('[aria-label="↶ Undo last action"]'));
  await click(control(app, 'button', 'Leave'));
  await waitFor(() => app.pathname === '/home');
});

test('Use now에서 추천 연결을 해제하고 식사를 저장하면 추천의 되돌리기가 유지된다', async t => {
  const app = await saveUseNowCheckin(t, false);
  await waitFor(() => control(app, 'button', '↶ Undo last action').getAttribute('aria-disabled') !== 'true');
});
