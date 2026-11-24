// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 리뷰의 음식 추가·수정 저장과 실패 후 편집 재시도의 실제 화면 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, enter, input, waitFor, act, modal, waitForModal }
  = require('../../helpers/meal-checkin-screen.cjs');
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { colors } = require('../../../src/util/colors.ts');
const selectedColor = `rgb(${colors.homePrimary.slice(1).match(/../g).map(part => parseInt(part, 16)).join(', ')})`;

async function start(t) {
  const draft = unfinishedReview();
  draft.outcomes[1].decision.confirmed = 'unclear';
  await saveAfterMealDraft(draft);
  const server = { meal: entryMeal(), requests: [], failNext: false };
  const app = await mountMeal(t, { initialPath: '/home', respond: (path, method, init) => {
    if (method === 'GET' && path === '/api/v1/meals') return Response.json([server.meal]);
    if (method === 'GET' && path === '/api/v1/meals/10') return Response.json(server.meal);
    if (method === 'PUT' && path === '/api/v1/meals/10/foods') {
      const body = JSON.parse(init.body);
      server.requests.push(body);
      if (server.failNext) {
        server.failNext = false;
        return Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
      }
      const foods = body.foods.map((food, index) => {
        const previous = server.meal.foods.find(item => item.id === food.id);
        return { ...entryMeal().foods[0], ...previous, ...food, id: food.id ?? String(index + 1),
          ingredients: food.ingredients.map((ingredient, ingredientIndex) => ({
            id: previous?.ingredients.find(item => item.name === ingredient.name)?.id ?? String(201 + ingredientIndex),
            name: ingredient.name, outcome: null, difficulty_reasons: [],
          })) };
      });
      server.meal = { ...server.meal, foods };
      return Response.json(server.meal);
    }
  } });
  const card = () => [...app.container.querySelectorAll('[role="button"]')]
    .find(node => node.textContent.includes('Lunch') && node.textContent.includes('Awaiting review'));
  await waitFor(() => card());
  await click(card());
  await expectOutcomes(app);
  return { app, server, draft };
}
async function expectOutcomes(app) {
  await waitFor(() => control(app, 'heading', 'What happened with each food item?'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.equal(new URL(window.location.href).searchParams.get('mealId'), '10');
}
async function expand(app, name) {
  const button = control(app, 'button', `Expand or collapse ${name}`);
  if (!app.container.querySelector(`[role="slider"][aria-label="${name}"]`)) await click(button);
}
function radios(app, name) {
  return [...control(app, 'slider', name).parentElement.querySelectorAll('[role="radio"]')];
}
function expectAnswer(app, name, outcome) {
  assert.deepEqual(radios(app, name)
    .filter(node => window.getComputedStyle(node.firstElementChild).color === selectedColor)
    .map(node => node.textContent), outcome ? [outcome] : []);
}
async function openEdit(app, name) {
  await expand(app, name);
  const heading = control(app, 'button', `Expand or collapse ${name}`).parentElement;
  await click(control({ container: heading }, 'button', 'Edit'));
  await waitForModal(`Edit ${name}`);
}
async function addIngredient(name) {
  await click(control(modal(), 'button', '+ Add'));
  await enter(modal(), 'Add ingredient', name);
  await act(async () => input(modal(), 'Add ingredient').dispatchEvent(new window.KeyboardEvent('keydown', {
    key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true,
  })));
  await waitFor(() => control(modal(), 'button', `Remove: ${name}`));
}
async function saveFood(app) {
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  await expectOutcomes(app);
}
async function expectPreservedAnswers(app, name) {
  await expand(app, name);
  await expand(app, 'Soup');
  expectAnswer(app, name, 'Tasted');
  expectAnswer(app, 'Carrot', 'Untouched');
  expectAnswer(app, 'Soup', 'Unclear');
}
async function expectUnselectedIngredient(app, name) {
  assert.ok(control(app, 'checkbox', name));
  assert.equal(app.container.querySelector(`[role="slider"][aria-label="${name}"]`), null);
  const saved = await readAfterMealDraft('1', '10');
  assert.equal(saved.outcomes[0].ingredients.find(item => item.name === name).selected, false);
}

async function continueToDifficulties(app, name) {
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => control(app, 'heading', 'What made this food difficult?'));
  assert.equal(app.pathname, '/after-meal-review');
  assert.ok(app.container.textContent.includes(name));
  assert.ok(control(app, 'button', 'Remove: Colors: Yellow'));
}

test('리뷰에서 음식 이름·재료를 수정하고 새 음식을 추가하면 기존 답변·사유는 유지되고, 새 음식에 답한 뒤 어려움 화면으로 이동한다', async t => {
  const { app, server } = await start(t);
  await openEdit(app, 'Rice');
  await enter(modal(), 'Food name', 'Carrot rice');
  await click(control(modal(), 'button', 'Remove: Egg'));
  await addIngredient('Pea');
  await saveFood(app);
  assert.deepEqual(server.requests[0].foods.map(food => [food.id, food.name]), [['1', 'Carrot rice'], ['2', 'Soup']]);
  assert.deepEqual(server.requests[0].foods[0].ingredients, [{ name: 'Carrot' }, { name: 'Pea' }]);
  await expectPreservedAnswers(app, 'Carrot rice');
  assert.equal(app.container.querySelector('[role="checkbox"][aria-label="Egg"]'), null);
  await expectUnselectedIngredient(app, 'Pea');
  await click(control(app, 'button', 'Add a food'));
  await waitForModal('Add food item');
  await enter(modal(), 'Food name', 'Banana');
  await saveFood(app);
  assert.equal(server.requests.length, 2);
  assert.equal(server.requests[1].foods[2].id, undefined);
  assert.equal(server.requests[1].foods[2].name, 'Banana');
  await expectPreservedAnswers(app, 'Carrot rice');
  expectAnswer(app, 'Banana', null);
  assert.equal(control(app, 'button', 'Continue').getAttribute('aria-disabled'), 'true');
  await click(radios(app, 'Banana').find(node => node.textContent === 'Eaten'));
  expectAnswer(app, 'Banana', 'Eaten');
  const saved = await readAfterMealDraft('1', '10');
  assert.deepEqual(saved.outcomes.map(food => food.foodId), ['1', '2', '3']);
  await continueToDifficulties(app, 'Carrot rice');
  assert.ok(app.container.textContent.includes('Carrot in Carrot rice'));
  assert.ok(app.container.textContent.includes('Banana'));
});

test('음식 수정 저장이 실패하면 편집창의 입력과 기존 카드·답변을 유지하고, 다시 수정해 저장하면 최신 음식 이름으로 리뷰를 이어간다', async t => {
  const { app, server, draft } = await start(t);
  const before = structuredClone(server.meal);
  await openEdit(app, 'Rice');
  await enter(modal(), 'Food name', 'Changed rice');
  await addIngredient('Pea');
  server.failNext = true;
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => app.container.textContent.includes('Could not save the review. Your answers are preserved.'));
  assert.equal(input(modal(), 'Food name').value, 'Changed rice');
  assert.ok(control(modal(), 'button', 'Remove: Pea'));
  assert.ok(control(app, 'button', 'Expand or collapse Rice'));
  assert.equal(app.container.querySelector('[role="button"][aria-label="Expand or collapse Changed rice"]'), null);
  assert.deepEqual(server.meal, before);
  assert.deepEqual(await readAfterMealDraft('1', '10'), draft);
  await expectPreservedAnswers(app, 'Rice');
  await enter(modal(), 'Food name', 'Pea rice');
  await saveFood(app);
  assert.equal(server.requests.length, 2);
  assert.equal(server.requests[0].foods[0].name, 'Changed rice');
  assert.equal(server.requests[1].foods[0].name, 'Pea rice');
  assert.deepEqual(server.requests[1].foods[0].ingredients, [{ name: 'Carrot' }, { name: 'Egg' }, { name: 'Pea' }]);
  assert.equal(server.meal.foods[0].id, '1');
  assert.equal(server.meal.foods[0].name, 'Pea rice');
  await expectPreservedAnswers(app, 'Pea rice');
  await expectUnselectedIngredient(app, 'Pea');
  await continueToDifficulties(app, 'Pea rice');
});
