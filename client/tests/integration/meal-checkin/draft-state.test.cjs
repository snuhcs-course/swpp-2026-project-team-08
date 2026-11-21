// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 빈 식사 초안의 종료·재진입·기존 기록 및 사용자 입력 보존 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 초안 저장 후 홈의 식사 시작·이어하기, 편집 중 앱 재시작, 저장 실패 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, input, click, enter, waitFor, act, deferred,
  modal, waitForModal, photoDevice, storage } = require('../../helpers/meal-checkin-screen.cjs');
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
async function continueDraft(app) {
  await waitFor(() => app.container.textContent.includes('Ongoing Meal'));
  assert.ok(app.container.textContent.includes('Finish your draft before starting a new check-in.'));
  assert.ok(!app.container.textContent.includes('Continue to photo'));
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
}
async function startExisting(t) {
  const original = linkingDraft([link(0, 'rice')]);
  await saveMealDraft(original);
  const app = await mount(t);
  await continueDraft(app);
  return { app, original };
}
async function editRice(app) {
  await click(control(card(app, 'Carrot rice'), 'button', 'Edit'));
  await waitForModal('Edit Carrot rice');
}

test('Save as Draft & Exit으로 홈에 돌아간 뒤 Log new meal을 누르면 기존 초안 안내가 열리고, Continue draft를 누르면 식사 정보·사진·음식·추천 연결이 복원된다', async t => {
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
  await continueDraft(app);
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
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  assert.equal(app.container.querySelector('img').getAttribute('src'), photoUri);
  assert.equal((await readMealDraft('1')).id, original.id);
});

test('기존 음식의 이름과 추천 연결을 수정하다 자동 저장 후 앱을 다시 열면 이어하기로 편집을 계속할 수 있고, Save food를 누르면 수정한 이름과 추천 연결이 음식 카드에 표시된다', async t => {
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
  await continueDraft(reopened);
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
