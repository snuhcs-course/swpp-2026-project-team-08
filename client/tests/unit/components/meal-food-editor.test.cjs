// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 공통 음식 편집기의 이름 입력·저장 버튼 경계 및 초기값 표시 검증
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { React, act, waitFor } = require('../../helpers/react-harness.cjs');
const { mockModules } = require('../../helpers/mock-modules.cjs');

// 실제 RN Web 입력·버튼·모달을 사용하고 기기 레이아웃과 아이콘만 대체한다.
const globals = { Node: window.Node, HTMLElement: window.HTMLElement,
  ShadowRoot: window.ShadowRoot, requestAnimationFrame: callback => setTimeout(callback, 0),
  cancelAnimationFrame: clearTimeout,
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} } };
const descriptors = new Map(Object.keys(globals)
  .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
for (const [key, value] of Object.entries(globals)) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}
after(() => {
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});
const native = require('react-native-web');
mockModules(name => {
  if (name === 'react-native') return native;
  if (name === '@expo/vector-icons/Feather') return () => null;
  if (name === 'expo-image') return { Image: () => null };
  if (/\.(svg|png)$/.test(name)) return name;
});
const { createRoot } = require('react-dom/client');
const { MealFoodEditorDialog } = require('../../../src/components/MealFoodEditorDialog.tsx');
const { copyFor, abcCopyFor } = require('../../../src/util/strings.ts');
const { AcceptanceSlider } = require('../../../src/components/AcceptanceSlider.tsx');
const { newFood } = require('../../../src/rules/foodDraft.ts');
const s = copyFor('en'), labels = abcCopyFor('en');

function findElement(node, type) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return null;
}

async function mountEditor(t, { food = newFood(), mode = 'add' } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const saved = t.mock.fn();
  let tree;
  // 호출자가 내려주는 controlled 값만 갱신한다. 식사 Hook·목록·저장소는 연결하지 않는다.
  function Editor() {
    const [value, setValue] = React.useState(food);
    tree = MealFoodEditorDialog({ food: value, mode,
      meal: s.mealCheckin, common: s.common, labels, ingredient: '',
      onIngredientChange() {}, onAddIngredient() {}, onRemoveIngredient() {}, onCancel() {},
      onChange: patch => setValue(current => ({ ...current, ...patch })),
      onSave: () => saved(value) });
    return tree;
  }
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  await act(async () => root.render(React.createElement(Editor)));
  await waitFor(() => document.querySelector('[aria-modal="true"]'));
  // jsdom은 CSS 애니메이션을 실행하지 않으므로 종료 이벤트만 전달한다.
  let animation = document.querySelector('[aria-modal="true"]');
  while (animation && !window.getComputedStyle(animation).animationDuration) animation = animation.parentElement;
  assert.ok(animation);
  await act(async () => animation.dispatchEvent(new window.Event('animationend', { bubbles: true })));
  await waitFor(() => document.querySelector('[role="dialog"]'));
  const dialog = document.querySelector('[role="dialog"]');
  function field(label) {
    const input = [...dialog.querySelectorAll('input')].find(node => node.getAttribute('aria-label') === label);
    assert.ok(input, `${label} 입력칸`);
    return input;
  }
  const save = dialog.querySelector('[aria-label="Save food"]');
  assert.ok(save);
  return { dialog, field, save, saved,
    // RN Web은 accessibilityState.checked를 출력하지 않아 공통 슬라이더에 전달한 값을 검사한다.
    get acceptance() { return findElement(tree, AcceptanceSlider).props.value; },
    async typeName(name) {
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
          .set.call(field(s.mealCheckin.name), name);
        field(s.mealCheckin.name).dispatchEvent(new window.Event('input', { bubbles: true }));
      });
    },
    async clickSave() { await act(async () => save.click()); },
  };
}

test('음식을 추가하려고 열면 이름·재료·조리법·추가 설명은 비어 있고 수용도는 선택되어 있지 않다', async t => {
  const h = await mountEditor(t);
  assert.equal(h.dialog.querySelector('[role="heading"]').textContent, 'Add food item');
  assert.equal(h.field(s.mealCheckin.name).value, '');
  assert.equal(h.field(s.mealCheckin.name).placeholder, 'Enter food name');
  assert.equal(h.field(labels.detail).value, '');
  assert.ok(h.dialog.textContent.includes(labels.selectCooking));
  const options = [...h.dialog.querySelectorAll('[role="radio"]')];
  assert.equal(options.length, 4);
  assert.equal(h.acceptance, null);
});

test('음식을 수정하려고 열면 기존 이름·조리법·추가 설명·수용도가 입력되어 있다', async t => {
  const h = await mountEditor(t, { mode: 'edit', food: { ...newFood(), name: 'My soup',
    preparation: 'steamed', servingNote: 'Small pieces', acceptance: 0 } });
  assert.equal(h.dialog.querySelector('[role="heading"]').textContent, 'Edit My soup');
  assert.equal(h.field(s.mealCheckin.name).value, 'My soup');
  assert.equal(h.field(labels.detail).value, 'Small pieces');
  assert.ok(h.dialog.textContent.includes('Steamed'));
  assert.equal(h.acceptance, 0);
});

test('음식 이름이 비어 있거나 공백뿐이면 저장 버튼이 비활성화되고, 이름을 입력하면 선택 항목 없이 활성화된다', async t => {
  const h = await mountEditor(t);
  for (const name of ['', '   ', '\t \u3000']) {
    await h.typeName(name);
    assert.equal(h.save.getAttribute('aria-disabled'), 'true');
    await h.clickSave();
    assert.equal(h.saved.mock.callCount(), 0);
  }
  await h.typeName('  우리집 국  ');
  assert.notEqual(h.save.getAttribute('aria-disabled'), 'true');
  assert.equal(h.dialog.querySelector('[role="heading"]').textContent, 'Add food item');
  await h.clickSave();
  assert.equal(h.saved.mock.callCount(), 1);
  const food = h.saved.mock.calls[0].arguments[0];
  // 편집기는 입력을 그대로 전달한다. 저장 시 공백 제거는 기능 Hook의 책임이다.
  assert.equal(food.name, '  우리집 국  ');
  assert.deepEqual(food.ingredients, []);
  assert.equal(food.preparation, '');
  assert.equal(food.servingNote, '');
  assert.equal(food.acceptance ?? null, null);
});

test('입력한 음식 이름을 다시 지우면 저장 버튼이 비활성화된다', async t => {
  const h = await mountEditor(t);
  await h.typeName('Rice');
  assert.notEqual(h.save.getAttribute('aria-disabled'), 'true');
  await h.typeName('');
  assert.equal(h.field(s.mealCheckin.name).value, '');
  assert.equal(h.save.getAttribute('aria-disabled'), 'true');
  await h.clickSave();
  assert.equal(h.saved.mock.callCount(), 0);
});
