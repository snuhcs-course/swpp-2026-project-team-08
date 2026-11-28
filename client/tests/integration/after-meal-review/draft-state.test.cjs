// AI-generated with GPT-6, GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 초안 저장·재개·Retry 및 재개 직후 진입 화면 복귀 검증 · 통합 사진 확인 흐름 검증
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 식후 검토 진입 시 식사별 추천 조회 제거

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, deferred, storage, photoDevice } = require('../../helpers/meal-checkin-screen.cjs');
const { button, sourceLabels } = require('../../helpers/meal-photo-screen.cjs');
const { pickedImage } = require('../../helpers/photo-device.cjs');
const { entryMeal } = require('../../fixtures/after-meal-entry.cjs');
const { readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { colors } = require('../../../src/util/colors.ts');
const key = 'nurturebites.after-meal.1.10.draft.v1';
const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;

async function mount(t) {
  const meal = { ...entryMeal(), before_photo_uri: 'file:///before.png' };
  const requests = [];
  const app = await mountMeal(t, { initialPath: '/home', meals: [meal], respond: (path, method) => {
    requests.push([method, path]);
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(meal);
  } });
  t.after(() => assert.ok(requests.every(([method]) => method === 'GET'), '초안 저장·재개는 서버 리뷰를 제출하지 않는다'));
  await waitFor(() => pendingCard(app));
  return app;
}
function pendingCard(app) {
  return [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
}
async function openReview(app, title) {
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
  assert.ok(control(app, 'button', 'Log new meal'));
}
async function attachPhoto(app) {
  photoDevice.result = pickedImage({ uri: 'file:///after.png' });
  await click(button(app, sourceLabels.gallery));
  await expectStep(app, 'Check your photo');
  return control(app, 'button', 'After meal: Tap to enlarge').querySelector('img').getAttribute('src');
}
async function enterOutcomes(app) {
  await click(control(app, 'button', 'Use this photo'));
  await expectStep(app, 'What happened with each food item?');
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
  const choice = radios(app, name).find(node => node.textContent === outcome);
  assert.ok(choice);
  await click(choice);
}
function expectSelected(app, name, expected) {
  assert.deepEqual(radios(app, name)
    .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
    .map(node => node.textContent), expected === null ? [] : [expected]);
}
async function partialAnswers(app) {
  await select(app, 'Rice', 'Tasted');
  await click(control(app, 'checkbox', 'Carrot'));
  await select(app, 'Carrot', 'Untouched');
  await click(control(app, 'checkbox', 'Egg'));
}
async function expectPartial(app) {
  await expectStep(app, 'What happened with each food item?');
  await expand(app, 'Rice');
  await expand(app, 'Soup');
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Carrot', 'Untouched');
  expectSelected(app, 'Egg', null);
  expectSelected(app, 'Soup', null);
  assert.equal(control(app, 'button', 'Continue').getAttribute('aria-disabled'), 'true');
}
function editor(app, name) {
  const label = [...app.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === name);
  assert.ok(label);
  let container = label.parentElement;
  while (container && !container.querySelector('[aria-label="Select category"]')) container = container.parentElement;
  assert.ok(container);
  return { container };
}
async function choose(app, name, field, value) {
  const target = editor(app, name);
  await click(control(target, 'button', field));
  const option = [...target.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === value);
  assert.ok(option, `${name}의 ${field}에 ${value} 선택지가 있어야 한다`);
  await click(option.closest('[role="button"]'));
}
function holdWrite(t) {
  const write = storage.setItem.bind(storage);
  const pending = deferred();
  const writes = [];
  const mock = t.mock.method(storage, 'setItem', async (storageKey, value) => {
    if (storageKey === key) { writes.push(JSON.parse(value)); await pending.promise; }
    return write(storageKey, value);
  });
  return { pending, writes, mock };
}

// 실제 식후 리뷰는 사진 화면에서 Save as Draft & Exit, 결과 화면에서 Save & exit을 사용한다.
test('초안을 저장하고 다시 열면 같은 식후 사진과 음식·재료의 답변 및 미응답이 복원된다', async t => {
  const app = await mount(t);
  await openReview(app, 'after-meal photo');
  const photo = await attachPhoto(app);
  const preview = await readAfterMealDraft('1', '10');
  const held = holdWrite(t);
  await click(control(app, 'button', 'Save as Draft & Exit'));
  await waitFor(() => held.writes.length === 1);
  await expectStep(app, 'Check your photo');
  assert.ok(app.container.textContent.includes('Saving…'));
  assert.equal(control(app, 'button', 'After meal: Tap to enlarge').querySelector('img').getAttribute('src'), photo);
  await act(async () => held.pending.resolve());
  held.mock.mock.restore();
  await expectHome(app);
  await openReview(app, 'Check your photo');
  assert.equal(control(app, 'button', 'After meal: Tap to enlarge').querySelector('img').getAttribute('src'), photo);
  assert.deepEqual(await readAfterMealDraft('1', '10'), preview);
  await enterOutcomes(app);
  await partialAnswers(app);
  await expectPartial(app);
  const answered = await readAfterMealDraft('1', '10');
  await click(control(app, 'button', 'Save & exit'));
  await expectHome(app);
  await openReview(app, 'What happened with each food item?');
  await expectPartial(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), answered);
  assert.equal(answered.afterPhoto.uri, photo);
});

test('앱을 다시 열고 식사 상세에서 리뷰를 이어가면 저장한 어려움과 작성 중 사유가 복원된다', async t => {
  const app = await mount(t);
  await openReview(app, 'after-meal photo');
  const photo = await attachPhoto(app);
  await enterOutcomes(app);
  await select(app, 'Rice', 'Eaten');
  await select(app, 'Soup', 'Unclear');
  await click(control(app, 'checkbox', 'Carrot'));
  await select(app, 'Carrot', 'Tasted');
  await click(control(app, 'button', 'Continue'));
  await expectStep(app, 'What made this food difficult?');
  await choose(app, 'Rice', 'Select category', 'Colors');
  await choose(app, 'Rice', 'value', 'Yellow');
  await click(control(editor(app, 'Rice'), 'button', '+ Add'));
  await choose(app, 'Rice', 'Select category', 'Food Smells');
  await choose(app, 'Rice', 'value', 'Cool mint-like smell');
  await choose(app, 'Carrot in Rice', 'Select category', 'Texture');
  await choose(app, 'Carrot in Rice', 'Select texture characteristic', 'How hard it feels');
  await waitFor(async () => {
    const draft = await readAfterMealDraft('1', '10');
    const carrotId = draft.outcomes[0].ingredients[0].id;
    return draft.step === 'difficulties' && draft.difficultyInputs['1']?.value === 'mint'
      && draft.difficultyInputs[carrotId]?.subcategory === 'hardness';
  });
  const before = await readAfterMealDraft('1', '10');
  await app.unmount();
  const reopened = await mount(t);
  await click(control(reopened, 'button', 'View meal history'));
  await waitFor(() => reopened.pathname === '/section/mealLog' && control(reopened, 'heading', 'Meal History'));
  await click(control(reopened, 'button', 'clear'));
  const mealCard = () => [...reopened.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Rice') && node.textContent.includes('Soup'));
  await waitFor(() => mealCard());
  await click(mealCard());
  await waitFor(() => reopened.pathname === '/meal/10' && control(reopened, 'button', 'Continue Review'));
  await click(control(reopened, 'button', 'Continue Review'));
  await expectStep(reopened, 'What made this food difficult?');
  assert.ok(control(editor(reopened, 'Rice'), 'button', 'Remove: Colors: Yellow'));
  assert.equal(control(editor(reopened, 'Rice'), 'button', 'value').textContent, 'Cool mint-like smell');
  assert.equal(control(editor(reopened, 'Carrot in Rice'), 'button', 'Select texture characteristic').textContent, 'How hard it feels');
  assert.equal(control(editor(reopened, 'Carrot in Rice'), 'button', 'value').textContent, 'value');
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
  await click(control(reopened, 'button', 'Go back'));
  await waitFor(() => reopened.pathname === '/meal/10' && control(reopened, 'button', 'Continue Review'));
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
  assert.equal(before.afterPhoto.uri, photo);
  await click(control(reopened, 'button', 'Continue Review'));
  await expectStep(reopened, 'What made this food difficult?');
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
});

test('Save as Draft & Exit의 저장이 실패하면 현재 화면과 입력을 유지하고, Retry 성공 후 다시 저장하고 나갔다 돌아오면 같은 입력이 표시된다', async t => {
  const app = await mount(t);
  await openReview(app, 'after-meal photo');
  await click(button(app, 'Continue without photo'));
  await expectStep(app, 'What happened with each food item?');
  await partialAnswers(app);
  const before = await readAfterMealDraft('1', '10');
  const held = holdWrite(t);
  await click(control(app, 'button', 'Save & exit'));
  await waitFor(() => held.writes.length === 1);
  await expectPartial(app);
  assert.ok(app.container.textContent.includes('Saving…'));
  await act(async () => held.pending.reject(new Error('Disk full')));
  await waitFor(() => control(app, 'button', 'Retry'));
  await expectPartial(app);
  assert.ok(app.container.textContent.includes('Could not save the review. Your answers are preserved.'));
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
  held.mock.mock.restore();
  await click(control(app, 'button', 'Retry'));
  await waitFor(() => app.container.textContent.includes('Auto-saved') && !app.container.textContent.includes('Could not save'));
  await expectPartial(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
  await click(control(app, 'button', 'Save & exit'));
  await expectHome(app);
  await openReview(app, 'What happened with each food item?');
  await expectPartial(app);
  assert.deepEqual(await readAfterMealDraft('1', '10'), before);
});
