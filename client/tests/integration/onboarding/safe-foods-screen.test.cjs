// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 이전 음식 데이터 보존과 현재 거부 음식 단계 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountSafeFoods, mountDraft } = require('../../helpers/onboarding-screen.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { strings } = require('../../../src/util/strings.ts');
const s = strings.en;
function control(app, role, label) {
  const items = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(el => (el.getAttribute('aria-label') ?? el.textContent) === label);
  assert.equal(items.length, 1, label);
  return items[0];
}
function input(app, label) {
  const el = [...app.container.querySelectorAll('input')]
    .find(el => el.getAttribute('aria-label') === label);
  assert.ok(el, label);
  return el;
}
const click = async el => act(async () => el.click());
async function enter(app, label, value) {
  const el = input(app, label);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
const add = app => control(app, 'button', s.onboarding.addSafeFoodAction);
const next = app => control(app, 'button', s.common.continue);
const none = app => control(app, 'checkbox', s.onboarding.noSafeFoods);

async function keyboardNext(app, label) {
  await act(async () => {
    input(app, label).focus();
    input(app, label).dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true,
    }));
  });
}
function assertSafeFoodsScreen(app) {
  assert.equal(app.pathname, '/onboarding/safe-foods');
  assert.ok(control(app, 'heading', s.onboarding.safeFoodsTitle('나루')));
}
function assertReviewScreen(app) {
  assert.equal(app.pathname, '/onboarding/review');
  assert.ok(control(app, 'heading', s.onboarding.reviewTitle('나루')));
  assert.equal(app.container.querySelector('input'), null);
}

test('공백 이름은 추가를 막고 이름만 또는 설명을 함께 추가하면 태그를 표시하고 입력을 비운다', async t => {
  const app = await mountSafeFoods(t);
  assert.equal(app.current.draft.noSafeFoods, false);
  assert.equal(next(app).getAttribute('aria-disabled'), 'true');
  await click(next(app));
  assertSafeFoodsScreen(app);
  await enter(app, s.onboarding.foodName, '  \n  ');
  assert.equal(add(app).getAttribute('aria-disabled'), 'true');
  await click(add(app));
  assert.deepEqual(app.current.draft.safeFoods, []);

  await enter(app, s.onboarding.foodName, 'Rice');
  assert.notEqual(add(app).getAttribute('aria-disabled'), 'true');
  await click(add(app));
  assert.deepEqual(app.current.draft.safeFoods.map(({ id, ...food }) => food), [
    { name: 'Rice', preparation: '', presentationNote: '' },
  ]);
  assert.ok(control(app, 'button', `${s.common.remove} Rice`));
  assert.equal(input(app, s.onboarding.foodName).value, '');
  assert.equal(add(app).getAttribute('aria-disabled'), 'true');

  await enter(app, s.onboarding.foodName, 'Apple slices');
  await keyboardNext(app, s.onboarding.foodName);
  assert.equal(document.activeElement, input(app, s.onboarding.preparation));
  assert.equal(app.current.draft.safeFoods.length, 1);
  await enter(app, s.onboarding.preparation, 'Sliced and warmed');
  await keyboardNext(app, s.onboarding.preparation);
  assert.equal(document.activeElement, input(app, s.onboarding.presentationNote));
  assert.equal(app.current.draft.safeFoods.length, 1);
  await enter(app, s.onboarding.presentationNote, 'Blue bowl');
  await click(add(app));
  assert.deepEqual(app.current.draft.safeFoods.map(({ id, ...food }) => food), [
    { name: 'Rice', preparation: '', presentationNote: '' },
    { name: 'Apple slices', preparation: 'Sliced and warmed', presentationNote: 'Blue bowl' },
  ]);
  assert.ok(app.container.textContent.includes('Sliced and warmed, Blue bowl'));
  assert.ok(control(app, 'button', `${s.common.remove} Apple slices`));
  for (const label of [s.onboarding.foodName, s.onboarding.preparation, s.onboarding.presentationNote]) {
    assert.equal(input(app, label).value, '');
  }
  assert.equal(add(app).getAttribute('aria-disabled'), 'true');
  assert.equal(document.activeElement, input(app, s.onboarding.foodName));
  assert.notEqual(next(app).getAttribute('aria-disabled'), 'true');
});

test('음식 하나를 삭제한 뒤 Review 화면으로 이동해도 나머지 음식과 작성 중 입력이 보존된다', async t => {
  const apple = { id: 'apple', name: 'Apple', preparation: 'Sliced', presentationNote: 'Red bowl' };
  const app = await mountDraft(t, { ...emptyDraft(), step: 'refused-foods', caregiverName: 'Parent',
    caregiverEmail: 'parent@example.com', childName: '나루', ageRange: 'AGE_4_5', allergies: ['none'],
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false }, safeFoods: [apple],
    refusedFoods: [
      { id: 'peas', name: 'Peas', cookingMethod: null, reasons: [] },
      { id: 'beets', name: 'Beets', cookingMethod: null, reasons: [] },
    ], refusedFoodInput: { name: 'Carrot', cookingMethod: null, reasons: [] },
  });
  const before = structuredClone(app.current.draft);
  await click(control(app, 'button', 'Remove Beets'));
  assert.deepEqual(app.current.draft, { ...before, refusedFoods: [before.refusedFoods[0]] });
  assert.ok(control(app, 'button', 'Remove Peas'));
  assert.equal(input(app, 'Food name').value, 'Carrot');
  await click(control(app, 'button', s.common.continue));
  await waitFor(() => app.pathname === '/onboarding/review');
  assert.ok(control(app, 'heading', s.onboarding.reviewTitle('나루')));
  assert.ok(app.container.textContent.includes('Peas'));
  assert.equal(app.container.textContent.includes('Beets'), false);
  assert.deepEqual(app.current.draft, { ...before, step: 'review', refusedFoods: [before.refusedFoods[0]] });
});

test('거부 음식이 없어도 Skip으로 Review에 이동하고 이전 음식·입력 데이터는 유지된다', async t => {
  const apple = { id: 'apple', name: 'Apple', preparation: 'Sliced', presentationNote: 'Red bowl' };
  const draft = { ...emptyDraft(), step: 'refused-foods', caregiverName: 'Parent',
    caregiverEmail: 'parent@example.com', childName: '나루', ageRange: 'AGE_4_5', allergies: ['none'],
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false }, safeFoods: [apple],
    refusedFoods: [], refusedFoodInput: { name: 'Carrot', cookingMethod: null, reasons: [] },
  };
  const app = await mountDraft(t, draft);
  await click(control(app, 'button', s.refusedFoods.skip));
  await waitFor(() => app.pathname === '/onboarding/review');
  assert.ok(control(app, 'heading', s.onboarding.reviewTitle('나루')));
  assert.deepEqual(app.current.draft, { ...draft, step: 'review' });
});

test('마지막 음식을 삭제하거나 빈 목록에서 없음을 해제하면 진행을 차단한다', async t => {
  const app = await mountSafeFoods(t);
  await enter(app, s.onboarding.foodName, 'Apple');
  await click(add(app));
  await click(control(app, 'button', `${s.common.remove} Apple`));
  assert.deepEqual(app.current.draft.safeFoods, []);
  assert.equal(app.current.draft.noSafeFoods, false);
  assert.equal(next(app).getAttribute('aria-disabled'), 'true');
  await click(next(app));
  assertSafeFoodsScreen(app);
  assert.ok(input(app, s.onboarding.foodName));
  await click(none(app));
  assert.equal(app.current.draft.noSafeFoods, true);
  assert.notEqual(next(app).getAttribute('aria-disabled'), 'true');
  await click(none(app));
  assert.equal(app.current.draft.noSafeFoods, false);
  assert.equal(next(app).getAttribute('aria-disabled'), 'true');
  await click(next(app));
  assertSafeFoodsScreen(app);
});
