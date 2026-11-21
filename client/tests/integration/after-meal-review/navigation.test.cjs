// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 재개 후 입력 변경·진행·재진입에 따른 실제 뒤로가기 경로 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor } = require('../../helpers/meal-checkin-screen.cjs');
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');

async function start(t) {
  const response = { ...entryMeal(), before_photo_uri: 'file:///before.png' };
  await saveAfterMealDraft(unfinishedReview());
  const app = await mountMeal(t, { initialPath: '/home', meals: [response], respond: (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(response);
  } });
  await waitFor(() => pendingCard(app));
  return app;
}
function pendingCard(app) {
  return [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
}
async function resume(app) {
  await click(pendingCard(app));
  await expectStep(app, 'What happened with each food item?');
}
async function expectStep(app, title) {
  await waitFor(() => control(app, 'heading', title));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
async function expectHome(app) {
  await waitFor(() => app.pathname === '/home' && pendingCard(app));
}

test('홈에서 재개해 답변만 바꾼 뒤 뒤로가면 홈으로 돌아가고, 다음 단계로 진행한 뒤에는 기존 순서로 돌아가며 다시 재개하면 홈으로 돌아간다', async t => {
  const app = await start(t);
  await resume(app);
  const soup = control(app, 'slider', 'Soup');
  const unclear = [...soup.parentElement.querySelectorAll('[role="radio"]')].find(node => node.textContent === 'Unclear');
  await click(unclear);
  await waitFor(() => app.container.textContent.includes('Auto-saved'));
  const answered = await readAfterMealDraft('1', '10');
  await click(control(app, 'button', 'Go back'));
  await expectHome(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
  await resume(app);
  await click(control(app, 'button', 'Continue'));
  await expectStep(app, 'What made this food difficult?');
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'What happened with each food item?');
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'Review meal photos');
  await click(control(app, 'button', 'Enter food outcomes'));
  await expectStep(app, 'What happened with each food item?');
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
  await click(control(app, 'button', 'Save & exit'));
  await expectHome(app);
  await resume(app);
  await click(control(app, 'button', 'Go back'));
  await expectHome(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
});
