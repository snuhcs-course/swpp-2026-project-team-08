// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 입력, 저장, 복원 및 건너뛰기 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountDraft, control, click, enter } = require('../../helpers/onboarding-screen.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { readDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');

function draft() {
  return { ...emptyDraft(), step: 'refused-foods', caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', allergies: ['none'],
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false } };
}
function button(app, label) { return control(app, 'button', label); }

test('empty refused foods can be skipped and review returns to the step', async t => {
  const app = await mountDraft(t, draft());
  assert.equal(button(app, 'Add Refused Food').getAttribute('aria-disabled'), 'true');
  await click(button(app, 'Skip'));
  await waitFor(() => app.pathname === '/onboarding/review');
  assert.equal(app.submissions.length, 0);
  await click(button(app, 'Previous'));
  await waitFor(() => app.pathname === '/onboarding/refused-foods');
  assert.ok(button(app, 'Skip'));
});

test('food with cooking and difficulty reasons survives navigation and can be removed', async t => {
  const app = await mountDraft(t, draft());
  await enter(app, 'Food name', 'Apple');
  await click(button(app, 'Select method'));
  await click(button(app, 'Pan-fried'));
  await click(button(app, 'Select category'));
  await click(button(app, 'Tastes'));
  await click(button(app, 'value'));
  await click(button(app, 'Sour'));
  await click(button(app, '+ Add'));
  await click(button(app, 'Add Refused Food'));
  assert.equal(app.current.draft.refusedFoods.length, 1);
  const food = app.current.draft.refusedFoods[0];
  assert.deepEqual({ ...food, id: undefined }, { id: undefined, name: 'Apple', cookingMethod: 'pan_fried',
    reasons: [{ category: 'tasteType', subcategory: null, value: 'sour' }] });
  assert.ok(button(app, 'Remove Apple'));
  await waitFor(async () => (await readDraft()).refusedFoods?.length === 1);
  await click(button(app, 'Continue'));
  await waitFor(() => app.pathname === '/onboarding/review');
  assert.ok(app.container.textContent.includes('Apple'));
  await click(button(app, 'Previous'));
  await waitFor(() => app.pathname === '/onboarding/refused-foods');
  assert.ok(button(app, 'Remove Apple'));
  await click(button(app, 'Remove Apple'));
  assert.ok(button(app, 'Skip'));
  assert.deepEqual(app.current.draft.refusedFoods, []);
});

test('texture reasons use the same subcategories and reject duplicates', async t => {
  const app = await mountDraft(t, draft());
  await click(button(app, 'Select category'));
  await click(button(app, 'Texture'));
  await click(button(app, 'Select texture characteristic'));
  await click(button(app, 'How hard it feels'));
  await click(button(app, 'value'));
  await click(button(app, 'Hard'));
  await click(button(app, '+ Add'));
  assert.deepEqual(app.current.draft.refusedFoodInput.reasons, [
    { category: 'texture', subcategory: 'hardness', value: 'hard' },
  ]);
  await click(button(app, 'value'));
  await click(button(app, 'Hard'));
  assert.equal(button(app, '+ Add').getAttribute('aria-disabled'), 'true');
});

test('saved entries and unfinished input are restored after reopening', async t => {
  const app = await mountDraft(t, draft());
  await enter(app, 'Food name', 'Apple');
  await click(button(app, 'Add Refused Food'));
  await enter(app, 'Food name', 'Banana');
  await waitFor(async () => (await readDraft()).refusedFoodInput.name === 'Banana');
  const saved = await readDraft();
  await app.unmount();
  const restored = await mountDraft(t, saved);
  assert.ok(button(restored, 'Remove Apple'));
  assert.equal(restored.current.draft.refusedFoodInput.name, 'Banana');
  assert.equal(restored.current.draft.refusedFoods[0].id, saved.refusedFoods[0].id);
});

test('not sure can be added without choosing a value', async t => {
  const app = await mountDraft(t, draft());
  await click(button(app, 'Select category'));
  await click(button(app, 'Not sure'));
  await click(button(app, '+ Add'));
  assert.deepEqual(app.current.draft.refusedFoodInput.reasons, [
    { category: 'notSure', subcategory: null, value: 'notSure' },
  ]);
});
