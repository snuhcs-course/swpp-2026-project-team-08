// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 사진 추가·실패 후 재선택·사진 없이 건너뛰기의 실제 화면 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels, imageError } = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { newReviewDraft } = require('../../../src/features/after-meal-review/rules.ts');
const { mealKeys } = require('../../../src/data/queries/mealQueryKeys.ts');

async function start(t, os = 'android', resume = false) {
  const meal = entryMeal();
  const original = resume
    ? { ...unfinishedReview(), step: 'photo', afterPhoto: null }
    : { ...newReviewDraft(toLegacyMeal(toMealDetail(meal))), comparisonMethod: 'manual' };
  if (resume) await saveAfterMealDraft(original);
  const app = await mountMeal(t, { initialPath: '/home', meals: [meal], respond: (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(meal);
  } });
  const platform = require('react-native-web').Platform;
  const originalOS = platform.OS;
  platform.OS = os;
  t.after(() => { platform.OS = originalOS; });
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
  await waitFor(() => card());
  await click(card());
  await waitFor(() => control(app, 'heading', 'after-meal photo'));
  return { app, original, meal: toMealDetail(meal) };
}
function expectSameMeal(app) {
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
function expectPhotoChoice(app) {
  expectSameMeal(app);
  assert.ok(control(app, 'heading', 'after-meal photo'));
  for (const label of Object.values(sourceLabels)) {
    assert.notEqual(button(app, label).getAttribute('aria-disabled'), 'true');
  }
  assert.equal(app.container.querySelector('img'), null);
  assert.ok(button(app, 'Continue without photo'));
}
async function expectPreview(app, original, meal) {
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  expectSameMeal(app);
  const stored = await readAfterMealDraft('1', '10');
  assert.equal(stored.afterPhoto.uri, photoDevice.copies.at(-1).to);
  assert.equal(app.container.querySelector('img').getAttribute('src'), stored.afterPhoto.uri);
  assert.deepEqual(stored, { ...original, step: 'preview', afterPhoto: stored.afterPhoto });
  assert.deepEqual(app.client.getQueryData(mealKeys.detail('1', '10')), meal);
  assert.notEqual(control(app, 'button', 'Use this photo').getAttribute('aria-disabled'), 'true');
  assert.equal(app.container.querySelector('[role="alert"]'), null);
}

test('사진을 선택하면 선택한 식후 사진의 미리보기 화면으로 이동하고 기존 식사 정보가 유지된다', async t => {
  for (const [source, os, name] of [
    ['camera', 'android', '카메라'], ['gallery', 'ios', '사진 보관함'], ['files', 'android', '파일'],
  ]) {
    await t.test(name, async t => {
      const { app, original, meal } = await start(t, os);
      photoDevice.result = pickedImage();
      await click(button(app, sourceLabels[source]));
      await expectPreview(app, original, meal);
      assert.deepEqual(photoDevice.selections.map(selection => selection.source), [source]);
    });
  }
});

test('사진 선택을 취소하거나 실패한 뒤 다시 선택하면 기존 입력을 잃지 않고 정상 사진의 미리보기가 열린다', async t => {
  const { app, original, meal } = await start(t, 'android', true);
  await click(button(app, sourceLabels.gallery));
  await waitFor(() => button(app, sourceLabels.gallery).getAttribute('aria-disabled') !== 'true');
  expectPhotoChoice(app);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  assert.deepEqual(await readAfterMealDraft('1', '10'), original);

  photoDevice.permissionGranted = false;
  await click(button(app, sourceLabels.camera));
  await waitFor(() => control(app, 'alert', 'Photo access was denied. Choose another source or update device permissions.'));
  expectPhotoChoice(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), original);

  photoDevice.result = pickedImage({ mimeType: 'application/pdf' });
  await click(button(app, sourceLabels.files));
  await waitFor(() => control(app, 'alert', imageError));
  expectPhotoChoice(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), original);

  photoDevice.result = pickedImage();
  await click(button(app, sourceLabels.files));
  await expectPreview(app, original, meal);
});

test('사진 없이 건너뛰면 기존 음식이 유지된 결과 입력 화면으로 이동하고 음식별 결과를 입력할 수 있다', async t => {
  const { app, original, meal } = await start(t);
  await click(button(app, 'Continue without photo'));
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  expectSameMeal(app);
  assert.ok(app.container.textContent.includes('2 food items'));
  assert.ok(app.container.textContent.includes('Rice'));
  assert.ok(app.container.textContent.includes('Soup'));
  assert.ok(control(app, 'slider', 'Rice'));
  assert.ok(control(app, 'slider', 'Soup'));
  assert.ok(control(app, 'checkbox', 'Carrot'));
  assert.ok(control(app, 'checkbox', 'Egg'));
  assert.ok(app.container.textContent.includes('23 October 2026'));
  assert.ok(app.container.textContent.includes('Lunch'));
  assert.ok(app.container.textContent.includes('Home'));
  assert.equal(app.container.querySelector('img'), null);
  assert.equal(control(app, 'button', 'Continue').getAttribute('aria-disabled'), 'true');
  assert.deepEqual(await readAfterMealDraft('1', '10'), { ...original, step: 'outcomes' });
  assert.deepEqual(app.client.getQueryData(mealKeys.detail('1', '10')), meal);
  assert.deepEqual(photoDevice.selections, []);
  assert.deepEqual(photoDevice.permissions, []);
});
