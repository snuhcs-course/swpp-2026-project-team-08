// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 연결된 음식·마지막 음식·동명 음식의 삭제와 Undo 사용자 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor } = require('../../helpers/meal-checkin-screen.cjs');
const { removalDraft } = require('../../fixtures/meal-food-removal.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { checkinReferenceKeys } = require('../../../src/data/queries/checkinReferenceQueries.ts');
const cookingLabels = { steamed: 'Steamed', boiled: 'Boiled', raw: 'Raw' };

async function mountFoods(t, original) {
  await saveMealDraft(original);
  const suggestions = original.suggestionLinks.map(link => suggestionResponse({
    id: link.suggestionId, status: 'SAVED', what_to_try: link.description,
    serving_tip: link.servingTip, saved_at: '2026-11-16T00:00:00Z',
  }));
  const app = await mountMeal(t, { suggestions });
  const suggestionKey = checkinReferenceKeys.savedSuggestions('1');
  await waitFor(() => app.client.getQueryData(suggestionKey)?.length === suggestions.length);
  const savedSuggestions = structuredClone(app.client.getQueryData(suggestionKey));
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  return { app, savedSuggestions, suggestionKey };
}

function cards(app, names) {
  return [...app.container.querySelectorAll('[role="button"]')]
    .filter(node => names.includes(node.textContent));
}

async function expectList(app, expected) {
  assert.ok(control(app, 'heading', 'Review food items'));
  assert.equal(app.pathname, '/meal-checkin');
  const names = expected.foods.map(food => food.name);
  assert.deepEqual(cards(app, names).map(node => node.textContent), names);
  assert.ok(app.container.textContent.includes(`${names.length} food item${names.length === 1 ? '' : 's'}`));
  assert.deepEqual(await readMealDraft('1'), expected);
}

async function expandCard(app, names, index) {
  const card = cards(app, names)[index];
  assert.ok(card);
  const scope = { container: card.parentElement };
  if (![...scope.container.querySelectorAll('[role="button"]')].some(node => node.textContent === 'Remove')) {
    await click(card);
  }
  return scope;
}

async function removeCard(app, foods, index) {
  const scope = await expandCard(app, foods.map(food => food.name), index);
  await click(control(scope, 'button', 'Remove'));
  assert.ok(app.container.textContent.includes(`${foods[index].name} removed`));
  assert.ok(control(app, 'button', 'Undo'));
}

async function expectCard(app, expected, index) {
  const food = expected.foods[index];
  const { container } = await expandCard(app, expected.foods.map(item => item.name), index);
  const texts = [...container.querySelectorAll('*')].map(node => node.textContent);
  for (const text of [...food.ingredients, cookingLabels[food.preparation], food.servingNote,
    ...expected.suggestionLinks.filter(link => link.foodId === food.id).map(link => link.title)]) {
    assert.ok(texts.includes(text), `${food.name}: ${text}`);
  }
  const label = [...container.querySelectorAll('*')]
    .find(node => node.children.length === 0 && node.textContent === 'Acceptance');
  assert.ok(label);
  assert.ok(!label.parentElement.textContent.includes('Not entered'));
  const fill = [...label.parentElement.querySelectorAll('[style]')].find(node => node.style.width.endsWith('%'));
  assert.ok(fill);
  assert.ok(Math.abs(parseFloat(fill.style.width) - food.acceptance / 3 * 100) < 0.000001);
}

function expectUndoConsumed(app) {
  assert.ok(![...app.container.querySelectorAll('[role="button"]')].some(node => node.textContent === 'Undo'));
  assert.ok(!app.container.textContent.includes(' removed'));
}

test('추천이 연결된 음식을 삭제하면 카드와 연결이 사라지고, Undo하면 원래 위치에 상세 정보와 연결이 다시 표시된다', async t => {
  const original = removalDraft();
  const { app, savedSuggestions, suggestionKey } = await mountFoods(t, original);
  await removeCard(app, original.foods, 1);
  const deleted = { ...original, foods: [original.foods[0], original.foods[2]],
    suggestionLinks: [original.suggestionLinks[0]] };
  await expectList(app, deleted);
  assert.equal(cards(app, ['Tofu soup']).length, 0);
  assert.ok(!app.container.textContent.includes(original.suggestionLinks[1].title));
  assert.deepEqual(app.client.getQueryData(suggestionKey), savedSuggestions);
  await expectCard(app, deleted, 0);
  await expectCard(app, deleted, 1);

  await click(control(app, 'button', 'Undo'));
  await expectList(app, original);
  await expectCard(app, original, 1);
  expectUndoConsumed(app);
  assert.deepEqual(app.client.getQueryData(suggestionKey), savedSuggestions);
  // mountMeal은 GET 외 요청을 실패시키므로 원본 추천 삭제·식사 제출도 허용하지 않는다.
});

test('마지막 음식을 삭제하면 빈 목록과 비활성 저장 버튼이 표시되고, Undo하면 카드가 돌아오고 저장 버튼이 활성화된다', async t => {
  const draft = removalDraft();
  const original = { ...draft, foods: [draft.foods[1]], suggestionLinks: [draft.suggestionLinks[1]] };
  const { app } = await mountFoods(t, original);
  await removeCard(app, original.foods, 0);
  const empty = { ...original, foods: [], suggestionLinks: [] };
  await expectList(app, empty);
  assert.equal(cards(app, ['Tofu soup']).length, 0);
  assert.ok(app.container.textContent.includes('No foods added yet'));
  const save = control(app, 'button', 'Save check-in');
  assert.equal(save.getAttribute('aria-disabled'), 'true');
  await click(save);
  await expectList(app, empty);

  await click(control(app, 'button', 'Undo'));
  await expectList(app, original);
  await expectCard(app, original, 0);
  assert.ok(!app.container.textContent.includes('No foods added yet'));
  assert.notEqual(control(app, 'button', 'Save check-in').getAttribute('aria-disabled'), 'true');
  expectUndoConsumed(app);
});

test('같은 이름의 음식 중 하나를 삭제하면 다른 음식의 상세는 유지되고, Undo하면 두 음식이 각각의 상세를 가진 카드로 돌아온다', async t => {
  const draft = removalDraft();
  const original = { ...draft, foods: draft.foods.slice(0, 2).map(food => ({ ...food, name: 'Rice' })) };
  const { app } = await mountFoods(t, original);
  await expectCard(app, original, 0);
  await expectCard(app, original, 1);
  await removeCard(app, original.foods, 1);
  const deleted = { ...original, foods: [original.foods[0]], suggestionLinks: [original.suggestionLinks[0]] };
  await expectList(app, deleted);
  await expectCard(app, deleted, 0);
  assert.ok(!app.container.textContent.includes(original.suggestionLinks[1].title));

  await click(control(app, 'button', 'Undo'));
  await expectList(app, original);
  await expectCard(app, original, 0);
  await expectCard(app, original, 1);
  expectUndoConsumed(app);
});
