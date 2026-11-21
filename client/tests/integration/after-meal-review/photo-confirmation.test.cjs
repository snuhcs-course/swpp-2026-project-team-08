// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 사진 확대·교체 재시도·삭제 후 결과 화면 이동과 기존 입력 보존 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels, imageError } = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { reviewPhotoFixture } = require('../../fixtures/after-meal-photo.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { mealKeys } = require('../../../src/data/queries/mealQueryKeys.ts');
const { colors } = require('../../../src/util/colors.ts');

async function start(t, before = true) {
  const { response, draft } = reviewPhotoFixture(before);
  await saveAfterMealDraft(draft);
  const app = await mountMeal(t, { initialPath: '/home', meals: [response], respond: (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(response);
  } });
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
  await waitFor(() => card());
  await click(card());
  await expectPreview(app, draft);
  return { app, draft, meal: toMealDetail(response) };
}
function expectRoute(app, pathname = '/after-meal-review') {
  assert.equal(app.pathname, pathname);
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
async function expectPreview(app, draft) {
  await waitFor(() => control(app, 'heading', 'Check your photo'));
  expectRoute(app);
  assert.equal(app.container.querySelector('img').getAttribute('src'), draft.afterPhoto.uri);
  assert.deepEqual(await readAfterMealDraft('1', '10'), { ...draft, step: 'preview' });
}
async function enlargeAndReturn(app, trigger, side, uri, heading) {
  await click(trigger);
  await waitFor(() => app.pathname === '/after-meal-photo' && app.container.querySelector('img'));
  expectRoute(app, '/after-meal-photo');
  assert.equal(new URL(window.location.href).searchParams.get('side'), side);
  assert.ok(control(app, 'heading', side === 'before' ? 'Before Image' : 'After Image'));
  assert.equal(app.container.querySelector('img').getAttribute('src'), uri);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/after-meal-review' && control(app, 'heading', heading));
}
function selectedOutcomes(app, name) {
  const slider = control(app, 'slider', name);
  const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;
  return [...slider.parentElement.querySelectorAll('[role="radio"]')]
    .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
    .map(node => node.textContent);
}
async function expectOutcomes(app, draft, meal) {
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  expectRoute(app);
  assert.ok(app.container.textContent.includes('Rice'));
  assert.ok(app.container.textContent.includes('Soup'));
  await click(control(app, 'button', 'Expand or collapse Rice'));
  assert.deepEqual(selectedOutcomes(app, 'Rice'), ['Tasted']);
  assert.deepEqual(selectedOutcomes(app, 'Carrot'), ['Untouched']);
  assert.deepEqual(selectedOutcomes(app, 'Soup'), []);
  assert.ok(control(app, 'checkbox', 'Egg'));
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Egg"]'), null);
  assert.deepEqual(await readAfterMealDraft('1', '10'), { ...draft, step: 'outcomes' });
  assert.deepEqual(app.client.getQueryData(mealKeys.detail('1', '10')), meal);
}
async function usePhoto(app, draft, meal) {
  await click(control(app, 'button', 'Use this photo'));
  if (meal.beforePhotoUri) {
    await waitFor(() => control(app, 'heading', 'Review meal photos'));
    assert.equal(control(app, 'button', 'BEFORE: Tap to enlarge').querySelector('img').getAttribute('src'), meal.beforePhotoUri);
    assert.equal(control(app, 'button', 'AFTER: Tap to enlarge').querySelector('img').getAttribute('src'), draft.afterPhoto.uri);
    await click(control(app, 'button', 'Enter food outcomes'));
  }
  await expectOutcomes(app, draft, meal);
}
async function replace(app, source) {
  await click(control(app, 'button', 'Replace photo'));
  await click(button(app, sourceLabels[source]));
  await waitFor(() => ![...app.container.querySelectorAll('[role="button"]')]
    .some(node => node.textContent.startsWith(sourceLabels[source])));
}

test('식후 사진을 확대해 확인하고 돌아온 뒤 Use this photo로 진행하면 기존 음식과 답변이 있는 결과 입력 화면이 열린다', async t => {
  for (const before of [true, false]) {
    await t.test(before ? '식전 사진이 있으면 전후 사진 비교를 거쳐 진행한다' : '식전 사진이 없으면 결과 입력으로 바로 진행한다', async t => {
      const { app, draft, meal } = await start(t, before);
      await enlargeAndReturn(app, control(app, 'button', 'Tap to enlarge'), 'after', draft.afterPhoto.uri, 'Check your photo');
      await expectPreview(app, draft);
      if (before) {
        await click(control(app, 'button', 'Use this photo'));
        await waitFor(() => control(app, 'heading', 'Review meal photos'));
        for (const [side, uri] of [['before', meal.beforePhotoUri], ['after', draft.afterPhoto.uri]]) {
          await enlargeAndReturn(app, control(app, 'button', `${side.toUpperCase()}: Tap to enlarge`), side, uri, 'Review meal photos');
        }
        await click(control(app, 'button', 'Enter food outcomes'));
        await expectOutcomes(app, draft, meal);
      } else await usePhoto(app, draft, meal);
    });
  }
});

test('사진 교체를 취소하거나 실패하면 기존 사진과 입력이 남고, 다시 교체에 성공하면 새 사진과 기존 답변으로 결과 입력을 이어갈 수 있다', async t => {
  const { app, draft, meal } = await start(t);
  photoDevice.result = { canceled: true, assets: null };
  await replace(app, 'gallery');
  await expectPreview(app, draft);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  assert.notEqual(control(app, 'button', 'Use this photo').getAttribute('aria-disabled'), 'true');

  photoDevice.result = pickedImage({ mimeType: 'application/pdf' });
  await replace(app, 'files');
  await waitFor(() => control(app, 'alert', imageError));
  await expectPreview(app, draft);
  assert.equal(control(app, 'button', 'Use this photo').getAttribute('aria-disabled'), 'true');
  await click(control(app, 'button', 'Use this photo'));
  await expectPreview(app, draft);

  const uri = 'file:///replacement.png';
  photoDevice.result = pickedImage({ uri });
  await replace(app, 'gallery');
  await waitFor(() => app.container.querySelector('img').getAttribute('src') === uri);
  const updated = await readAfterMealDraft('1', '10');
  assert.deepEqual(updated, { ...draft, afterPhoto: updated.afterPhoto });
  assert.equal(updated.afterPhoto.uri, uri);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  assert.notEqual(control(app, 'button', 'Use this photo').getAttribute('aria-disabled'), 'true');
  await usePhoto(app, updated, meal);
});

test('식후 사진을 삭제하고 건너뛰면 기존 음식과 답변이 유지된 결과 입력 화면이 열린다', async t => {
  const { app, draft, meal } = await start(t);
  await click(control(app, 'button', 'Remove photo'));
  await waitFor(() => control(app, 'heading', 'after-meal photo'));
  expectRoute(app);
  assert.equal(app.container.querySelector('img'), null);
  const removed = { ...draft, afterPhoto: null, step: 'photo' };
  assert.deepEqual(await readAfterMealDraft('1', '10'), removed);
  await click(button(app, 'Continue without photo'));
  await expectOutcomes(app, removed, meal);
  assert.equal(meal.beforePhotoUri, 'file:///before.png');
});
