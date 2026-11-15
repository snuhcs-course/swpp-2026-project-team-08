// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 익숙한 음식 자유 입력·포커스·없음 보존과 진행 검증
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

test('자유 입력을 추가하면 설명을 표시하고 입력을 비우며 키보드 이동은 음식을 추가하지 않는다', async t => {
  const app = await mountSafeFoods(t);
  assert.equal(next(app).getAttribute('aria-disabled'), 'true');
  await enter(app, s.onboarding.foodName, '  \n  ');
  assert.equal(add(app).getAttribute('aria-disabled'), 'true');
  await click(add(app));
  assert.deepEqual(app.current.draft.safeFoods, []);
  await enter(app, s.onboarding.foodName, 'Apple slices');
  await act(async () => {
    input(app, s.onboarding.foodName).focus();
    input(app, s.onboarding.foodName).dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true,
    }));
  });
  assert.equal(document.activeElement, input(app, s.onboarding.preparation));
  assert.deepEqual(app.current.draft.safeFoods, []);
  await enter(app, s.onboarding.preparation, 'Sliced and warmed');
  await enter(app, s.onboarding.presentationNote, 'Blue bowl');
  await click(add(app));
  assert.deepEqual(app.current.draft.safeFoods.map(({ id, ...food }) => food), [
    { name: 'Apple slices', preparation: 'Sliced and warmed', presentationNote: 'Blue bowl' },
  ]);
  assert.ok(app.container.textContent.includes('Sliced and warmed, Blue bowl'));
  for (const label of [s.onboarding.foodName, s.onboarding.preparation, s.onboarding.presentationNote]) {
    assert.equal(input(app, label).value, '');
  }
  assert.equal(document.activeElement, input(app, s.onboarding.foodName));
  assert.notEqual(next(app).getAttribute('aria-disabled'), 'true');
});

test('없음을 선택해도 음식과 작성 중 입력을 보존하고 해제하면 다시 편집할 수 있다', async t => {
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
  assert.equal(add(app).getAttribute('aria-disabled'), 'true');
  await click(add(app));
  assert.deepEqual(app.current.draft.safeFoods, before.safeFoods);
  await click(none(app));
  assert.deepEqual(app.current.draft, before);
  assert.equal(input(app, s.onboarding.foodName).readOnly, false);
  assert.equal(input(app, s.onboarding.foodName).value, 'Banana');
  assert.ok(control(app, 'button', `${s.common.remove} Apple`));
});

test('명시적 없음으로 진행하면 보관한 음식 대신 없음 응답을 검토 화면에 표시한다', async t => {
  const app = await mountSafeFoods(t);
  await enter(app, s.onboarding.foodName, 'Apple');
  await click(add(app));
  await click(none(app));
  assert.notEqual(next(app).getAttribute('aria-disabled'), 'true');
  await click(next(app));
  await waitFor(() => app.pathname === '/onboarding/review');
  assert.ok(control(app, 'heading', s.onboarding.reviewTitle('나루')));
  assert.ok(app.container.textContent.includes(s.onboarding.noSafeFoods));
  assert.equal(app.container.textContent.includes('Apple'), false);
  assert.equal(app.current.draft.noSafeFoods, true);
  assert.equal(app.current.draft.safeFoods[0].name, 'Apple');
});
