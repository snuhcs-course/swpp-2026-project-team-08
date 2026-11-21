// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 추가·확인 화면 테스트의 공통 진입과 표시 검증
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, photoDevice } = require('./meal-checkin-screen.cjs');
const { readMealDraft } = require('../../src/data/storage/mealStorage.ts');

// 파일·건너뛰기 버튼은 같은 요소에 보조 설명도 표시한다.
function button(app, label) {
  const matches = [...app.container.querySelectorAll('[role="button"]')]
    .filter(element => (element.getAttribute('aria-label') ?? element.textContent).startsWith(label));
  assert.equal(matches.length, 1, `${label} 버튼이 하나 있어야 한다`);
  return matches[0];
}
const sourceLabels = {
  camera: 'Take a photo', gallery: 'Choose from gallery', files: 'Choose from files',
};
const imageError = 'Could not open this image. Choose another supported image.';

async function mountPhoto(t, os = 'android') {
  const app = await mountMeal(t);
  const platform = require('react-native-web').Platform;
  const originalOS = platform.OS;
  platform.OS = os;
  t.after(() => { platform.OS = originalOS; });
  await click(control(app, 'button', 'Dinner'));
  await click(control(app, 'button', 'Restaurant'));
  await click(control(app, 'button', 'Continue to photo'));
  assertPhotoStep(app);
  return { app, original: await readMealDraft('1') };
}

function assertPhotoStep(app) {
  assert.ok(control(app, 'heading', 'Before-meal photo'));
  for (const label of Object.values(sourceLabels)) {
    assert.notEqual(button(app, label).getAttribute('aria-disabled'), 'true');
  }
}

async function assertPreview(app, original) {
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  const stored = await readMealDraft('1');
  assert.equal(stored.photo.uri, photoDevice.copies.at(-1).to);
  assert.equal(app.container.querySelector('img').getAttribute('src'), stored.photo.uri);
  assert.deepEqual(stored, { ...original, photo: stored.photo, step: 'preview' });
  assert.ok(control(app, 'button', 'Add food item'));
  return stored;
}

module.exports = { button, sourceLabels, imageError, mountPhoto, assertPhotoStep, assertPreview };
