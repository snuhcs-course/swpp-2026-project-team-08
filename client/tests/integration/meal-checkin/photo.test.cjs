// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 추가·실패 후 재선택·사진 없이 건너뛰기의 대표 사용자 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { control, click, waitFor, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { readMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { button, sourceLabels, imageError, mountPhoto, assertPhotoStep, assertPreview } = require('../../helpers/meal-photo-screen.cjs');

test('사진을 선택하면 선택한 사진의 미리보기 화면으로 이동하고 식사 정보가 유지된다', async t => {
  for (const [source, os, name] of [['camera', 'android', '카메라'], ['gallery', 'ios', '사진 보관함'], ['files', 'android', '파일']]) {
    await t.test(name, async t => {
      const { app, original } = await mountPhoto(t, os);
      photoDevice.result = pickedImage();
      await click(button(app, sourceLabels[source]));
      await assertPreview(app, original);
      assert.equal(app.container.querySelector('[role="alert"]'), null);
    });
  }
});

test('사진 선택을 취소하거나 실패한 뒤 다시 선택하면 식사 정보를 잃지 않고 정상 사진의 미리보기가 열린다', async t => {
  const { app, original } = await mountPhoto(t);
  await click(button(app, sourceLabels.gallery));
  await waitFor(() => button(app, sourceLabels.gallery).getAttribute('aria-disabled') !== 'true');
  assertPhotoStep(app);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  assert.deepEqual(await readMealDraft('1'), original);

  photoDevice.permissionGranted = false;
  await click(button(app, sourceLabels.camera));
  await waitFor(() => control(app, 'alert', 'Photo access was denied. Allow access in device settings or choose another source.'));
  assertPhotoStep(app);
  assert.deepEqual(await readMealDraft('1'), original);

  photoDevice.result = pickedImage({ mimeType: 'application/pdf' });
  await click(button(app, sourceLabels.files));
  await waitFor(() => control(app, 'alert', imageError));
  assertPhotoStep(app);
  assert.deepEqual(await readMealDraft('1'), original);

  photoDevice.result = pickedImage();
  await click(button(app, sourceLabels.files));
  await assertPreview(app, original);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
});

test('사진 없이 건너뛰면 식사 정보를 유지한 음식 목록으로 이동하고 음식을 직접 추가할 수 있다', async t => {
  const { app, original } = await mountPhoto(t);
  await click(button(app, 'Skip photo'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  assert.ok(control(app, 'heading', 'Review food items'));
  assert.equal(app.container.querySelector('img'), null);
  assert.ok(app.container.textContent.includes('0 food items'));
  assert.ok(app.container.textContent.includes('No foods added yet'));
  assert.ok(control(app, 'button', 'Add food item'));
  assert.doesNotMatch(app.container.textContent, /Before meal|No Before-meal photo|previous suggestion|Add the foods you served, with or without a photo/);
  assert.equal(control(app, 'button', 'Save check-in').getAttribute('aria-disabled'), 'true');
  assert.ok(app.container.textContent.includes('Dinner'));
  assert.ok(app.container.textContent.includes('Restaurant'));
  assert.deepEqual(await readMealDraft('1'), { ...original, step: 'foods' });
  assert.deepEqual(photoDevice.selections, []);
  assert.deepEqual(photoDevice.permissions, []);
});
