// AI-generated with GPT-6, GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 재개·편집 취소·사진별 단계 왕복과 진입 화면 복귀의 사용자 흐름 검증 · 통합 사진 확인 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, enter, input, modal, waitForModal, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels } = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { colors } = require('../../../src/util/colors.ts');
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');

const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;

async function start(t, { step = 'outcomes', beforePhoto = true } = {}) {
  const response = { ...entryMeal(), before_photo_uri: beforePhoto ? 'file:///before.png' : null };
  const draft = { ...unfinishedReview(), step };
  if (step === 'photo') draft.afterPhoto = null;
  await saveAfterMealDraft(draft);
  const app = await mountMeal(t, { initialPath: '/home', meals: [response], respond: (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(response);
    if (method === 'GET' && path === '/api/v1/meals/10/suggestions') return Response.json([]);
  } });
  await waitFor(() => pendingCard(app));
  return app;
}
function pendingCard(app) {
  return [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
}
async function resume(app, title = 'What happened with each food item?') {
  await click(pendingCard(app));
  await expectStep(app, title);
}
async function expectStep(app, title) {
  await waitFor(() => control(app, 'heading', title));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
async function expectHome(app) {
  await waitFor(() => app.pathname === '/home' && pendingCard(app));
}

async function expand(app, name) {
  if (!app.container.querySelector(`[role="slider"][aria-label="${name}"]`)) {
    await click(control(app, 'button', `Expand or collapse ${name}`));
  }
}
function radios(app, name) {
  return [...control(app, 'slider', name).parentElement.querySelectorAll('[role="radio"]')];
}
async function select(app, name, outcome) {
  await expand(app, name);
  await click(radios(app, name).find(node => node.textContent === outcome));
}
async function expectAnswers(app) {
  await expand(app, 'Rice');
  await expand(app, 'Soup');
  for (const [name, outcome] of [['Rice', 'Tasted'], ['Carrot', 'Untouched'], ['Soup', 'Unclear']]) {
    assert.deepEqual(radios(app, name)
      .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
      .map(node => node.textContent), [outcome]);
  }
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Egg"]'), null);
}
async function cancelFoodEdit(app, action) {
  await expand(app, 'Rice');
  const card = control(app, 'button', 'Expand or collapse Rice').parentElement;
  await click(control({ container: card }, 'button', 'Edit'));
  await waitForModal('Edit Rice');
  assert.equal(input(modal(), 'Food name').value, 'Rice');
  await enter(modal(), 'Food name', 'Changed rice');
  await click(control(modal(), 'button', action));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  await expectStep(app, 'What happened with each food item?');
  assert.ok(control(app, 'button', 'Expand or collapse Rice'));
  assert.equal(app.container.textContent.includes('Changed rice'), false);
  await expectAnswers(app);
}
function editor(app) {
  const label = [...app.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === 'Rice');
  assert.ok(label);
  let container = label.parentElement;
  while (container && !container.querySelector('[aria-label="Select category"]')) container = container.parentElement;
  assert.ok(container);
  return { container };
}
async function addReason(app) {
  const target = editor(app);
  await click(control(target, 'button', 'value'));
  const firm = [...target.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === 'Firm');
  assert.ok(firm);
  await click(firm.closest('[role="button"]'));
  await click(control(target, 'button', '+ Add'));
  assert.ok(control(target, 'button', 'Remove: Texture · How hard it feels: Firm'));
}
async function openDetails(app) {
  await click(control(app, 'button', 'View meal history'));
  await waitFor(() => app.pathname === '/section/mealLog' && control(app, 'heading', 'Meal History'));
  await click(control(app, 'button', 'clear'));
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Rice') && node.textContent.includes('Soup'));
  await waitFor(() => card());
  await click(card());
  await waitFor(() => app.pathname === '/meal/10' && control(app, 'button', 'Continue Review'));
}

test('결과 화면을 재개해 음식 수정을 취소하면 답변이 유지되고, 진행 전 뒤로가기는 홈으로 돌아간다', async t => {
  const app = await start(t);
  await resume(app);
  await select(app, 'Soup', 'Unclear');
  await cancelFoodEdit(app, 'Cancel');
  await cancelFoodEdit(app, 'Close');
  await waitFor(() => app.container.textContent.includes('Auto-saved'));
  const answered = await readAfterMealDraft('1', '10');
  await click(control(app, 'button', 'Go back'));
  await expectHome(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
  await resume(app);
  await click(control(app, 'button', 'Continue'));
  await expectStep(app, 'What made this food difficult?');
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'What happened with each food item?');
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'Check your photo');
  await click(control(app, 'button', 'Use this photo'));
  await expectStep(app, 'What happened with each food item?');
  await expectAnswers(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
  await click(control(app, 'button', 'Save & exit'));
  await expectHome(app);
  await resume(app);
  await click(control(app, 'button', 'Go back'));
  await expectHome(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
});

test('사진을 확대하고 돌아와도 재개 직후에는 홈으로 나가고, 진행 후에는 사진 확인을 왕복해도 답변과 사유가 유지된다', async t => {
  const app = await start(t, { step: 'preview' });
  await resume(app, 'Check your photo');
  await click(control(app, 'button', 'After meal: Tap to enlarge'));
  await waitFor(() => app.pathname === '/after-meal-photo' && control(app, 'heading', 'After Image'));
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'Check your photo');
  await click(control(app, 'button', 'Go back'));
  await expectHome(app);
  await resume(app, 'Check your photo');
  await click(control(app, 'button', 'Use this photo'));
  await expectStep(app, 'What happened with each food item?');
  await select(app, 'Soup', 'Unclear');
  await click(control(app, 'button', 'Continue'));
  await expectStep(app, 'What made this food difficult?');
  await addReason(app);
  const answered = await readAfterMealDraft('1', '10');
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'What happened with each food item?');
  await expectAnswers(app);
  await click(control(app, 'button', 'Go back'));
  await expectStep(app, 'Check your photo');
  assert.deepEqual(await readAfterMealDraft('1', '10'), { ...answered, step: 'preview' });
  await click(control(app, 'button', 'Use this photo'));
  await expectStep(app, 'What happened with each food item?');
  await expectAnswers(app);
  await click(control(app, 'button', 'Continue'));
  await expectStep(app, 'What made this food difficult?');
  assert.ok(control(editor(app), 'button', 'Remove: Colors: Yellow'));
  assert.ok(control(editor(app), 'button', 'Remove: Texture · How hard it feels: Firm'));
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
});

test('식사 상세에서 시작한 리뷰는 사진 유무에 맞는 이전 단계로 돌아가고, 사진 선택에서 다시 뒤로가면 같은 식사 상세가 열린다', async t => {
  for (const withAfterPhoto of [true, false]) {
    await t.test(withAfterPhoto ? '식후 사진만 있으면 결과에서 사진 확인으로 돌아간다' : '식후 사진이 없으면 결과에서 사진 선택으로 돌아간다', async t => {
      const app = await start(t, { step: 'photo', beforePhoto: false });
      await openDetails(app);
      await click(control(app, 'button', 'Continue Review'));
      await expectStep(app, 'after-meal photo');
      if (withAfterPhoto) {
        photoDevice.result = pickedImage({ uri: 'file:///after-only.png' });
        await click(button(app, sourceLabels.gallery));
        await expectStep(app, 'Check your photo');
        await click(control(app, 'button', 'Use this photo'));
      } else await click(button(app, 'Continue without photo'));
      await expectStep(app, 'What happened with each food item?');
      await select(app, 'Soup', 'Unclear');
      await click(control(app, 'button', 'Continue'));
      await expectStep(app, 'What made this food difficult?');
      const answered = await readAfterMealDraft('1', '10');
      await click(control(app, 'button', 'Go back'));
      await expectStep(app, 'What happened with each food item?');
      await expectAnswers(app);
      await click(control(app, 'button', 'Go back'));
      await expectStep(app, withAfterPhoto ? 'Check your photo' : 'after-meal photo');
      if (withAfterPhoto) {
        assert.equal(app.container.querySelector('img').getAttribute('src'), answered.afterPhoto.uri);
        await click(control(app, 'button', 'Go back'));
        await expectStep(app, 'after-meal photo');
      }
      const beforeExit = { ...answered, step: 'photo' };
      assert.deepEqual(await readAfterMealDraft('1', '10'), beforeExit);
      await click(control(app, 'button', 'Go back'));
      await waitFor(() => app.pathname === '/meal/10' && control(app, 'button', 'Continue Review'));
      assert.deepEqual(await readAfterMealDraft('1', '10'), beforeExit);
    });
  }
});
