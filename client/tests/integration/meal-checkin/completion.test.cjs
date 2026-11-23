// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 저장·재시도·Tried·기기 저장 실패 및 새 식사 시작·사진 첨부 완료 흐름 검증
// AI-generated with GPT-6.2 Astra, GPT-6, 2026-11-23, reviewed by Haechan Jung
// Changed: 식후 사진 확인의 식전 사진 표시와 기기 식사 목록 저장 실패 후 새 식사 시작 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, input, click, enter, waitFor, act, deferred, modal, waitForModal,
  failNextWrite, storage, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
const { completionDraft, expectedWrite, completionResponse, completionPhoto } = require('../../fixtures/meal-completion.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { button, sourceLabels } = require('../../helpers/meal-photo-screen.cjs');
const { sourceResponses, link } = require('../../fixtures/meal-suggestion-linking.cjs');
const { saveMealDraft, readMealDraft, readMeal } = require('../../../src/data/storage/mealStorage.ts');

async function start(t, { empty = false, linked = false, single = false, photo = null } = {}) {
  const original = completionDraft({ empty, photo });
  await saveMealDraft(original);
  const sources = linked ? sourceResponses() : { suggestions: [], meals: [] };
  const response = completionResponse({ linked, single, photo });
  const server = { requests: [], details: [], next: null, saved: false };
  const app = await mountMeal(t, { ...sources, respond: async (path, method, init) => {
    if (method === 'PUT' && path === '/api/v1/meals') {
      const body = JSON.parse(init.body);
      server.requests.push(body);
      assert.deepEqual(body, expectedWrite({ linked, single, photo }));
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

test('기기 식사 목록 저장이 실패해도 완료 화면이 열리고 홈에서 저장한 식사를 열거나 새 식사를 시작할 수 있다', async t => {
  const { app } = await start(t);
  const mealsKey = 'nurturebites.meals.1.v1';
  const write = t.mock.method(storage, 'setItem', storage.setItem);
  failNextWrite(mealsKey);
  await click(control(app, 'button', 'Save check-in'));
  await expectComplete(app, ['Carrot rice', 'Tofu soup']);
  const failedWrite = write.mock.calls.find(call => call.arguments[0] === mealsKey);
  assert.ok(failedWrite);
  await assert.rejects(failedWrite.result, /Disk full/);
  await goHome(app);
  const pendingMeal = [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Dinner') && node.textContent.includes('Awaiting review'));
  assert.ok(pendingMeal);
  await click(pendingMeal);
  await waitFor(() => app.pathname === '/after-meal-review' && app.container.textContent.includes('Continue without photo'));
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '900');
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/home' && control(app, 'button', 'Log new meal'));
  await click(control(app, 'button', 'Log new meal'));
  await waitFor(() => app.pathname === '/meal-checkin' && control(app, 'heading', 'Meal details'));
});

test('식사 저장 후 홈에서 Log new meal을 누르면 초안 안내 없이 오늘의 새 식사가 열리고 이전 음식·사진·추천 연결은 남지 않는다', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 21, 11).getTime() });
  const { app, original } = await start(t, { linked: true, photo: completionPhoto });
  await chooseLink(app);
  await click(control(app, 'button', 'Save check-in'));
  await expectComplete(app, ['Carrot rice', 'Tofu soup']);
  const receipt = await readMealDraft('1');
  assert.equal(receipt.step, 'complete');
  assert.equal(receipt.savedMealId, '900');
  const savedMeal = await readMeal('1', '900');
  assert.equal(savedMeal.photo.uri, completionPhoto.uri);
  assert.deepEqual(savedMeal.suggestionLinks, [link(0, '901')]);
  await goHome(app);
  await click(control(app, 'button', 'Log new meal'));
  await waitFor(() => app.pathname === '/meal-checkin' && control(app, 'heading', 'Meal details'));
  assert.ok(!app.container.textContent.includes('Ongoing Meal'));
  assert.ok(!app.container.textContent.includes('Continue draft'));
  assert.ok(!app.container.textContent.includes('Check-in saved'));
  assert.ok(control(app, 'button', 'Today · 21 November'));
  assert.equal(window.getComputedStyle(control(app, 'button', 'Lunch')).borderWidth, '2px');
  for (const label of ['Home', 'Restaurant', 'School', 'Others']) {
    assert.notEqual(window.getComputedStyle(control(app, 'button', label)).borderWidth, '2px');
  }
  await click(control(app, 'button', 'Continue to photo'));
  await waitFor(() => control(app, 'heading', 'Before-meal photo'));
  await click(button(app, 'Skip photo'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  assert.ok(app.container.textContent.includes('0 food items'));
  assert.ok(app.container.textContent.includes('No foods added yet'));
  assert.equal(control(app, 'button', 'Save check-in').getAttribute('aria-disabled'), 'true');
  assert.equal(app.container.querySelector('img'), null);
  assert.ok(!app.container.textContent.includes('Carrot rice'));
  assert.ok(!app.container.textContent.includes('Potato mash'));
  const fresh = await readMealDraft('1');
  assert.notEqual(fresh.id, receipt.id);
  assert.notEqual(fresh.id, original.id);
  assert.equal(fresh.mealDate, '2026-11-21');
  assert.equal(fresh.mealType, 'lunch');
  assert.equal(fresh.setting, null);
  assert.deepEqual(fresh.foods, []);
  assert.equal(fresh.photo, null);
  assert.deepEqual(fresh.suggestionLinks ?? [], []);
  assert.equal(fresh.editingFood, null);
  assert.equal(fresh.editingSuggestionLink, null);
  assert.equal(fresh.savedMealId, null);
  assert.deepEqual(await readMeal('1', '900'), savedMeal);
});

test('체크인에 저장한 식전 사진이 식후 리뷰에서 새로 고른 식후 사진 옆에 표시된다', async t => {
  const { app, server } = await start(t, { photo: completionPhoto });
  assert.equal(app.container.querySelector('img').getAttribute('src'), completionPhoto.uri);
  await click(control(app, 'button', 'Save check-in'));
  await expectComplete(app, ['Carrot rice', 'Tofu soup']);
  assert.equal(server.requests[0].before_photo_uri, completionPhoto.uri);
  assert.equal(app.container.querySelector('img').getAttribute('src'), completionPhoto.uri);
  assert.ok(app.container.textContent.includes('Before meal'));
  assert.equal((await readMeal('1', '900')).photo.uri, completionPhoto.uri);
  await click(control(app, 'button', 'Add after-meal review'));
  await waitFor(() => app.pathname === '/after-meal-review' && app.container.textContent.includes('Continue without photo'));
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '900');
  assert.deepEqual(server.details, ['/api/v1/meals/900']);
  photoDevice.result = pickedImage({ uri: 'file:///cache/after-meal.png' });
  await click(button(app, sourceLabels.gallery));
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  const before = control(app, 'button', 'Before meal: Tap to enlarge');
  const after = control(app, 'button', 'After meal: Tap to enlarge');
  assert.equal(before.querySelector('img').getAttribute('src'), completionPhoto.uri);
  assert.equal(after.querySelector('img').getAttribute('src'), 'file:///cache/after-meal.png');
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '900');
});
