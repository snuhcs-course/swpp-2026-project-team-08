// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Ongoing Meal 왕복 후 사진 건너뛰기와 입력 보존 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, input, click, enter, waitFor, modal, waitForModal, photoDevice }
  = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels } = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { linkingDraft, link, sourceResponses } = require('../../fixtures/meal-suggestion-linking.cjs');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');

function mount(t) {
  return mountMeal(t, { ...sourceResponses(), respond: (path, method) => {
    if (method === 'GET' && /^\/api\/v1\/meals\/8[12]\/suggestions$/.test(path)) return Response.json([]);
  } });
}
async function expectScreen(app, heading) {
  await waitFor(() => control(app, 'heading', heading));
  assert.ok(!app.container.textContent.includes('Ongoing Meal'));
}
async function expectOngoing(app) {
  await waitFor(() => control(app, 'button', 'Continue draft'));
  assert.ok(app.container.textContent.includes('Ongoing Meal'));
  assert.ok(!app.container.textContent.includes('Continue to photo'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
}
async function backTo(app, heading) {
  await click(control(app, 'button', 'Go back'));
  await expectScreen(app, heading);
}
async function expectDraft(original, step) {
  assert.deepEqual(await readMealDraft('1'), { ...original, step });
}
async function selectSuggestion(title, editorTitle, changing = false) {
  const label = changing ? 'Change' : 'Link a saved suggestion';
  await waitFor(() => control(modal(), 'button', label).getAttribute('aria-disabled') !== 'true');
  await click(control(modal(), 'button', label));
  await waitForModal('Saved suggestions');
  await click(control(modal(), 'radio', title));
  await click(control(modal(), 'button', 'Link suggestion'));
  await waitForModal(editorTitle);
}
async function addApple(app) {
  await click(control(app, 'button', 'Add food item'));
  await waitForModal('Add food item');
  await enter(modal(), 'Food name', 'Apple');
  await enter(modal(), 'Additional detail', 'Small pieces');
  await selectSuggestion('Potato mash', 'Add food item');
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
}
async function closeEditingThroughPicker(app, original) {
  await click(control(app, 'button', 'Edit'));
  await waitForModal('Edit Apple');
  await enter(modal(), 'Food name', 'Unsaved apple');
  await click(control(modal(), 'button', 'Change'));
  await waitForModal('Saved suggestions');
  await click(control(modal(), 'radio', 'Soft carrot'));
  await click(control(modal(), 'button', 'Go back'));
  await waitForModal('Edit Unsaved apple');
  assert.equal(input(modal(), 'Food name').value, 'Unsaved apple');
  assert.ok(control(modal(), 'button', 'Remove: Potato mash'));
  // RN Modal의 닫기 요청과 같은 onClose 경로를 사용한다.
  await click(control(modal(), 'button', 'Close'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  await expectScreen(app, 'Review food items');
  assert.ok(control(app, 'button', 'Apple'));
  assert.ok(control(app, 'button', 'Remove: Potato mash'));
  await expectDraft(original, 'foods');
}

test('초안을 재개해 입력을 수정하고 뒤로가면 Ongoing Meal이 표시되고, 다시 재개하면 수정한 입력이 표시된다', async t => {
  const original = { ...linkingDraft([link(0, 'rice')]), step: 'details' };
  await saveMealDraft(original);
  const app = await mount(t);
  await expectOngoing(app);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/home' && control(app, 'button', 'Log new meal'));
  await click(control(app, 'button', 'Log new meal'));
  await expectOngoing(app);
  await click(control(app, 'button', 'Continue draft'));
  await expectScreen(app, 'Meal details');
  await click(control(app, 'button', 'School'));
  const edited = { ...original, setting: 'school' };
  await click(control(app, 'button', 'Go back'));
  await expectOngoing(app);
  assert.equal(app.pathname, '/meal-checkin');
  await expectDraft(edited, 'details');
  await click(control(app, 'button', 'Continue draft'));
  await expectScreen(app, 'Meal details');
  assert.equal(window.getComputedStyle(control(app, 'button', 'School')).borderWidth, '2px');
  await expectDraft(edited, 'details');
  await click(control(app, 'button', 'Go back'));
  await expectOngoing(app);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/home');
  await expectDraft(edited, 'details');
});

test('기본 정보부터 음식 목록까지 진행한 뒤 초안을 다시 열고, 재개한 화면에서 다음 단계로 진행하면 이후 앞뒤 이동은 기존 단계 순서를 따르고 입력은 유지된다', async t => {
  for (const withPhoto of [true, false]) {
    await t.test(withPhoto ? '사진이 있는 흐름' : '사진이 없는 흐름', async t => {
      let app = await mount(t);
      await click(control(app, 'button', 'Dinner'));
      await click(control(app, 'button', 'Restaurant'));
      await click(control(app, 'button', 'Continue to photo'));
      await expectScreen(app, 'Before-meal photo');
      if (withPhoto) {
        photoDevice.result = pickedImage();
        await click(button(app, sourceLabels.gallery));
        await expectScreen(app, 'Check your photo');
        await click(control(app, 'button', 'Add food item'));
      } else {
        await click(button(app, 'Skip photo'));
      }
      await expectScreen(app, 'Review food items');
      await addApple(app);
      const original = await readMealDraft('1');
      const resumedStep = withPhoto ? 'preview' : 'photo';
      const resumedHeading = withPhoto ? 'Check your photo' : 'Before-meal photo';
      await backTo(app, resumedHeading);
      await expectDraft(original, resumedStep);
      await app.unmount();
      app = await mount(t);
      await expectOngoing(app);
      await click(control(app, 'button', 'Continue draft'));
      await expectScreen(app, resumedHeading);
      await click(withPhoto ? control(app, 'button', 'Add food item') : button(app, 'Skip photo'));
      await expectScreen(app, 'Review food items');
      await expectDraft(original, 'foods');
      await closeEditingThroughPicker(app, original);
      await backTo(app, resumedHeading);
      await expectDraft(original, resumedStep);
      if (withPhoto) {
        assert.equal(app.container.querySelector('img').getAttribute('src'), original.photo.uri);
        await backTo(app, 'Before-meal photo');
      }
      await backTo(app, 'Meal details');
      await expectDraft(original, 'details');
      assert.equal(window.getComputedStyle(control(app, 'button', 'Dinner')).borderWidth, '2px');
      assert.equal(window.getComputedStyle(control(app, 'button', 'Restaurant')).borderWidth, '2px');
      // 다시 앞으로 가도 새 초안이나 새 음식을 만들지 않는다.
      await click(control(app, 'button', 'Continue to photo'));
      await click(button(app, 'Skip photo'));
      await expectScreen(app, 'Review food items');
      await expectDraft(withPhoto ? { ...original, photo: null } : original, 'foods');
      assert.ok(control(app, 'button', 'Apple'));
      assert.ok(control(app, 'button', 'Remove: Potato mash'));
    });
  }
});
