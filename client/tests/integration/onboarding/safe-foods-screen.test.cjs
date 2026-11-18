// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 음식 추가·개별 삭제·없음 전환과 실제 화면 이동 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountSafeFoods } = require('../../helpers/onboarding-screen.cjs');
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
  const app = await mountSafeFoods(t);
  await enter(app, s.onboarding.foodName, 'Apple');
  await enter(app, s.onboarding.preparation, 'Sliced');
  await enter(app, s.onboarding.presentationNote, 'Red bowl');
  await click(add(app));
  await enter(app, s.onboarding.foodName, 'Banana');
  await enter(app, s.onboarding.preparation, 'Mashed');
  await enter(app, s.onboarding.presentationNote, 'Blue bowl');
  await click(add(app));
  await enter(app, s.onboarding.foodName, 'Next food');
  await enter(app, s.onboarding.preparation, 'Warmed');
  await enter(app, s.onboarding.presentationNote, 'Small plate');
  const before = structuredClone(app.current.draft);
  const remaining = before.safeFoods[0];
  await click(control(app, 'button', `${s.common.remove} Banana`));
  assert.deepEqual(app.current.draft, { ...before, safeFoods: [remaining] });
  assert.equal(app.container.textContent.includes('Banana'), false);
  assert.equal(app.container.textContent.includes('Mashed, Blue bowl'), false);
  assert.ok(control(app, 'button', `${s.common.remove} Apple`));
  assert.ok(app.container.textContent.includes('Sliced, Red bowl'));
  for (const [label, value] of [
    [s.onboarding.foodName, 'Next food'], [s.onboarding.preparation, 'Warmed'],
    [s.onboarding.presentationNote, 'Small plate'],
  ]) assert.equal(input(app, label).value, value);
  assert.notEqual(next(app).getAttribute('aria-disabled'), 'true');
  await click(next(app));
  await waitFor(() => app.pathname === '/onboarding/review');
  assertReviewScreen(app);
  // 아직 Add하지 않은 입력은 다음 단계에서도 음식 목록에 포함하지 않는다.
  assert.deepEqual(app.current.draft, { ...before, step: 'review', safeFoods: [remaining] });
});

test('없음을 선택·해제해도 음식과 입력을 보존하고 다시 선택해 진행하면 없음으로 검토 화면에 진입한다', async t => {
  const app = await mountSafeFoods(t);
  await enter(app, s.onboarding.foodName, 'Apple');
  await click(add(app));
  await enter(app, s.onboarding.foodName, 'Banana');
  await enter(app, s.onboarding.preparation, 'Mashed');
  await enter(app, s.onboarding.presentationNote, 'Small bowl');
  const before = structuredClone(app.current.draft);
  await click(none(app));
  assert.deepEqual(app.current.draft, { ...before, noSafeFoods: true });
  for (const label of [s.onboarding.foodName, s.onboarding.preparation, s.onboarding.presentationNote]) {
    assert.equal(input(app, label).readOnly, true);
  }
  assert.equal(app.container.textContent.includes('Apple'), false);
  assert.equal(add(app).getAttribute('aria-disabled'), 'true');
  await click(add(app));
  assert.deepEqual(app.current.draft, { ...before, noSafeFoods: true });
  await click(none(app));
  assert.deepEqual(app.current.draft, before);
  for (const [label, value] of [
    [s.onboarding.foodName, 'Banana'], [s.onboarding.preparation, 'Mashed'],
    [s.onboarding.presentationNote, 'Small bowl'],
  ]) {
    assert.equal(input(app, label).readOnly, false);
    assert.equal(input(app, label).value, value);
  }
  assert.notEqual(add(app).getAttribute('aria-disabled'), 'true');
  assert.ok(control(app, 'button', `${s.common.remove} Apple`));
  await click(none(app));
  assert.notEqual(next(app).getAttribute('aria-disabled'), 'true');
  await click(next(app));
  await waitFor(() => app.pathname === '/onboarding/review');
  assertReviewScreen(app);
  assert.ok(app.container.textContent.includes(s.onboarding.noSafeFoods));
  assert.equal(app.container.textContent.includes('Apple'), false);
  assert.deepEqual(app.current.draft, { ...before, step: 'review', noSafeFoods: true });
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
