// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 결과 선택·변경·재선택 유지와 재료 답변 복원·미응답 재료 해제 후 진행 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor } = require('../../helpers/meal-checkin-screen.cjs');
const { entryMeal } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { newReviewDraft } = require('../../../src/features/after-meal-review/rules.ts');
const { colors } = require('../../../src/util/colors.ts');

const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;
async function start(t) {
  const meal = entryMeal();
  const draft = newReviewDraft(toLegacyMeal(toMealDetail(meal)));
  await saveAfterMealDraft({ ...draft, step: 'outcomes' });
  const app = await mountMeal(t, { initialPath: '/home', meals: [meal], respond: (path, method) => {
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(meal);
  } });
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
  await waitFor(() => card());
  await click(card());
  await expectOutcomes(app);
  return app;
}
function radios(app, name) {
  return [...control(app, 'slider', name).parentElement.querySelectorAll('[role="radio"]')];
}
async function expand(app, name) {
  if (!app.container.querySelector(`[role="slider"][aria-label="${name}"]`)) {
    await click(control(app, 'button', `Expand or collapse ${name}`));
  }
}
async function select(app, name, outcome) {
  const option = radios(app, name).find(node => node.textContent === outcome);
  assert.ok(option, `${name}의 ${outcome} 선택지가 있어야 한다`);
  await click(option);
}
function expectSelected(app, name, expected) {
  // RN Web에서 aria-checked를 렌더링하지 않아 실제 선택 강조색으로 확인한다.
  assert.deepEqual(radios(app, name)
    .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
    .map(node => node.textContent), expected === null ? [] : [expected]);
}
async function expectOutcomes(app) {
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
async function expectBlocked(app) {
  const next = control(app, 'button', 'Continue');
  assert.equal(next.getAttribute('aria-disabled'), 'true');
  await click(next);
  await expectOutcomes(app);
  assert.equal(app.container.textContent.includes('What made this food difficult?'), false);
}
async function continueToDifficulties(app, names) {
  assert.notEqual(control(app, 'button', 'Continue').getAttribute('aria-disabled'), 'true');
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => control(app, 'heading', 'What made this food difficult?'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
  for (const name of names) assert.ok(app.container.textContent.includes(name));
  assert.ok(control(app, 'button', 'Skip'));
}

test('음식 일부만 답하면 진행할 수 없고, 남은 음식에 Unclear를 선택한 뒤 Continue를 누르면 어려움 화면이 열린다', async t => {
  const app = await start(t);
  expectSelected(app, 'Rice', null);
  expectSelected(app, 'Soup', null);
  await expectBlocked(app);
  await select(app, 'Rice', 'Tasted');
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Soup', null);
  await expectBlocked(app);
  await select(app, 'Soup', 'Unclear');
  expectSelected(app, 'Soup', 'Unclear');
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Carrot"]'), null);
  await continueToDifficulties(app, ['Rice', 'Soup']);
});

test('모든 음식에 Eaten을 선택하고 다시 Eaten을 눌러도 선택을 유지하며, 어려움 화면에서 돌아와 한 음식만 Tasted로 바꾼 뒤 다시 진행할 수 있다', async t => {
  const app = await start(t);
  await select(app, 'Rice', 'Eaten');
  await select(app, 'Soup', 'Eaten');
  await select(app, 'Rice', 'Eaten');
  expectSelected(app, 'Rice', 'Eaten');
  expectSelected(app, 'Soup', 'Eaten');
  await continueToDifficulties(app, ['Rice', 'Soup']);
  await click(control(app, 'button', 'Go back'));
  await expectOutcomes(app);
  await expand(app, 'Rice');
  await expand(app, 'Soup');
  expectSelected(app, 'Rice', 'Eaten');
  expectSelected(app, 'Soup', 'Eaten');
  await select(app, 'Rice', 'Tasted');
  await select(app, 'Rice', 'Tasted');
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Soup', 'Eaten');
  await continueToDifficulties(app, ['Rice', 'Soup']);
});

test('음식과 재료의 결과를 각각 바꾸고 재료 기록을 해제했다 다시 선택하면 변경한 답변이 표시되며 Continue로 어려움 화면에 진입한다', async t => {
  const app = await start(t);
  await select(app, 'Rice', 'Eaten');
  await select(app, 'Soup', 'Unclear');
  await click(control(app, 'checkbox', 'Carrot'));
  await select(app, 'Carrot', 'Untouched');
  await select(app, 'Carrot', 'Untouched');
  expectSelected(app, 'Carrot', 'Untouched');
  expectSelected(app, 'Rice', 'Eaten');
  await select(app, 'Rice', 'Tasted');
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Carrot', 'Untouched');
  expectSelected(app, 'Soup', 'Unclear');
  await select(app, 'Carrot', 'Eaten');
  expectSelected(app, 'Carrot', 'Eaten');
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Soup', 'Unclear');
  await click(control(app, 'checkbox', 'Carrot'));
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Carrot"]'), null);
  await click(control(app, 'checkbox', 'Carrot'));
  expectSelected(app, 'Carrot', 'Eaten');
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Soup', 'Unclear');
  await continueToDifficulties(app, ['Rice', 'Soup', 'Carrot in Rice']);
});

test('음식 결과가 모두 있어도 미응답 재료 두 개 중 하나만 기록 해제하면 진행할 수 없고, 나머지도 해제한 뒤 Continue를 누르면 어려움 화면이 열린다', async t => {
  const app = await start(t);
  await select(app, 'Rice', 'Tasted');
  await select(app, 'Soup', 'Eaten');
  assert.notEqual(control(app, 'button', 'Continue').getAttribute('aria-disabled'), 'true');
  await click(control(app, 'checkbox', 'Carrot'));
  await click(control(app, 'checkbox', 'Egg'));
  expectSelected(app, 'Carrot', null);
  expectSelected(app, 'Egg', null);
  await expectBlocked(app);
  await click(control(app, 'checkbox', 'Carrot'));
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Carrot"]'), null);
  expectSelected(app, 'Egg', null);
  await expectBlocked(app);
  await click(control(app, 'button', 'Remove Egg review'));
  assert.equal(app.container.querySelector('[role="slider"][aria-label="Egg"]'), null);
  expectSelected(app, 'Rice', 'Tasted');
  expectSelected(app, 'Soup', 'Eaten');
  await continueToDifficulties(app, ['Rice', 'Soup']);
  assert.equal(app.container.textContent.includes('Carrot in Rice'), false);
  assert.equal(app.container.textContent.includes('Egg in Rice'), false);
});
