// AI-generated with GPT-6, GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 사진 확대·교체 재시도·삭제 후 결과 화면 이동과 기존 입력 보존 검증 · 통합 사진 확인 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, modal, waitForModal, act, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
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
  assert.equal(tile(app, 'After').querySelector('img').getAttribute('src'), draft.afterPhoto.uri);
  assert.deepEqual(await readAfterMealDraft('1', '10'), { ...draft, step: 'preview' });
}
function tile(app, side) {
  return control(app, 'button', `${side} meal: Tap to enlarge`);
}
async function enlargeAndReturn(app, trigger, side, uri) {
  await click(trigger);
  await waitFor(() => app.pathname === '/after-meal-photo' && app.container.querySelector('img'));
  expectRoute(app, '/after-meal-photo');
  assert.equal(new URL(window.location.href).searchParams.get('side'), side);
  assert.ok(control(app, 'heading', side === 'before' ? 'Before Image' : 'After Image'));
  assert.equal(app.container.querySelector('img').getAttribute('src'), uri);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/after-meal-review' && control(app, 'heading', 'Check your photo'));
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
  await expectOutcomes(app, draft, meal);
}
async function openReplacement(app) {
  await click(control(app, 'button', 'Replace photo'));
  await waitForModal('Replace after-meal photo');
  for (const label of Object.values(sourceLabels)) assert.ok(button(modal(), label));
}
async function replace(app, source) {
  await openReplacement(app);
  await click(button(modal(), sourceLabels[source]));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
}

test('식전·식후 사진을 각각 확대하고 돌아와 사진 사용을 누르면 기존 답변이 있는 결과 화면이 바로 열린다', async t => {
  const { app, draft, meal } = await start(t);
  const before = tile(app, 'Before'), after = tile(app, 'After');
  assert.equal(window.getComputedStyle(before.parentElement.parentElement).flexDirection, 'row');
  assert.ok(before.compareDocumentPosition(after) & window.Node.DOCUMENT_POSITION_FOLLOWING);
  await enlargeAndReturn(app, before, 'before', meal.beforePhotoUri);
  await enlargeAndReturn(app, tile(app, 'After'), 'after', draft.afterPhoto.uri);
  await usePhoto(app, draft, meal);
});

test('식전 사진이 없으면 빈자리 안내가 표시되고 식후 사진만으로 결과 입력을 시작할 수 있다', async t => {
  const { app, draft, meal } = await start(t, false);
  assert.ok(app.container.textContent.includes('No before-meal photo'));
  assert.equal(app.container.querySelector('[aria-label="Before meal: Tap to enlarge"]'), null);
  await usePhoto(app, draft, meal);
});

test('저장된 식전 사진을 열 수 없어도 식후 사진과 기존 답변으로 계속 진행할 수 있다', async t => {
  const { app, draft, meal } = await start(t);
  await act(async () => tile(app, 'Before').querySelector('img').dispatchEvent(new window.Event('error')));
  assert.ok(app.container.textContent.includes('No before-meal photo'));
  assert.equal(app.container.querySelector('[aria-label="Before meal: Tap to enlarge"]'), null);
  await usePhoto(app, draft, meal);
});

test('교체 창이나 갤러리에서 취소하고 잘못된 파일을 골라도 기존 사진과 답변으로 진행할 수 있다', async t => {
  const { app, draft, meal } = await start(t);
  await openReplacement(app);
  await click(control(modal(), 'button', 'Cancel'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  await expectPreview(app, draft);
  photoDevice.result = { canceled: true, assets: null };
  await replace(app, 'gallery');
  await expectPreview(app, draft);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
  photoDevice.result = pickedImage({ mimeType: 'application/pdf' });
  await replace(app, 'files');
  await waitFor(() => control(app, 'alert', imageError));
  await expectPreview(app, draft);
  await usePhoto(app, draft, meal);
});

test('현재 식후 사진을 열 수 없으면 진행이 막히고 새 사진으로 교체하면 기존 답변으로 진행할 수 있다', async t => {
  const { app, draft, meal } = await start(t);
  await act(async () => tile(app, 'After').querySelector('img').dispatchEvent(new window.Event('error')));
  await waitFor(() => control(app, 'alert', imageError));
  const use = control(app, 'button', 'Use this photo');
  assert.equal(use.getAttribute('aria-disabled'), 'true');
  await click(use);
  await expectPreview(app, draft);
  const uri = 'file:///replacement.png';
  photoDevice.result = pickedImage({ uri });
  await replace(app, 'gallery');
  await waitFor(() => tile(app, 'After').querySelector('img').getAttribute('src') === uri);
  assert.equal(tile(app, 'Before').querySelector('img').getAttribute('src'), meal.beforePhotoUri);
  const updated = await readAfterMealDraft('1', '10');
  assert.deepEqual(updated, { ...draft, afterPhoto: updated.afterPhoto });
  assert.equal(updated.afterPhoto.uri, uri);
  assert.equal(app.container.querySelector('[role="alert"]'), null);
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
