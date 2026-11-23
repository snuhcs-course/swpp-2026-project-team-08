// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 확대 확인·교체 재시도·삭제 후 건너뛰기의 대표 사용자 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, photoDevice, modal, waitForModal }
  = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels, imageError, assertPhotoStep, assertPreview }
  = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { photoDraft } = require('../../fixtures/meal-photo.cjs');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');

async function mountPreview(t) {
  const original = photoDraft();
  await saveMealDraft(original);
  const app = await mountMeal(t);
  const platform = require('react-native-web').Platform;
  const originalOS = platform.OS;
  platform.OS = 'android';
  t.after(() => { platform.OS = originalOS; });
  await click(control(app, 'button', 'Continue draft'));
  await expectPreview(app, original);
  return { app, original };
}

async function expectPreview(app, expected) {
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  assert.equal(app.container.querySelector('img').getAttribute('src'), expected.photo.uri);
  assert.deepEqual(await readMealDraft('1'), { ...expected, step: 'preview' });
}

async function openReplacement(app) {
  await click(control(app, 'button', 'Replace photo'));
  await waitForModal('Replace this photo?');
  assert.ok(modal().container.textContent.includes(
      'Choosing a valid replacement photo will clear your food list, food details, and suggestion links. Your meal date, type, and setting will stay.'));
  assert.ok(modal().container.textContent.includes('Cancel or an invalid image keeps everything.'));
  await click(control(modal(), 'button', 'Replace photo'));
  await waitForModal('Replace meal check-in photo');
  for (const label of Object.values(sourceLabels)) assert.ok(button(modal(), label));
}

async function chooseReplacement(app, source = 'gallery') {
  await openReplacement(app);
  await click(button(modal(), sourceLabels[source]));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
}

async function expectFoodList(app, expected) {
  await waitFor(() => control(app, 'heading', 'Review food items'));
  assert.ok(app.container.textContent.includes('16 November 2026 · Dinner · Restaurant'));
  assert.ok(app.container.textContent.includes(`${expected.foods.length} food items`));
  assert.equal(app.container.querySelector('img')?.getAttribute('src') ?? null, expected.photo?.uri ?? null);
  if (expected.photo) assert.ok(app.container.textContent.includes('Before meal'));
  if (!expected.foods.length) assert.ok(app.container.textContent.includes('No foods added yet'));
  const names = expected.foods.map(food => food.name);
  assert.deepEqual([...app.container.querySelectorAll('[role="button"]')]
    .map(element => element.textContent).filter(text => names.includes(text)), names);
  for (const food of expected.foods) {
    const card = control(app, 'button', food.name);
    // RN Web은 accessibilityState.expanded를 내보내지 않아 펼친 카드의 Edit 버튼으로 구분한다.
    if (![...card.parentElement.querySelectorAll('[role="button"]')]
      .some(element => element.textContent === 'Edit')) await click(card);
    for (const text of [...food.ingredients, ({ steamed: 'Steamed', boiled: 'Boiled' })[food.preparation], food.servingNote,
      ...expected.suggestionLinks.filter(link => link.foodId === food.id).map(link => link.title)]) {
      assert.ok([...card.parentElement.querySelectorAll('*')]
        .some(element => element.textContent === text), `${food.name}: ${text}`);
    }
  }
  // 화면에 노출되지 않는 음식 ID·수용도·연결 스냅샷도 함께 보존되어야 한다.
  assert.deepEqual(await readMealDraft('1'), { ...expected, step: 'foods' });
}

async function continueToFoods(app, expected) {
  const next = control(app, 'button', 'Add food item');
  assert.notEqual(next.getAttribute('aria-disabled'), 'true');
  await click(next);
  await expectFoodList(app, expected);
}

test('사진을 확대해 확인하고 돌아온 뒤 음식 목록으로 진행하면 같은 사진과 기존 음식·연결이 표시된다', async t => {
  const { app, original } = await mountPreview(t);
  await click(app.container.querySelector('[aria-label="Tap to view full photo"]'));
  await waitFor(() => app.pathname === '/meal-photo' && control(app, 'heading', 'Before Image'));
  await waitFor(() => app.container.querySelector('img'));
  assert.equal(app.container.querySelector('img').getAttribute('src'), original.photo.uri);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/meal-checkin');
  await expectPreview(app, original);
  await continueToFoods(app, original);
});

test('사진 교체를 취소하거나 실패하면 기존 입력이 남고, 다시 교체에 성공하면 새 사진과 빈 음식 목록이 표시된다', async t => {
  const { app, original } = await mountPreview(t);
  await click(control(app, 'button', 'Replace photo'));
  await waitForModal('Replace this photo?');
  await click(control(modal(), 'button', 'Cancel'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  await expectPreview(app, original);

  photoDevice.result = { canceled: true, assets: null };
  await chooseReplacement(app);
  await expectPreview(app, original);
  assert.equal(app.container.querySelector('[role="alert"]'), null);

  photoDevice.result = pickedImage({ mimeType: 'application/pdf' });
  await chooseReplacement(app, 'files');
  await waitFor(() => control(app, 'alert', imageError));
  await expectPreview(app, original);

  photoDevice.result = pickedImage({ uri: 'file:///cache/replacement.png' });
  await chooseReplacement(app);
  const updated = await assertPreview(app, { ...original, foods: [], suggestionLinks: [],
    editingFood: null, editingSuggestionLink: null });
  assert.notEqual(updated.photo.uri, original.photo.uri);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  await continueToFoods(app, updated);
  for (const text of [...original.foods.map(food => food.name), original.suggestionLinks[0].title]) {
    assert.ok(!app.container.textContent.includes(text));
  }
  assert.equal(control(app, 'button', 'Save check-in').getAttribute('aria-disabled'), 'true');
  assert.ok(control(app, 'button', 'Add food item'));
});

test('사진을 삭제하고 건너뛰면 사진 없이 기존 음식과 추천 연결이 있는 음식 목록으로 이동한다', async t => {
  const { app, original } = await mountPreview(t);
  await click(control(app, 'button', 'Remove photo'));
  assertPhotoStep(app);
  assert.equal(app.container.querySelector('img'), null);
  await click(button(app, 'Skip photo'));
  await expectFoodList(app, { ...original, photo: null });
});
