// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식 추가·상세 수정·취소·선택 입력 비우기·동명 음식 구분의 사용자 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, input, click, enter, waitFor, act, modal, waitForModal }
  = require('../../helpers/meal-checkin-screen.cjs');
const { photoDraft } = require('../../fixtures/meal-photo.cjs');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');

const acceptanceLabels = ['Unfamiliar', 'Often Rejected', 'Often Accepted', 'Safe Food'];
const cookingLabels = { steamed: 'Steamed', boiled: 'Boiled' };

async function mountFoods(t, foodCount = 0) {
  const draft = photoDraft();
  const original = { ...draft, step: 'foods', foods: draft.foods.slice(0, foodCount),
    suggestionLinks: foodCount ? draft.suggestionLinks : [] };
  await saveMealDraft(original);
  const app = await mountMeal(t);
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  return { app, original };
}

async function openAdd(app) {
  await click(control(app, 'button', 'Add food item'));
  await waitForModal('Add food item');
}

async function expectList(app, names) {
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  assert.ok(control(app, 'heading', 'Review food items'));
  assert.equal(app.pathname, '/meal-checkin');
  assert.ok(app.container.textContent.includes(`${names.length} food item${names.length === 1 ? '' : 's'}`));
  const cards = [...app.container.querySelectorAll('[role="button"]')]
    .filter(element => names.includes(element.textContent));
  assert.deepEqual(cards.map(card => card.textContent), names);
  assert.deepEqual((await readMealDraft('1')).foods.map(food => food.name), names);
  return cards;
}

async function saveFood(app, name) {
  if (name !== undefined) await enter(modal(), 'Food name', name);
  await click(control(modal(), 'button', 'Save food'));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  assert.ok(control(app, 'heading', 'Review food items'));
}

async function openEdit(app, name) {
  const card = control(app, 'button', name);
  const scope = { container: card.parentElement };
  if (![...scope.container.querySelectorAll('[role="button"]')].some(node => node.textContent === 'Edit')) {
    await click(card);
  }
  await click(control(scope, 'button', 'Edit'));
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

async function expectIngredients(app, foodName, present, absent = []) {
  const card = control(app, 'button', foodName);
  if (![...card.parentElement.querySelectorAll('[role="button"]')].some(node => node.textContent === 'Edit')) {
    await click(card);
  }
  const texts = [...card.parentElement.querySelectorAll('*')].map(node => node.textContent);
  for (const name of present) assert.ok(texts.includes(name), `${foodName}에 ${name} 표시`);
  for (const name of absent) assert.ok(!texts.includes(name), `${foodName}에서 ${name} 제거`);
}

async function chooseCooking(current, next) {
  const title = modal().container.querySelector('[role="heading"]').textContent;
  await click(control(modal(), 'button', current));
  await waitFor(() => control(modal(), 'button', next));
  await click(control(modal(), 'button', next));
  await waitFor(() => control(modal(), 'heading', title));
}

async function chooseAcceptance(level) {
  await click(control(modal(), 'radio', acceptanceLabels[level]));
}

async function expectDetails(app, food) {
  await expectIngredients(app, food.name, food.ingredients);
  const container = control(app, 'button', food.name).parentElement;
  function field(label) {
    const element = [...container.querySelectorAll('*')]
      .find(node => node.children.length === 0 && node.textContent === label);
    assert.ok(element, `${food.name}: ${label}`);
    return element.parentElement;
  }
  assert.ok(field('Cooking method').textContent.includes(cookingLabels[food.preparation] ?? 'Not entered'));
  assert.ok(field('Additional detail').textContent.includes(food.servingNote || 'Not entered'));
  const acceptance = field('Acceptance');
  if (food.acceptance == null) {
    assert.ok(acceptance.textContent.includes('Not entered'));
  } else {
    assert.ok(!acceptance.textContent.includes('Not entered'));
    // 카드의 수용도는 숫자 대신 채움 막대로 표시된다. 0도 미입력 문구와 구분한다.
    const fill = [...acceptance.querySelectorAll('[style]')].find(node => node.style.width.endsWith('%'));
    assert.ok(fill);
    assert.ok(Math.abs(parseFloat(fill.style.width) - food.acceptance / 3 * 100) < 0.000001);
  }
}

test('빈 음식 목록에서 공백 이름으로는 저장할 수 없고, 이름만 입력해 저장하면 편집창이 닫히고 음식 카드 하나가 표시된다', async t => {
  const { app, original } = await mountFoods(t);
  await openAdd(app);
  await enter(modal(), 'Food name', '   ');
  await click(control(modal(), 'button', 'Save food'));
  assert.ok(control(modal(), 'heading', 'Add food item'));
  assert.deepEqual((await readMealDraft('1')).foods, []);

  await saveFood(app, '  우리집 국  ');
  await expectList(app, ['우리집 국']);
  const saved = await readMealDraft('1');
  assert.equal(saved.editingFood, null);
  assert.deepEqual({ ...saved, foods: [] }, original);
  assert.equal(app.container.querySelector('img').getAttribute('src'), original.photo.uri);
  assert.notEqual(control(app, 'button', 'Save check-in').getAttribute('aria-disabled'), 'true');
});

test('새 음식 입력을 취소한 뒤 이름과 상세 정보를 입력해 저장하면 기존 음식은 유지되고 새 카드에 입력값이 표시된다', async t => {
  const { app, original } = await mountFoods(t, 1);
  // Cancel·닫기·모달 뒤로가기 요청을 같은 사용자 흐름에서 확인한다.
  // RN Web에서는 Escape가 네이티브 Modal의 onRequestClose에 해당한다.
  for (const close of [
    () => click(control(modal(), 'button', 'Cancel')),
    () => click(control(modal(), 'button', 'Close')),
    () => act(async () => document.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Escape', bubbles: true }))),
  ]) {
    await openAdd(app);
    await enter(modal(), 'Food name', 'Discarded food');
    await addIngredient('Discarded ingredient');
    await close();
    await expectList(app, ['Carrot rice']);
    assert.deepEqual(await readMealDraft('1'), original);
  }
  await openAdd(app);
  assert.equal(input(modal(), 'Food name').value, '');
  assert.ok(!modal().container.textContent.includes('Discarded ingredient'));
  await addIngredient('Tofu');
  await chooseCooking('Select method', 'Boiled');
  await enter(modal(), 'Additional detail', 'Warm');
  await chooseAcceptance(1);
  await saveFood(app, 'Tofu soup');
  await expectList(app, ['Carrot rice', 'Tofu soup']);
  await expectIngredients(app, 'Tofu soup', ['Tofu'], ['Discarded ingredient']);
  const saved = await readMealDraft('1');
  assert.deepEqual(saved.foods[0], original.foods[0]);
  assert.deepEqual({ ...saved.foods[1], id: 'new-food' }, { id: 'new-food', name: 'Tofu soup',
    ingredients: ['Tofu'], preparation: 'boiled', servingNote: 'Warm', acceptance: 1,
    confirmed: true, source: 'parent' });
  await expectDetails(app, saved.foods[1]);
  assert.deepEqual(saved.suggestionLinks, original.suggestionLinks);
  assert.ok(app.container.textContent.includes(original.suggestionLinks[0].title));
  assert.ok(!app.container.textContent.includes('Discarded food'));
});

test('같은 이름의 음식을 연속해서 추가하면 음식 카드 두 개가 표시되고 각각의 편집창이 해당 음식을 연다', async t => {
  const { app } = await mountFoods(t);
  for (const names of [['Rice'], ['Rice', 'Rice']]) {
    await openAdd(app);
    await saveFood(app, 'Rice');
    await expectList(app, names);
  }
  const saved = await readMealDraft('1');
  assert.notEqual(saved.foods[0].id, saved.foods[1].id);
  for (let index = 0; index < 2; index++) {
    const cards = await expectList(app, ['Rice', 'Rice']);
    const card = cards[index];
    const scope = { container: card.parentElement };
    if (![...scope.container.querySelectorAll('[role="button"]')].some(node => node.textContent === 'Edit')) {
      await click(card);
    }
    await click(control(scope, 'button', 'Edit'));
    await waitForModal('Edit Rice');
    assert.equal(input(modal(), 'Food name').value, 'Rice');
    // 이름이 같아 화면만으로 구별되지 않으므로 실제로 열린 음식 ID도 확인한다.
    assert.equal((await readMealDraft('1')).editingFood.id, saved.foods[index].id);
    await click(control(modal(), 'button', 'Cancel'));
    await expectList(app, ['Rice', 'Rice']);
    assert.deepEqual(await readMealDraft('1'), saved);
  }
});


test('음식 이름·재료·조리법·설명·수용도를 수정해 저장하면 해당 카드만 바뀌고 다른 음식과 추천 연결은 유지된다', async t => {
  const { app, original } = await mountFoods(t, 2);
  await openEdit(app, 'Carrot rice');
  await addIngredient('Tofu');
  await addIngredient('Peas');
  await chooseCooking('Steamed', 'Boiled');
  await enter(modal(), 'Additional detail', 'Soft pieces');
  await chooseAcceptance(3);
  await saveFood(app, '당근 볶음밥');
  await expectList(app, ['당근 볶음밥', 'Tofu soup']);
  const changed = { ...original.foods[0], name: '당근 볶음밥',
    ingredients: ['Rice', 'Carrot', 'Tofu', 'Peas'], preparation: 'boiled',
    servingNote: 'Soft pieces', acceptance: 3 };
  assert.deepEqual(await readMealDraft('1'), { ...original, foods: [changed, original.foods[1]] });
  assert.ok(!app.container.textContent.includes('Carrot rice'));
  await expectDetails(app, changed);

  await openEdit(app, '당근 볶음밥');
  assert.equal(input(modal(), 'Food name').value, '당근 볶음밥');
  assert.equal(input(modal(), 'Additional detail').value, 'Soft pieces');
  assert.ok(control(modal(), 'button', 'Boiled'));
  await click(control(modal(), 'button', 'Remove: Tofu'));
  await click(control(modal(), 'button', 'Remove: Carrot'));
  await saveFood(app);
  await expectList(app, ['당근 볶음밥', 'Tofu soup']);
  const edited = { ...changed, ingredients: ['Rice', 'Peas'] };
  await expectIngredients(app, edited.name, edited.ingredients, ['Carrot', 'Tofu']);
  await expectDetails(app, edited);
  await expectDetails(app, original.foods[1]);
  assert.deepEqual(await readMealDraft('1'), { ...original, foods: [edited, original.foods[1]] });
  assert.ok(app.container.textContent.includes(original.suggestionLinks[0].title));
});

test('편집을 취소하면 기존 입력이 유지되고, 재료·설명을 비우고 수용도를 0으로 저장한 뒤 해제하면 미입력으로 표시된다', async t => {
  const { app, original } = await mountFoods(t, 2);
  await openEdit(app, 'Carrot rice');
  await enter(modal(), 'Food name', 'Discarded name');
  await click(control(modal(), 'button', 'Remove: Carrot'));
  await addIngredient('Egg');
  await chooseCooking('Steamed', 'Boiled');
  await enter(modal(), 'Additional detail', 'Discarded detail');
  await chooseAcceptance(0);
  await click(control(modal(), 'button', 'Cancel'));
  await expectList(app, ['Carrot rice', 'Tofu soup']);
  await expectIngredients(app, 'Carrot rice', ['Rice', 'Carrot'], ['Egg']);
  await expectDetails(app, original.foods[0]);
  assert.deepEqual(await readMealDraft('1'), original);

  await openEdit(app, 'Carrot rice');
  assert.equal(input(modal(), 'Food name').value, 'Carrot rice');
  assert.equal(input(modal(), 'Additional detail').value, 'Small bowl');
  assert.ok(control(modal(), 'button', 'Steamed'));
  await click(control(modal(), 'button', 'Remove: Rice'));
  await click(control(modal(), 'button', 'Remove: Carrot'));
  await enter(modal(), 'Additional detail', '');
  await chooseAcceptance(0);
  await saveFood(app);
  await expectList(app, ['Carrot rice', 'Tofu soup']);
  const cleared = { ...original.foods[0], ingredients: [], servingNote: '', acceptance: 0 };
  await expectIngredients(app, cleared.name, [], ['Rice', 'Carrot', 'Egg']);
  await expectDetails(app, cleared);
  assert.deepEqual(await readMealDraft('1'), { ...original, foods: [cleared, original.foods[1]] });

  await openEdit(app, 'Carrot rice');
  // 저장된 0의 라벨을 다시 눌러 선택을 해제한다.
  await chooseAcceptance(0);
  await saveFood(app);
  await expectList(app, ['Carrot rice', 'Tofu soup']);
  const unanswered = { ...cleared, acceptance: null };
  await expectDetails(app, unanswered);
  await expectDetails(app, original.foods[1]);
  assert.deepEqual(await readMealDraft('1'), { ...original, foods: [unanswered, original.foods[1]] });
  assert.ok(app.container.textContent.includes(original.suggestionLinks[0].title));
});
