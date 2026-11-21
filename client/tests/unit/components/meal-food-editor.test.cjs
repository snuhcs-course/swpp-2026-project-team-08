// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식 편집기의 필수 이름·단일 조리법 선택·선택 설명 입력 특성 검증
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
const { DropdownChoice } = require('../../../src/components/DropdownChoice.tsx');
const { AcceptanceSlider } = require('../../../src/components/AcceptanceSlider.tsx');
const { newFood } = require('../../../src/rules/foodDraft.ts');
const s = copyFor('en'), labels = abcCopyFor('en');
const cookingOptions = [
  ['raw', 'Raw'], ['boiled', 'Boiled'], ['steamed', 'Steamed'],
  ['pan_fried', 'Pan-fried'], ['stir_fried', 'Stir-fried'], ['baked', 'Baked'],
  ['roasted', 'Roasted'], ['mashed', 'Mashed'], ['blended', 'Blended'], ['other', 'Other'],
];

function button(container, label) {
  const matches = [...container.querySelectorAll('[role="button"]')]
    .filter(node => (node.getAttribute('aria-label') ?? node.textContent) === label);
  assert.equal(matches.length, 1, `${label} 버튼이 하나 있어야 한다`);
  return matches[0];
}

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
  const saved = t.mock.fn(), changed = t.mock.fn(), cancelled = t.mock.fn();
  let tree, showFood;
  // 호출자가 내려주는 controlled 값만 갱신한다. 식사 Hook·목록·저장소는 연결하지 않는다.
  function Editor() {
    const [value, setValue] = React.useState(food);
    showFood = setValue;
    tree = MealFoodEditorDialog({ food: value, mode,
      meal: s.mealCheckin, common: s.common, labels, ingredient: '',
      onIngredientChange() {}, onAddIngredient() {}, onRemoveIngredient() {}, onCancel: cancelled,
      onChange: patch => { changed(patch); setValue(current => ({ ...current, ...patch })); },
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
  async function typeField(label, value) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        .set.call(field(label), value);
      field(label).dispatchEvent(new window.Event('input', { bubbles: true }));
    });
  }
  async function openCooking(current) {
    await act(async () => button(dialog, current).click());
    await waitFor(() => {
      const active = document.querySelector('[role="dialog"]');
      return active && active !== dialog && button(active, cookingOptions[0][1]);
    });
    return document.querySelector('[role="dialog"]');
  }
  return { dialog, field, save, saved, changed, cancelled, openCooking,
    get preparation() { return findElement(tree, DropdownChoice).props.value; },
    // RN Web은 accessibilityState.checked를 출력하지 않아 공통 슬라이더에 전달한 값을 검사한다.
    get acceptance() { return findElement(tree, AcceptanceSlider).props.value; },
    typeName: value => typeField(s.mealCheckin.name, value),
    typeDetail: value => typeField(labels.detail, value),
    async showFood(value) { await act(async () => showFood(value)); },
    async chooseCooking(current, next) {
      await openCooking(current);
      await act(async () => button(document.querySelector('[role="dialog"]'), next).click());
      await waitFor(() => dialog.getAttribute('role') === 'dialog' && button(dialog, next));
    },
    async closeCooking() {
      await act(async () => document.dispatchEvent(new window.KeyboardEvent('keyup', {
        key: 'Escape', bubbles: true,
      })));
      await waitFor(() => document.querySelector('[role="dialog"]') === dialog);
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


test('조리법 목록에서 항목을 고르면 목록이 닫히고 고른 조리법 하나만 표시·전달된다', async t => {
  const food = { ...newFood(), name: 'Rice', ingredients: ['Rice'],
    servingNote: 'Small bowl', acceptance: 0 };
  const h = await mountEditor(t, { food });
  let current = 'Select method';
  for (const [preparation, label] of cookingOptions) {
    const menu = await h.openCooking(current);
    assert.deepEqual([...menu.querySelectorAll('[role="button"]')].map(node => node.textContent),
      cookingOptions.map(([, option]) => option));
    await act(async () => button(menu, label).click());
    await waitFor(() => document.querySelector('[role="dialog"]') === h.dialog);
    const displayed = [...h.dialog.querySelectorAll('[role="button"]')]
      .map(node => node.textContent).filter(text => cookingOptions.some(([, option]) => option === text));
    assert.deepEqual(displayed, [label]);
    assert.equal(h.preparation, preparation);
    assert.deepEqual(h.changed.mock.calls.at(-1).arguments, [{ preparation }]);
    await h.clickSave();
    assert.deepEqual(h.saved.mock.calls.at(-1).arguments, [{ ...food, preparation }]);
    current = label;
  }
  assert.equal(h.saved.mock.callCount(), cookingOptions.length);
});

test('기존 조리법을 바꾸면 이전 선택을 대체하고, 같은 조리법을 다시 골라도 선택이 해제되지 않는다', async t => {
  const food = { ...newFood(), name: 'Rice', ingredients: ['Rice'], preparation: 'boiled',
    servingNote: 'Small bowl', acceptance: 0 };
  const h = await mountEditor(t, { food, mode: 'edit' });
  await h.chooseCooking('Boiled', 'Steamed');
  assert.equal(h.preparation, 'steamed');
  assert.deepEqual(h.changed.mock.calls.at(-1).arguments, [{ preparation: 'steamed' }]);
  await h.chooseCooking('Steamed', 'Steamed');
  assert.equal(h.preparation, 'steamed');
  assert.ok(button(h.dialog, 'Steamed'));
  assert.equal(h.saved.mock.callCount(), 0);
  await h.clickSave();
  assert.deepEqual(h.saved.mock.calls[0].arguments, [{ ...food, preparation: 'steamed' }]);
});

test('조리법 목록을 선택 없이 닫으면 미선택 또는 기존 조리법과 작성 중 입력이 유지된다', async t => {
  const food = { ...newFood(), name: 'Rice', ingredients: ['Rice'],
    servingNote: '작성 중 설명', acceptance: 0 };
  const h = await mountEditor(t, { food });
  for (const [preparation, label] of [['', 'Select method'], ['boiled', 'Boiled']]) {
    await h.showFood({ ...food, preparation });
    await h.openCooking(label);
    await h.closeCooking();
    assert.equal(h.preparation, preparation);
    assert.ok(button(h.dialog, label));
    assert.equal(h.changed.mock.callCount(), 0);
    assert.equal(h.cancelled.mock.callCount(), 0);
    await h.clickSave();
    assert.deepEqual(h.saved.mock.calls.at(-1).arguments, [{ ...food, preparation }]);
  }
});

test('추가 설명에 한글·영문·기호·공백을 입력하거나 수정하면 입력한 문장이 그대로 표시·전달된다', async t => {
  const food = { ...newFood(), name: 'Rice', ingredients: ['Rice'],
    preparation: 'steamed', acceptance: 0 };
  const h = await mountEditor(t, { food });
  for (const servingNote of ['  한입  크기 · 2cm (따뜻하게)  ', 'Soft & small — 1/2 tsp 🍚']) {
    await h.typeDetail(servingNote);
    assert.equal(h.field(labels.detail).value, servingNote);
    assert.deepEqual(h.changed.mock.calls.at(-1).arguments, [{ servingNote }]);
    await h.clickSave();
    assert.deepEqual(h.saved.mock.calls.at(-1).arguments, [{ ...food, servingNote }]);
  }
  assert.equal(h.saved.mock.callCount(), 2);
});

test('기존 추가 설명을 모두 지우거나 공백만 남겨도 이름이 있으면 다른 입력을 유지한 채 저장할 수 있다', async t => {
  const food = { ...newFood(), name: 'Rice', ingredients: ['Rice'],
    preparation: 'steamed', servingNote: 'Small bowl', acceptance: 0 };
  const h = await mountEditor(t, { food, mode: 'edit' });
  for (const servingNote of ['', '   ']) {
    await h.typeDetail(servingNote);
    assert.equal(h.field(labels.detail).value, servingNote);
    assert.deepEqual(h.changed.mock.calls.at(-1).arguments, [{ servingNote }]);
    assert.notEqual(h.save.getAttribute('aria-disabled'), 'true');
    await h.clickSave();
    assert.deepEqual(h.saved.mock.calls.at(-1).arguments, [{ ...food, servingNote }]);
  }
  assert.equal(h.saved.mock.callCount(), 2);
});

test('추가 설명을 입력해도 음식 이름이 비어 있거나 공백뿐이면 저장할 수 없다', async t => {
  const h = await mountEditor(t);
  await h.typeDetail('한입 크기로 제공');
  for (const name of ['', '   ']) {
    await h.typeName(name);
    assert.equal(h.field(labels.detail).value, '한입 크기로 제공');
    assert.equal(h.save.getAttribute('aria-disabled'), 'true');
    await h.clickSave();
    assert.equal(h.saved.mock.callCount(), 0);
  }
});
