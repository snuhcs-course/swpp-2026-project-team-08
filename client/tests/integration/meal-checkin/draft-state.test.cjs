// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 빈 식사 초안의 종료·재진입·기존 기록 및 사용자 입력 보존 검증
// AI-generated with GPT-6, GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 초안 저장·재시도, 이어갈 단계 안내, 음식 편집 복원과 재개 후 뒤로가기 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, input, click, enter, waitFor, act, deferred,
  modal, waitForModal, photoDevice, storage, failNextWrite } = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels } = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { linkingDraft, link, sourceResponses } = require('../../fixtures/meal-suggestion-linking.cjs');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const key = 'nurturebites.meal-draft.1.v1';

function mount(t) {
  return mountMeal(t, { ...sourceResponses(), respond: (path, method) => {
    if (method === 'GET' && /^\/api\/v1\/meals\/8[12]\/suggestions$/.test(path)) return Response.json([]);
  } });
}
function card(app, name) {
  return { container: control(app, 'button', name).parentElement };
}
async function chooseSuggestion(title, editorTitle, changing = false) {
  await waitFor(() => control(modal(), 'button', changing ? 'Change' : 'Link a saved suggestion')
    .getAttribute('aria-disabled') !== 'true');
  await click(control(modal(), 'button', changing ? 'Change' : 'Link a saved suggestion'));
  await waitForModal('Saved suggestions');
  await click(control(modal(), 'radio', title));
  await click(control(modal(), 'button', 'Link suggestion'));
  await waitForModal(editorTitle);
}
async function saveFood() {
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
}
async function continueDraft(app, resumeAt) {
  await waitFor(() => app.container.textContent.includes('Ongoing Meal'));
  assert.ok(app.container.textContent.includes('Finish your draft before starting a new check-in.'));
  assert.ok(!app.container.textContent.includes('Continue to photo'));
  assert.ok(app.container.textContent.includes(`Continue from: ${resumeAt}`), resumeAt);
  await click(control(app, 'button', 'Continue draft'));
}
async function startExisting(t) {
  const original = linkingDraft([link(0, 'rice')]);
  await saveMealDraft(original);
  const app = await mount(t);
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  return { app, original };
}
async function editRice(app) {
  await click(control(card(app, 'Carrot rice'), 'button', 'Edit'));
  await waitForModal('Edit Carrot rice');
}
function holdDraftWrites(t) {
  const pending = deferred();
  const write = storage.setItem;
  t.mock.method(storage, 'setItem', async (storageKey, value) => {
    if (storageKey === key) await pending.promise;
    return write(storageKey, value);
  });
  t.after(() => pending.resolve());
  return pending;
}
function assertRestaurantSelected(app) {
  // RN Web은 장소 버튼의 선택 상태를 테두리로 표시한다.
  const restaurant = control(app, 'button', 'Restaurant');
  assert.equal(window.getComputedStyle(restaurant).borderWidth, '2px');
}

test('새 식사의 기본 정보에는 저장 표시가 없고, 장소를 선택하면 저장 중을 거쳐 자동 저장 완료가 표시된다', async t => {
  const app = await mountMeal(t);
  assert.ok(control(app, 'heading', 'Meal details'));
  assert.doesNotMatch(app.container.textContent, /Saving…|Auto-saved|Could not save/);

  const pending = holdDraftWrites(t);
  await click(control(app, 'button', 'Restaurant'));
  await waitFor(() => app.container.textContent.includes('Saving…'));
  assert.ok(!app.container.textContent.includes('Auto-saved'));

  await act(async () => pending.resolve());
  await waitFor(() => app.container.textContent.includes('Auto-saved'));
  assert.ok(!app.container.textContent.includes('Saving…'));
  assert.equal((await readMealDraft('1')).setting, 'restaurant');
});

test('기본 정보 저장에 실패해도 선택한 장소가 남고, 재시도한 뒤 초안을 다시 열면 같은 장소가 선택돼 있다', async t => {
  const app = await mountMeal(t);
  failNextWrite(key);
  await click(control(app, 'button', 'Restaurant'));
  await waitFor(() => control(app, 'alert', 'Could not save. Retry before leaving.'));
  assert.ok(control(app, 'heading', 'Meal details'));
  assert.ok(!app.container.textContent.includes('Auto-saved'));
  assertRestaurantSelected(app);
  assert.equal(await readMealDraft('1'), null);

  const pending = holdDraftWrites(t);
  await click(control(app, 'button', 'Retry'));
  await waitFor(() => app.container.textContent.includes('Saving…'));
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  await act(async () => pending.resolve());
  await waitFor(() => app.container.textContent.includes('Auto-saved'));
  assert.equal(app.container.querySelector('[role="button"][aria-label="Retry"]'), null);

  await app.unmount();
  const reopened = await mountMeal(t);
  await continueDraft(reopened, 'Meal details');
  await waitFor(() => control(reopened, 'heading', 'Meal details'));
  assertRestaurantSelected(reopened);
});

test('음식 목록에서 초안을 저장하고 홈에서 새 식사를 누르면 이어갈 단계에 음식 확인이 표시되고, 이어가면 식사 정보·사진·음식·추천 연결이 복원된다', async t => {
  const app = await mount(t);
  await click(control(app, 'button', 'Dinner'));
  await click(control(app, 'button', 'Restaurant'));
  await click(control(app, 'button', 'Continue to photo'));
  photoDevice.result = pickedImage();
  await click(button(app, sourceLabels.gallery));
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  const photoUri = app.container.querySelector('img').getAttribute('src');
  await click(control(app, 'button', 'Add food item'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  await click(control(app, 'button', 'Add food item'));
  await waitForModal('Add food item');
  await enter(modal(), 'Food name', 'Apple');
  await enter(modal(), 'Additional detail', 'Small pieces');
  await chooseSuggestion('Potato mash', 'Add food item');
  await saveFood();
  const original = await readMealDraft('1');
  await click(control(app, 'button', 'Save as Draft & Exit'));
  await waitFor(() => app.pathname === '/home' && control(app, 'button', 'Log new meal'));
  // 새 식사 진입 버튼도 새 초안을 만들지 않고 기존 초안의 이어하기로 연결되어야 한다.
  await click(control(app, 'button', 'Log new meal'));
  await continueDraft(app, 'Review food items');
  await waitFor(() => control(app, 'heading', 'Review food items'));
  assert.equal(app.pathname, '/meal-checkin');
  assert.ok(app.container.textContent.includes('Dinner'));
  assert.ok(app.container.textContent.includes('Restaurant'));
  assert.ok(app.container.textContent.includes('1 food item'));
  assert.ok(control(card(app, 'Apple'), 'button', 'Remove: Potato mash'));
  assert.deepEqual(await readMealDraft('1'), original);
  await click(control(card(app, 'Apple'), 'button', 'Edit'));
  await waitForModal('Edit Apple');
  assert.equal(input(modal(), 'Food name').value, 'Apple');
  assert.equal(input(modal(), 'Additional detail').value, 'Small pieces');
  await click(control(modal(), 'button', 'Cancel'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  assert.equal(app.container.querySelector('img').getAttribute('src'), photoUri);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => control(app, 'button', 'Continue draft'));
  assert.ok(app.container.textContent.includes('Ongoing Meal'));
  assert.deepEqual(await readMealDraft('1'), original);
});

test('음식 수정 중 앱을 다시 열면 이어갈 단계에 수정 중인 음식 이름이 표시되고, 이어서 저장하면 새 이름과 추천이 카드에 반영된다', async t => {
  const { app, original } = await startExisting(t);
  await editRice(app);
  await enter(modal(), 'Food name', 'Banana rice');
  await chooseSuggestion('Soft carrot', 'Edit Banana rice', true);
  await waitFor(async () => {
    const saved = await readMealDraft('1');
    return saved.editingFood?.name === 'Banana rice' && saved.editingSuggestionLink?.suggestionId === '32';
  });
  await app.unmount();
  const reopened = await mount(t);
  await continueDraft(reopened, 'Edit Banana rice');
  await waitForModal('Edit Banana rice');
  assert.equal(input(modal(), 'Food name').value, 'Banana rice');
  assert.ok(control(modal(), 'button', 'Remove: Soft carrot'));
  assert.ok(control(card(reopened, 'Carrot rice'), 'button', 'Remove: Potato mash'));
  const pending = await readMealDraft('1');
  assert.equal(pending.id, original.id);
  assert.deepEqual(pending.foods, original.foods);
  assert.deepEqual(pending.suggestionLinks, original.suggestionLinks);
  await saveFood();
  assert.ok(control(card(reopened, 'Banana rice'), 'button', 'Remove: Soft carrot'));
  assert.ok(!reopened.container.textContent.includes('Carrot rice'));
  const saved = await readMealDraft('1');
  assert.equal(saved.id, original.id);
  assert.deepEqual(saved.foods, original.foods.map(food => food.id === 'rice' ? { ...food, name: 'Banana rice' } : food));
  assert.deepEqual(saved.suggestionLinks, [link(1, 'rice')]);
  assert.equal(saved.editingFood, null);
});

test('Save as Draft & Exit의 초안 저장이 실패하면 현재 화면과 입력을 유지한다', async t => {
  const { app } = await startExisting(t);
  await editRice(app);
  await enter(modal(), 'Food name', 'Banana rice');
  await saveFood();
  const original = await readMealDraft('1');
  const write = storage.setItem;
  const pending = deferred();
  let failedWrite;
  t.mock.method(storage, 'setItem', (storageKey, value) => {
    if (storageKey !== key) return write(storageKey, value);
    failedWrite = JSON.parse(value);
    return pending.promise;
  });
  await click(control(app, 'button', 'Save as Draft & Exit'));
  await waitFor(() => !!failedWrite);
  assert.equal(app.pathname, '/meal-checkin');
  await act(async () => pending.reject(new Error('Disk full')));
  await waitFor(() => control(app, 'button', 'Retry'));
  assert.equal(app.pathname, '/meal-checkin');
  assert.ok(control(app, 'heading', 'Review food items'));
  assert.ok(control(card(app, 'Banana rice'), 'button', 'Remove: Potato mash'));
  assert.ok(control(app, 'button', 'Tofu soup'));
  assert.ok(app.container.textContent.includes('Dinner'));
  assert.ok(app.container.textContent.includes('Restaurant'));
  assert.deepEqual(failedWrite, original);
  assert.deepEqual(await readMealDraft('1'), original);
});
