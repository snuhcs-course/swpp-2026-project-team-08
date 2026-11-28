// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 어려움 대상·태그·입력·Skip 검증 및 결과에서 진행 후 왕복
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 식후 검토 완료 화면의 홈 이동 확인

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act } = require('../../helpers/meal-checkin-screen.cjs');
const { difficultyFixture } = require('../../fixtures/after-meal-difficulties.cjs');
const { reviewResponse } = require('../../fixtures/server-meal.cjs');
const { saveAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { colors } = require('../../../src/util/colors.ts');

const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;
async function start(t) {
  const { response, draft } = difficultyFixture();
  await saveAfterMealDraft({ ...draft, step: 'outcomes' });
  const writes = [];
  let serverMeal = response;
  const app = await mountMeal(t, { initialPath: '/home', meals: [response], respond: (path, method, init) => {
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(serverMeal);
    if (method === 'PUT' && path === '/api/v1/meals/10/review') {
      const body = JSON.parse(init.body);
      writes.push(body);
      serverMeal = reviewResponse(serverMeal, body);
      return Response.json(serverMeal);
    }
  } });
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
  await waitFor(() => card());
  await click(card());
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  await click(control(app, 'button', 'Continue'));
  await expectDifficulties(app);
  return { app, writes };
}
async function expectDifficulties(app) {
  await waitFor(() => control(app, 'heading', 'What made this food difficult?'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
function editor(app, name) {
  const label = [...app.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === name);
  assert.ok(label, `${name}의 어려움 입력 영역이 있어야 한다`);
  let container = label.parentElement;
  while (container && !container.querySelector('[aria-label="Select category"]')) container = container.parentElement;
  assert.ok(container);
  assert.equal(container.querySelectorAll('[aria-label="Select category"]').length, 1);
  return { container };
}
async function choose(app, name, field, option) {
  const target = editor(app, name);
  await click(control(target, 'button', field));
  const text = [...target.container.querySelectorAll('div,span')]
    .find(node => node.childElementCount === 0 && node.textContent === option);
  assert.ok(text, `${name}의 ${field}에 ${option} 선택지가 있어야 한다`);
  await click(text.closest('[role="button"]'));
}
function tags(app, name) {
  return [...editor(app, name).container.querySelectorAll('[role="button"][aria-label^="Remove:"]')]
    .map(node => node.getAttribute('aria-label').slice('Remove: '.length));
}
async function add(app, name, category, value) {
  await choose(app, name, 'Select category', category);
  await choose(app, name, 'value', value);
  const button = control(editor(app, name), 'button', '+ Add');
  assert.notEqual(button.getAttribute('aria-disabled'), 'true');
  await click(button);
  assert.equal(control(editor(app, name), 'button', 'value').textContent, 'value');
}
async function expectCannotAdd(app, name) {
  const before = tags(app, name);
  const button = control(editor(app, name), 'button', '+ Add');
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  await click(button);
  assert.deepEqual(tags(app, name), before);
}
async function typeNote(app, name, value) {
  const field = editor(app, name).container.querySelector('textarea[aria-label="Optional note"]');
  assert.ok(field);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(field, value);
    field.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
async function expectOutcome(app, name, result) {
  if (!app.container.querySelector(`[role="slider"][aria-label="${name}"]`)) {
    await click(control(app, 'button', `Expand or collapse ${name}`));
  }
  const slider = control(app, 'slider', name);
  assert.deepEqual([...slider.parentElement.querySelectorAll('[role="radio"]')]
    .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
    .map(node => node.textContent), [result]);
}

test('Eaten 음식과 재료에 어려움을 추가하고 음식의 냄새를 변경하거나 색 하나를 삭제해도 재료의 태그는 유지되며, 화면 왕복 후에도 남은 태그가 표시된다', async t => {
  const { app, writes } = await start(t);
  await add(app, 'Rice', 'Colors', 'Red');
  await add(app, 'Rice', 'Colors', 'Yellow');
  await add(app, 'Carrot in Rice', 'Colors', 'Red');
  await add(app, 'Rice', 'Food Smells', 'Fruit-like');
  await add(app, 'Rice', 'Food Smells', 'Cool mint-like smell');
  assert.deepEqual(tags(app, 'Rice'), ['Colors: Red', 'Colors: Yellow', 'Food Smells: Cool mint-like smell']);
  await click(control(editor(app, 'Rice'), 'button', 'Remove: Colors: Red'));
  assert.deepEqual(tags(app, 'Rice'), ['Colors: Yellow', 'Food Smells: Cool mint-like smell']);
  assert.deepEqual(tags(app, 'Carrot in Rice'), ['Colors: Red']);
  assert.deepEqual(tags(app, 'Soup'), []);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  await expectOutcome(app, 'Rice', 'Eaten');
  await expectOutcome(app, 'Carrot', 'Tasted');
  await expectOutcome(app, 'Soup', 'Unclear');
  await click(control(app, 'button', 'Continue'));
  await expectDifficulties(app);
  assert.deepEqual(tags(app, 'Rice'), ['Colors: Yellow', 'Food Smells: Cool mint-like smell']);
  assert.deepEqual(tags(app, 'Carrot in Rice'), ['Colors: Red']);
  assert.deepEqual(tags(app, 'Soup'), []);
  assert.deepEqual(writes, []);
});

test('Texture 세부 항목을 바꾸면 값을 다시 선택해야 추가할 수 있고, 이후 Other에 문구를 입력해 추가하면 기존 Texture와 Other 태그가 함께 표시된다', async t => {
  const { app, writes } = await start(t);
  await choose(app, 'Rice', 'Select category', 'Texture');
  assert.equal(control(editor(app, 'Rice'), 'button', 'value').getAttribute('aria-disabled'), 'true');
  await expectCannotAdd(app, 'Rice');
  await choose(app, 'Rice', 'Select texture characteristic', 'How hard it feels');
  await choose(app, 'Rice', 'value', 'Hard');
  assert.notEqual(control(editor(app, 'Rice'), 'button', '+ Add').getAttribute('aria-disabled'), 'true');
  await choose(app, 'Rice', 'Select texture characteristic', 'How moist it feels');
  assert.equal(control(editor(app, 'Rice'), 'button', 'value').textContent, 'value');
  await expectCannotAdd(app, 'Rice');
  await choose(app, 'Rice', 'value', 'Dry');
  await click(control(editor(app, 'Rice'), 'button', '+ Add'));
  assert.deepEqual(tags(app, 'Rice'), ['Texture · How moist it feels: Dry']);
  assert.equal(control(editor(app, 'Rice'), 'button', 'Select texture characteristic').textContent, 'Select texture characteristic');
  await choose(app, 'Rice', 'Select texture characteristic', 'How hard it feels');
  await choose(app, 'Rice', 'value', 'Hard');
  await choose(app, 'Rice', 'Select category', 'Colors');
  assert.equal(control(editor(app, 'Rice'), 'button', 'value').textContent, 'value');
  await expectCannotAdd(app, 'Rice');
  await choose(app, 'Rice', 'value', 'Other');
  await expectCannotAdd(app, 'Rice');
  await typeNote(app, 'Rice', '   ');
  await expectCannotAdd(app, 'Rice');
  await typeNote(app, 'Rice', '  보라색 소스  ');
  assert.notEqual(control(editor(app, 'Rice'), 'button', '+ Add').getAttribute('aria-disabled'), 'true');
  await click(control(editor(app, 'Rice'), 'button', '+ Add'));
  assert.deepEqual(tags(app, 'Rice'), ['Texture · How moist it feels: Dry', 'Colors: Other · 보라색 소스']);
  assert.equal(editor(app, 'Rice').container.querySelector('textarea'), null);
  assert.deepEqual(tags(app, 'Carrot in Rice'), []);
  assert.deepEqual(writes, []);
});

test('어려움을 입력하지 않고 Skip을 누르면 빈 이유 목록으로 저장되고 리뷰 완료 화면이 열린다', async t => {
  const { app, writes } = await start(t);
  for (const name of ['Rice', 'Carrot in Rice', 'Soup']) assert.deepEqual(tags(app, name), []);
  await click(control(app, 'button', 'Skip'));
  await waitFor(() => app.container.textContent.includes('This Meal Review saved'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
  assert.ok(control(app, 'heading', 'Save After-meal Review'));
  assert.ok(control(app, 'button', 'Back to Home'));
  assert.deepEqual(writes, [{
    after_photo_uri: null,
    food_results: [
      { food_id: '1', outcome: 'EATEN', difficulty_reasons: [],
        ingredient_outcomes: [{ ingredient_id: '101', outcome: 'TASTED', difficulty_reasons: [] }] },
      { food_id: '2', outcome: 'UNCLEAR', difficulty_reasons: [], ingredient_outcomes: [] },
    ],
  }]);
});
