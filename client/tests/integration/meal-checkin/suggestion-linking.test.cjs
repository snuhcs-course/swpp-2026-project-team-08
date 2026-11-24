// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 실제 편집창·추천 목록·음식 카드의 연결 변경·해제·이동 사용자 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, enter, waitFor, modal, waitForModal }
  = require('../../helpers/meal-checkin-screen.cjs');
const { options, link, linkingDraft, sourceResponses } = require('../../fixtures/meal-suggestion-linking.cjs');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { checkinReferenceKeys } = require('../../../src/data/queries/checkinReferenceQueries.ts');

async function start(t, links = []) {
  const original = linkingDraft(links);
  await saveMealDraft(original);
  const app = await mountMeal(t, sourceResponses());
  await click(control(app, 'button', 'Continue draft'));
  await waitFor(() => control(app, 'heading', 'Review food items'));
  await waitFor(() => app.client.getQueryData(checkinReferenceKeys.savedSuggestions('1'))?.length === 2);
  await waitFor(() => app.client.getQueryData(checkinReferenceKeys.meals('1'))?.length === 2);
  return { app, original };
}
function card(app, name) {
  return { container: control(app, 'button', name).parentElement };
}
async function openEdit(app, name) {
  const scope = card(app, name);
  if (![...scope.container.querySelectorAll('[role="button"]')].some(node => node.textContent === 'Edit')) {
    await click(control(app, 'button', name));
  }
  await click(control(scope, 'button', 'Edit'));
  await waitForModal(`Edit ${name}`);
}
async function choose(index, currentTitle, changing = false) {
  await click(control(modal(), 'button', changing ? 'Change' : 'Link a saved suggestion'));
  await waitForModal('Saved suggestions');
  await click(control(modal(), 'radio', options[index].title));
  await click(control(modal(), 'button', 'Link suggestion'));
  await waitForModal(currentTitle);
  assert.ok(control(modal(), 'button', `Remove: ${options[index].title}`));
}
async function leaveEditor(app, action) {
  await click(control(modal(), 'button', action));
  await waitFor(() => !document.querySelector('[role="dialog"]'));
  assert.ok(control(app, 'heading', 'Review food items'));
  assert.equal(app.pathname, '/meal-checkin');
}
async function expectLinks(app, expected, names = ['Carrot rice', 'Tofu soup']) {
  for (const name of names) {
    const food = (await readMealDraft('1')).foods.find(item => item.name === name);
    assert.ok(food, `${name} 음식 유지`);
    const displayed = [...card(app, name).container.querySelectorAll('[aria-label]')]
      .map(node => node.getAttribute('aria-label'))
      .filter(label => options.some(option => label === `Remove: ${option.title}`));
    assert.deepEqual(displayed, expected.filter(item => item.foodId === food.id).map(item => `Remove: ${item.title}`));
  }
  await waitFor(async () => {
    assert.deepEqual((await readMealDraft('1')).suggestionLinks, expected);
    return true;
  });
}

test('새 음식에 추천을 연결하면 저장 후 카드에 표시되고, 변경을 취소하면 기존 연결이 유지되며 저장하면 새 추천으로 바뀐다', async t => {
  const { app, original } = await start(t);
  await click(control(app, 'button', 'Add food item'));
  await waitForModal('Add food item');
  await enter(modal(), 'Food name', 'New rice');
  await choose(0, 'Add food item');
  const pending = await readMealDraft('1');
  assert.deepEqual(pending.foods, original.foods);
  assert.deepEqual(pending.suggestionLinks, []);
  assert.ok(!app.container.textContent.includes('New rice'));
  await leaveEditor(app, 'Save food');
  const newId = (await readMealDraft('1')).foods.at(-1).id;
  const names = ['Carrot rice', 'Tofu soup', 'New rice'];
  await expectLinks(app, [link(0, newId)], names);

  await openEdit(app, 'New rice');
  // 목록에서 선택만 바꾸고 돌아오면 편집창의 연결도 유지된다.
  await click(control(modal(), 'button', 'Change'));
  await waitForModal('Saved suggestions');
  await click(control(modal(), 'radio', 'Soft carrot'));
  await click(control(modal(), 'button', 'Go back'));
  await waitForModal('Edit New rice');
  assert.ok(control(modal(), 'button', 'Remove: Potato mash'));
  await choose(1, 'Edit New rice', true);
  await expectLinks(app, [link(0, newId)], names);
  await leaveEditor(app, 'Cancel');
  await expectLinks(app, [link(0, newId)], names);
  await openEdit(app, 'New rice');
  assert.ok(control(modal(), 'button', 'Remove: Potato mash'));
  await choose(1, 'Edit New rice', true);
  await leaveEditor(app, 'Save food');
  await expectLinks(app, [link(1, newId)], names);
  assert.deepEqual((await readMealDraft('1')).foods.slice(0, 2), original.foods);
});

test('편집창에서 추천 해제를 취소하면 연결이 유지되고 저장하면 해제되며, 카드에서 해제하면 즉시 사라지고 원본 추천은 유지된다', async t => {
  const { app, original } = await start(t, [link(0, 'rice'), link(1, 'soup')]);
  const savedSuggestions = structuredClone(app.client.getQueryData(checkinReferenceKeys.savedSuggestions('1')));
  await openEdit(app, 'Carrot rice');
  await click(control(modal(), 'button', 'Remove: Potato mash'));
  assert.ok(control(modal(), 'button', 'Link a saved suggestion'));
  await expectLinks(app, original.suggestionLinks);
  await leaveEditor(app, 'Cancel');
  await expectLinks(app, original.suggestionLinks);
  await openEdit(app, 'Carrot rice');
  assert.ok(control(modal(), 'button', 'Remove: Potato mash'));
  await click(control(modal(), 'button', 'Remove: Potato mash'));
  await leaveEditor(app, 'Save food');
  await expectLinks(app, [link(1, 'soup')]);

  // 해제한 원본 추천을 다시 고를 수 있고, 카드의 ×는 추가 저장 없이 적용된다.
  await openEdit(app, 'Carrot rice');
  await choose(0, 'Edit Carrot rice');
  await leaveEditor(app, 'Save food');
  await click(control(card(app, 'Carrot rice'), 'button', 'Remove: Potato mash'));
  await expectLinks(app, [link(1, 'soup')]);
  assert.deepEqual((await readMealDraft('1')).foods, original.foods);
  assert.deepEqual(app.client.getQueryData(checkinReferenceKeys.savedSuggestions('1')), savedSuggestions);
  await openEdit(app, 'Carrot rice');
  await click(control(modal(), 'button', 'Link a saved suggestion'));
  await waitForModal('Saved suggestions');
  assert.ok(control(modal(), 'radio', 'Potato mash'));
  assert.ok(control(modal(), 'radio', 'Soft carrot'));
  await click(control(modal(), 'button', 'Close'));
  await waitForModal('Edit Carrot rice');
  await leaveEditor(app, 'Cancel');
});

test('다른 음식의 추천을 가져오는 편집을 취소하면 원래 연결이 유지되고, 저장하면 새 음식으로만 연결이 이동한다', async t => {
  const { app, original } = await start(t, [link(0, 'rice'), link(1, 'soup')]);
  await openEdit(app, 'Tofu soup');
  await choose(0, 'Edit Tofu soup', true);
  await expectLinks(app, original.suggestionLinks);
  await leaveEditor(app, 'Close');
  await expectLinks(app, original.suggestionLinks);
  await openEdit(app, 'Tofu soup');
  assert.ok(control(modal(), 'button', 'Remove: Soft carrot'));
  await choose(0, 'Edit Tofu soup', true);
  await leaveEditor(app, 'Save food');
  await expectLinks(app, [link(0, 'soup')]);
  assert.deepEqual((await readMealDraft('1')).foods, original.foods);
  await openEdit(app, 'Carrot rice');
  assert.ok(control(modal(), 'button', 'Link a saved suggestion'));
  await leaveEditor(app, 'Cancel');
});
