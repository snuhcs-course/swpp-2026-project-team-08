// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 저장·실패 재시도·Tried 표시·기기 저장 실패의 실제 화면 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, input, click, enter, waitFor, act, deferred, modal, waitForModal,
  failNextWrite, storage } = require('../../helpers/meal-checkin-screen.cjs');
const { completionDraft, expectedWrite, completionResponse } = require('../../fixtures/meal-completion.cjs');
const { sourceResponses, link } = require('../../fixtures/meal-suggestion-linking.cjs');
const { saveMealDraft, readMealDraft, readMeal } = require('../../../src/data/storage/mealStorage.ts');

async function start(t, { empty = false, linked = false, single = false } = {}) {
  const original = completionDraft({ empty });
  await saveMealDraft(original);
  const sources = linked ? sourceResponses() : { suggestions: [], meals: [] };
  const response = completionResponse({ linked, single });
  const server = { requests: [], details: [], next: null, saved: false };
  const app = await mountMeal(t, { ...sources, respond: async (path, method, init) => {
    if (method === 'PUT' && path === '/api/v1/meals') {
      const body = JSON.parse(init.body);
      server.requests.push(body);
      assert.deepEqual(body, expectedWrite({ linked, single }));
      // 서버 경계만 대체한다. 시도 기록 생성 자체는 서버 테스트의 책임이다.
      const result = server.next ? await server.next.promise : 'success';
      server.next = null;
      if (result === 'reject') return Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
      server.saved = true;
      sources.meals.unshift(response);
      if (linked) sources.suggestions[0].status = 'TRIED';
      return Response.json(response);
    }
    if (method === 'GET' && path === '/api/v1/meals/900/suggestions') return Response.json([]);
    if (method === 'GET' && path === '/api/v1/meals/900' && server.saved) {
      server.details.push(path);
      return Response.json(response);
    }
  } });
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  return { app, server, original, response };
}
async function addFood(app) {
  await click(control(app, 'button', 'Add food item'));
  await waitForModal('Add food item');
  await enter(modal(), 'Food name', 'Carrot rice');
  for (const name of ['Rice', 'Carrot']) {
    await click(control(modal(), 'button', '+ Add'));
    await enter(modal(), 'Add ingredient', name);
    await act(async () => input(modal(), 'Add ingredient').dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true,
    })));
  }
  await click(control(modal(), 'button', 'Select method'));
  await waitFor(() => control(modal(), 'button', 'Steamed'));
  await click(control(modal(), 'button', 'Steamed'));
  await waitFor(() => control(modal(), 'heading', 'Add food item'));
  await enter(modal(), 'Additional detail', 'Small bowl');
  await click(control(modal(), 'radio', 'Often Accepted'));
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  assert.ok(control(app, 'button', 'Carrot rice'));
}
async function expectComplete(app, names) {
  await waitFor(() => app.container.textContent.includes('Check-in saved'));
  assert.ok(app.container.textContent.includes('Awaiting'));
  for (const name of names) assert.ok(app.container.textContent.includes(name));
  assert.ok(app.container.textContent.includes('Dinner'));
  assert.ok(app.container.textContent.includes('16 November 2026'));
  assert.notEqual(control(app, 'button', 'Add after-meal review').getAttribute('aria-disabled'), 'true');
}
async function goHome(app) {
  await click(control(app, 'button', 'Back to Home'));
  await waitFor(() => app.pathname === '/home' && app.container.textContent.includes('After-meal Review'));
  assert.ok(app.container.textContent.includes('Dinner'));
  assert.ok(app.container.textContent.includes('Awaiting review'));
}
async function chooseLink(app) {
  await click(control(app, 'button', 'Edit'));
  await waitForModal('Edit Carrot rice');
  await waitFor(() => control(modal(), 'button', 'Link a saved suggestion').getAttribute('aria-disabled') !== 'true');
  await click(control(modal(), 'button', 'Link a saved suggestion'));
  await waitForModal('Saved suggestions');
  await click(control(modal(), 'radio', 'Potato mash'));
  await click(control(modal(), 'button', 'Link suggestion'));
  await waitForModal('Edit Carrot rice');
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  assert.ok(control(app, 'button', 'Remove: Potato mash'));
}

test('빈 음식 목록에서 음식을 추가해 저장하면 진행 상태와 완료 화면이 표시되고, 식후 검토를 누르면 저장한 식사의 음식과 상세 정보가 표시된다', async t => {
  const { app, server } = await start(t, { empty: true, single: true });
  const disabledSave = control(app, 'button', 'Save check-in');
  assert.equal(disabledSave.getAttribute('aria-disabled'), 'true');
  await click(disabledSave);
  assert.equal(server.requests.length, 0);
  assert.ok(control(app, 'button', 'Add food item'));
  await addFood(app);
  server.next = deferred();
  const pending = server.next;
  await click(control(app, 'button', 'Save check-in'));
  await waitFor(() => app.container.textContent.includes('Saving check-in'));
  const saving = control(app, 'button', 'Saving…');
  assert.equal(saving.getAttribute('aria-disabled'), 'true');
  assert.ok(app.container.querySelector('[role="progressbar"]'));
  await click(saving);
  assert.equal(server.requests.length, 1);
  assert.ok(app.container.textContent.includes('Carrot rice'));
  assert.ok(!app.container.textContent.includes('Check-in saved'));
  await act(async () => pending.resolve('success'));
  await expectComplete(app, ['Carrot rice']);
  const receipt = await readMealDraft('1');
  assert.equal(receipt.savedMealId, '900');
  assert.equal(receipt.foods[0].id, '901');
  assert.equal((await readMeal('1', '900')).foods[0].name, 'Carrot rice');
  await click(control(app, 'button', 'Add after-meal review'));
  await waitFor(() => app.pathname === '/after-meal-review' && app.container.textContent.includes('Continue without photo'));
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '900');
  const withoutPhoto = [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.startsWith('Continue without photo'));
  await click(withoutPhoto);
  await waitFor(() => control(app, 'checkbox', 'Carrot'));
  assert.ok(control(app, 'checkbox', 'Rice'));
  assert.ok(app.container.textContent.includes('Carrot rice'));
  assert.ok(app.container.textContent.includes('Restaurant'));
  assert.deepEqual(server.details, ['/api/v1/meals/900']);
  await click(control(app, 'button', 'Edit'));
  await waitForModal('Edit Carrot rice');
  assert.equal(input(modal(), 'Food name').value, 'Carrot rice');
  assert.equal(input(modal(), 'Additional detail').value, 'Small bowl');
  assert.ok(control(modal(), 'button', 'Steamed'));
  await click(control(modal(), 'button', 'Cancel'));
});

test('추천을 연결한 식사 저장을 서버가 거절하면 입력이 유지되고, Retry 성공 후 홈에서 저장 추천을 열면 Tried 표시와 해당 식사의 시도 기록이 보인다', async t => {
  const { app, server, original } = await start(t, { linked: true });
  await chooseLink(app);
  server.next = deferred();
  const pending = server.next;
  await click(control(app, 'button', 'Save check-in'));
  await act(async () => pending.resolve('reject'));
  await waitFor(() => control(app, 'button', 'Retry'));
  assert.ok(app.container.textContent.includes('We couldn’t save your check-in'));
  assert.ok(app.container.textContent.includes('Carrot rice'));
  assert.ok(app.container.textContent.includes('Tofu soup'));
  const failed = await readMealDraft('1');
  assert.deepEqual(failed.foods, original.foods);
  assert.deepEqual(failed.suggestionLinks, [link(0, 'rice')]);
  assert.equal(failed.savedMealId, null);
  assert.equal(server.saved, false);
  await click(control(app, 'button', 'Retry'));
  await expectComplete(app, ['Carrot rice', 'Tofu soup']);
  assert.deepEqual(server.requests[1], server.requests[0]);
  await goHome(app);
  await click(control(app, 'button', 'View saved suggestions'));
  await waitFor(() => app.pathname === '/section/ideas' && control(app, 'heading', 'Saved Suggestions'));
  const suggestion = [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.startsWith('Potato mash'));
  assert.ok(suggestion);
  assert.ok(suggestion.textContent.includes('Tried'));
  const other = [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.startsWith('Soft carrot'));
  assert.ok(other && !other.textContent.includes('Tried'));
  await click(suggestion);
  await waitForModal('Potato mash');
  assert.ok(control(modal(), 'button', 'Nov 16, 2026 · Dinner'));
  await click(control(modal(), 'button', 'Nov 16, 2026 · Dinner'));
  await waitFor(() => app.pathname === '/meal/900' && app.container.textContent.includes('Carrot rice'));
  assert.ok(app.container.textContent.includes('Tofu soup'));
});

test('서버 저장 후 기기 저장이 실패해도 완료 화면이 표시되고, 홈으로 돌아가면 저장한 식사가 보인다', async t => {
  const { app } = await start(t);
  const write = t.mock.method(storage, 'setItem', storage.setItem);
  failNextWrite('nurturebites.home.1.v1');
  await click(control(app, 'button', 'Save check-in'));
  await expectComplete(app, ['Carrot rice', 'Tofu soup']);
  const failedWrite = write.mock.calls.find(call => call.arguments[0] === 'nurturebites.home.1.v1');
  assert.ok(failedWrite);
  await assert.rejects(failedWrite.result, /Disk full/);
  await goHome(app);
  const pendingMeal = [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Dinner') && node.textContent.includes('Awaiting review'));
  assert.ok(pendingMeal);
  await click(pendingMeal);
  await waitFor(() => app.pathname === '/after-meal-review' && app.container.textContent.includes('Continue without photo'));
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '900');
});
