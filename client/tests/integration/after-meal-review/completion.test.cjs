// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 리뷰 완료·홈 갱신·서버 Retry와 초안 실패 후 제출의 실제 화면 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, deferred, storage } = require('../../helpers/meal-checkin-screen.cjs');
const { completionFixture, expectedReview } = require('../../fixtures/after-meal-completion.cjs');
const { reviewResponse } = require('../../fixtures/server-meal.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const draftKey = 'nurturebites.after-meal.1.10.draft.v1';

async function start(t) {
  const { response, draft } = completionFixture();
  draft.step = 'outcomes';
  draft.difficulties = {};
  draft.difficultyInputs = {};
  for (const food of draft.outcomes) {
    food.decision.confirmed = null;
    for (const ingredient of food.ingredients) {
      ingredient.selected = false;
      ingredient.decision.confirmed = null;
    }
  }
  await saveAfterMealDraft(draft);
  const server = { meal: response, requests: [], next: null, suggestionsRead: [] };
  const recommendations = [suggestionResponse({ meal_id: '10', origin_food_id: '2', what_to_try: 'Serve soup in a small cup' })];
  const app = await mountMeal(t, { initialPath: '/home', respond: async (path, method, init) => {
    if (method === 'GET' && path === '/api/v1/meals') return Response.json([server.meal]);
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(server.meal);
    if (method === 'GET' && path === '/api/v1/meals/10/suggestions') {
      server.suggestionsRead.push(path);
      return Response.json(recommendations);
    }
    if (method === 'PUT' && path === '/api/v1/meals/10/review') {
      const body = JSON.parse(init.body);
      server.requests.push(body);
      const pending = server.next;
      server.next = null;
      if (pending && await pending.promise === 'failure') {
        return Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
      }
      server.meal = reviewResponse(server.meal, body);
      return Response.json(server.meal);
    }
  } });
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
  await waitFor(() => card());
  await click(card());
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  return { app, server };
}
function radio(app, name, outcome) {
  const slider = control(app, 'slider', name);
  return [...slider.parentElement.querySelectorAll('[role="radio"]')].find(node => node.textContent === outcome);
}
function editor(app, name) {
  const label = [...app.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === name);
  assert.ok(label);
  let container = label.parentElement;
  while (container && !container.querySelector('[aria-label="Select category"]')) container = container.parentElement;
  assert.ok(container);
  return { container };
}
async function choose(app, name, field, value) {
  const target = editor(app, name);
  await click(control(target, 'button', field));
  const option = [...target.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === value);
  assert.ok(option, `${name}의 ${field}에 ${value} 선택지가 있어야 한다`);
  await click(option.closest('[role="button"]'));
}
async function enterReview(app) {
  await click(radio(app, 'Rice', 'Eaten'));
  await click(radio(app, 'Soup', 'Unclear'));
  await click(control(app, 'checkbox', 'Carrot'));
  await click(radio(app, 'Carrot', 'Tasted'));
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => control(app, 'heading', 'What made this food difficult?'));
  await choose(app, 'Rice', 'Select category', 'Colors');
  await choose(app, 'Rice', 'value', 'Yellow');
  await click(control(editor(app, 'Rice'), 'button', '+ Add'));
  await choose(app, 'Rice', 'Select category', 'Food Smells');
  await choose(app, 'Rice', 'value', 'Cool mint-like smell');
  await choose(app, 'Carrot in Rice', 'Select category', 'Texture');
  await choose(app, 'Carrot in Rice', 'Select texture characteristic', 'How hard it feels');
  await choose(app, 'Carrot in Rice', 'value', 'Firm');
}
function expectPhotos(app) {
  for (const side of ['before', 'after']) {
    assert.ok([...app.container.querySelectorAll('img')].some(image => image.getAttribute('src') === `file:///${side}.png`));
  }
}
async function expectComplete(app) {
  await waitFor(() => app.container.textContent.includes('This Meal Review saved'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
  for (const text of ['Rice', 'Soup', 'Lunch', '23 October 2026']) assert.ok(app.container.textContent.includes(text), text);
  expectPhotos(app);
  assert.ok(control(app, 'button', 'Return to Home for now'));
}
async function expectSaving(app) {
  await waitFor(() => app.container.textContent.includes('Saving this review…'));
  const button = control(app, 'button', 'Saving…');
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.ok(app.container.querySelector('[role="progressbar"]'));
  await click(button);
  assert.equal(app.container.textContent.includes('This Meal Review saved'), false);
}

test('사진을 첨부한 리뷰에 답변·사유를 입력하고 Continue를 누르면 저장 중 중복 제출이 차단되며, 완료 후 홈에서는 해당 식사가 검토 대기 목록에서 사라진다', async t => {
  const { app, server } = await start(t);
  await enterReview(app);
  server.next = deferred();
  const pending = server.next;
  await click(control(app, 'button', 'Continue'));
  await expectSaving(app);
  assert.deepEqual(server.requests, [expectedReview()]);
  await act(async () => pending.resolve('success'));
  await expectComplete(app);
  await click(control(app, 'button', 'Return to Home for now'));
  await waitFor(() => app.pathname === '/home' && app.container.textContent.includes('Log new meal'));
  assert.equal(app.container.textContent.includes('Awaiting review'), false);
  assert.equal(server.meal.foods[0].outcome, 'EATEN');
  assert.equal(server.requests.length, 1);
});

test('서버 저장에 실패해도 사진·답변·사유가 유지되고, Retry에 성공하면 같은 식사의 완료 화면에서 해당 식사의 추천 화면으로 이동한다', async t => {
  const { app, server } = await start(t);
  await enterReview(app);
  const before = await readAfterMealDraft('1', '10');
  server.next = deferred();
  server.next.resolve('failure');
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => control(app, 'button', 'Retry'));
  assert.ok(app.container.textContent.includes('We couldn’t save your meal'));
  expectPhotos(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
  assert.equal(server.meal.foods[0].outcome, null);
  await click(control(app, 'button', 'Retry'));
  await expectComplete(app);
  assert.deepEqual(server.requests, [expectedReview(), expectedReview()]);
  await click(control(app, 'button', 'View Meal Suggestions'));
  await waitFor(() => app.pathname === '/recommendation/10' && app.container.textContent.includes('Serve soup in a small cup'));
  assert.ok(control(app, 'heading', 'Recommendations for this meal'));
  assert.ok(app.container.textContent.includes('Soup'));
  assert.ok(server.suggestionsRead.length > 0);
});

test('초안 자동 저장에 실패한 상태에서 Continue를 눌러도 현재 답변·사유를 서버에 제출하고 리뷰 완료 화면이 열린다', async t => {
  const { app, server } = await start(t);
  const setItem = storage.setItem.bind(storage);
  let failures = 0;
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === draftKey) { failures++; throw new Error('Disk full'); }
    return setItem(key, value);
  });
  await enterReview(app);
  await waitFor(() => failures > 0 && app.container.textContent.includes('Could not save the review. Your answers are preserved.'));
  await click(control(app, 'button', 'Continue'));
  await expectComplete(app);
  assert.deepEqual(server.requests, [expectedReview()]);
  assert.equal(app.container.textContent.includes('Could not save the review. Your answers are preserved.'), false);
});
