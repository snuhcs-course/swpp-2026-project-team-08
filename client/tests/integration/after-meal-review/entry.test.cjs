// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 홈에서 기존 식사 열기와 조회 실패 후 Retry의 실제 화면 이동 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, deferred } = require('../../helpers/meal-checkin-screen.cjs');
const { colors } = require('../../../src/util/colors.ts');
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');

function pendingCard(app) {
  return [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
}
function withoutPhoto(app) {
  return [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.startsWith('Continue without photo'));
}
function expectMealRoute(app) {
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
function selectedOutcomes(app, name) {
  const slider = control(app, 'slider', name);
  const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;
  return [...slider.parentElement.querySelectorAll('[role="radio"]')]
    .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
    .map(node => node.textContent);
}
async function startHome(t, respond) {
  const app = await mountMeal(t, { initialPath: '/home', meals: [entryMeal()], respond });
  await waitFor(() => pendingCard(app));
  assert.equal(app.pathname, '/home');
  return app;
}

test('홈에서 미검토 식사를 열면 해당 식사의 식후 사진 선택 화면이 열린다', async t => {
  const pending = deferred();
  const requests = [];
  const app = await startHome(t, async (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') {
      requests.push(path);
      return pending.promise;
    }
  });
  await click(pendingCard(app));
  await waitFor(() => app.pathname === '/after-meal-review' && app.container.querySelector('[role="progressbar"]'));
  assert.equal(withoutPhoto(app), undefined);
  await act(async () => pending.resolve(Response.json(entryMeal())));
  await waitFor(() => withoutPhoto(app));
  expectMealRoute(app);
  assert.ok(control(app, 'heading', 'after-meal photo'));
  assert.deepEqual(requests, ['/api/v1/meals/10']);
});

test('홈에서 연 식사의 조회가 실패해도 Retry에 성공하면 같은 식사의 미완료 결과 화면과 기존 답변이 표시된다', async t => {
  const stored = unfinishedReview();
  await saveAfterMealDraft(stored);
  let requests = 0;
  const app = await startHome(t, async (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') {
      requests++;
      return requests === 1
        ? Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 })
        : Response.json(entryMeal());
    }
  });
  await click(pendingCard(app));
  await waitFor(() => control(app, 'button', 'Retry'));
  expectMealRoute(app);
  assert.equal(withoutPhoto(app), undefined);
  assert.deepEqual(await readAfterMealDraft('1', '10'), stored);
  await click(control(app, 'button', 'Retry'));
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  await click(control(app, 'button', 'Expand or collapse Rice'));
  await waitFor(() => control(app, 'checkbox', 'Carrot'));
  expectMealRoute(app);
  assert.equal(requests, 2);
  assert.ok(app.container.textContent.includes('Rice'));
  assert.ok(app.container.textContent.includes('Soup'));
  assert.ok(control(app, 'slider', 'Carrot'));
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Egg"]'), null);
  assert.deepEqual(selectedOutcomes(app, 'Rice'), ['Tasted']);
  assert.deepEqual(selectedOutcomes(app, 'Carrot'), ['Untouched']);
  assert.deepEqual(selectedOutcomes(app, 'Soup'), []);
  assert.equal(control(app, 'button', 'Continue').getAttribute('aria-disabled'), 'true');
  assert.equal(withoutPhoto(app), undefined);
  assert.deepEqual(await readAfterMealDraft('1', '10'), stored);
});
