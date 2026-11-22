// AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
// Changed: Ingredient interactions and native icon boundary for CI
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 재료 카탈로그 훅의 모의 항목 제거
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 목록의 + Add 와 재료 추가 버튼을 구분
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 공통 음식 편집기의 재료 입력 이벤트 검증 이동 및 중복·무효 검증 제거
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const { jsx } = require('react/jsx-runtime');

for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename,
);

// Match the repository's hook harness: production state transitions with native boundaries stubbed.
let activeSlots;
let cursor;
function withState(slots, action) {
  const previousSlots = activeSlots, previousCursor = cursor;
  activeSlots = slots; cursor = 0;
  try { return action(); }
  finally { activeSlots = previousSlots; cursor = previousCursor; }
}
const react = {
  useRef(initial) {
    const slots = activeSlots, index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useState(initial) {
    const slots = activeSlots, index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
};
const emptyQuery = { data: [], isPending: false, isError: false, refetch() {} };
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react') return react;
  if (name === 'react-native') return {
    View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', ScrollView: 'ScrollView',
    KeyboardAvoidingView: 'KeyboardAvoidingView', Modal: 'Modal', Platform: { OS: 'ios' },
    StyleSheet: { create: value => value, absoluteFill: {} },
  };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
  if (name === '../../../components/AppHeader') return { AppHeader: () => null, topBarStyles: { content: {} } };
  if (name.endsWith('/checkinReferenceQueries')) return {
    useMealsForCheckin: () => emptyQuery,
    useSavedSuggestionsForCheckin: () => emptyQuery,
  };
  const unusedComponents = {
    './DropdownChoice': 'DropdownChoice', './UiAssetIcon': 'UiAssetIcon',
    '../../../components/UiAssetIcon': 'UiAssetIcon', './MealCompleteStepView': 'MealCompleteStepView',
    './MealDetailsStepView': 'MealDetailsStepView', './MealFoodsStepView': 'MealFoodsStepView',
    '../../../components/MealSaveStatusView': 'MealSaveStatusView',
    './MealPrivacySheetView': 'MealPrivacySheetView', './MealPhotoStepsView': 'MealPhotoStepsView',
  };
  if (name in unusedComponents) return { [unusedComponents[name]]: () => null };
  return originalLoad.call(this, name, ...args);
};

const { newDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../../src/rules/foodDraft.ts');
const { useMealCheckinInputs } = require('../../../src/features/meal-checkin/hooks/useMealCheckinInputs.ts');
const { MealCheckinView } = require('../../../src/features/meal-checkin/screens/MealCheckinView.tsx');
const { MealFoodEditorDialog } = require('../../../src/components/MealFoodEditorDialog.tsx');
const { copyFor, abcCopyFor } = require('../../../src/util/strings.ts');
Module._load = originalLoad;

function renderer() {
  const state = new Map();
  return function render(element, path = 'root', ancestors = []) {
    if (element === null || element === undefined || typeof element === 'boolean') return [];
    if (Array.isArray(element)) return element.flatMap((child, index) => render(child, `${path}.${index}`, ancestors));
    if (typeof element !== 'object') return [{ text: String(element) }];
    if (typeof element.type === 'function') {
      if (!state.has(path)) state.set(path, []);
      return render(withState(state.get(path), () => element.type(element.props)), `${path}.render`, ancestors);
    }
    const node = { type: element.type, props: element.props, ancestors };
    node.children = render(element.props.children, `${path}.children`, [...ancestors, node]);
    return [node];
  };
}
const textOf = node => node.text ?? (node.children ?? []).map(textOf).join('');
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children ?? [])]);
const noop = () => {};

function editorHarness({ photo = true, language = 'en', selected = [] } = {}) {
  const slots = [], renderTree = renderer();
  let draft = { ...newDraft('child'), step: 'foods',
    photo: photo ? { id: 'photo', uri: 'file:///before.jpg', mimeType: 'image/jpeg' } : null,
    editingFood: { ...newFood(), name: 'Soup', ingredients: selected } };
  let input, nodes, changes = 0;
  let rejectAddition = false;
  const copy = copyFor(language);
  const harness = {
    render() {
      input = withState(slots, () => useMealCheckinInputs({
        draft,
        onUpdate: noop, onEditFood: noop,
        onChangeFood(patch) { changes++; draft = { ...draft, editingFood: { ...draft.editingFood, ...patch } }; },
      })).food;
      const foodInput = rejectAddition ? { ...input, onAddIngredient: () => false } : input;
      nodes = flatten(renderTree(jsx(MealCheckinView, { draft, language, foodInput })));
      return harness;
    },
    button(label) {
      return nodes.find(node => node.type === 'Pressable' && (
        node.props.accessibilityLabel === label
        || (textOf(node) === label && !node.props.accessibilityLabel)
      ));
    },
    field() { return nodes.find(node => node.type === 'TextInput' && node.props.accessibilityLabel === copy.mealCheckin.addIngredient); },
    text() { return nodes.map(node => node.text ?? '').join(' '); },
    open() { harness.button(`+ ${copy.common.add}`).props.onPress(); return harness.render(); },
    type(value) { harness.field().props.onChangeText(value); return harness.render(); },
    done() { harness.field().props.onSubmitEditing(); return harness.render(); },
    blur() { harness.field().props.onBlur(); return harness.render(); },
    outside() { nodes.find(node => node.type === 'KeyboardAvoidingView' && node.props.onPointerDown).props.onPointerDown(); return harness.render(); },
    reject() { rejectAddition = true; return harness.render(); },
    get input() { return input; }, get food() { return draft.editingFood; },
    get changes() { return changes; }, get nodes() { return nodes; },
  };
  return harness.render();
}

for (const photo of [true, false]) test(`사진 첨부 여부가 ${photo}인 편집창에서 재료 입력 후 Done을 누르면 재료가 한 번 추가되고 입력창이 닫힌다`, () => {
  const h = editorHarness({ photo }).open().type('Homemade spice mix');
  const field = h.field();
  assert.equal(field.props.autoFocus, true);
  assert.equal(field.props.returnKeyType, 'done');
  assert.equal(field.props.submitBehavior, 'blurAndSubmit');
  assert.ok(field.ancestors.some(node => node.props.style?.flexWrap === 'wrap'));
  assert.equal(h.button('Add'), undefined);
  assert.equal(h.button('+ Add'), undefined);
  h.done();
  assert.deepEqual(h.food.ingredients, ['Homemade spice mix']);
  assert.equal(h.changes, 1);
  assert.equal(h.input.ingredient, '');
  assert.equal(h.field(), undefined);
  assert.ok(h.button('+ Add'));
});

test('재료 입력창에서 포커스를 옮기면 앞뒤 공백만 제거한 이름으로 재료가 추가된다', () => {
  const h = editorHarness().open().type('  pEaNuT   bUtTeR  ').blur();
  assert.deepEqual(h.food.ingredients, ['pEaNuT   bUtTeR']);
  assert.equal(h.changes, 1);
  assert.equal(h.input.ingredient, '');
  assert.equal(h.field(), undefined);
});

test('재료 입력 후 빈 공간을 누르면 검색 항목 선택 없이 입력한 이름으로 재료가 추가된다', () => {
  const h = editorHarness().open().type('pot');
  assert.equal(h.button('Potato'), undefined);
  assert.equal(h.button('Retry'), undefined);
  h.outside();
  assert.deepEqual(h.food.ingredients, ['pot']);
  assert.equal(h.field(), undefined);
});

test('빈 재료 입력이나 공백만 입력한 상태에서 확정하면 재료를 추가하지 않고 입력창을 닫는다', () => {
  for (const action of ['done', 'blur', 'outside']) {
    for (const value of ['', ' ', '  \t ']) {
      const h = editorHarness().open().type(value)[action]();
      assert.deepEqual(h.food.ingredients, []);
      assert.equal(h.changes, 0);
      assert.equal(h.field(), undefined);
      assert.equal(h.input.ingredient, '');
      assert.ok(h.button('+ Add'));
    }
  }
});

test('이미 있는 재료를 대소문자·공백만 바꿔 입력하면 추가하지 않고 입력을 유지하며 다른 이름으로 바꾸면 추가된다', () => {
  const h = editorHarness({ selected: ['Peanut Butter'] }).open().type('peanut   BUTTER').done();
  assert.deepEqual(h.food.ingredients, ['Peanut Butter']);
  assert.equal(h.field().props.value, 'peanut   BUTTER');
  assert.equal(h.changes, 0);
  h.type('Custom spice').done();
  assert.deepEqual(h.food.ingredients, ['Peanut Butter', 'Custom spice']);
});

test('재료 추가가 거절되면 입력창과 입력한 이름을 유지한다', () => {
  const h = editorHarness().open().type('Custom').reject().done();
  assert.equal(h.field().props.value, 'Custom');
  assert.equal(h.changes, 0);
});

test('재료 입력 확정·포커스 이동·포인터·터치 이벤트가 연속 발생해도 재료는 한 번만 추가된다', () => {
  const h = editorHarness().open().type('Custom');
  const field = h.field();
  const outside = h.nodes.find(node => node.type === 'KeyboardAvoidingView' && node.props.onPointerDown);
  field.props.onSubmitEditing();
  field.props.onBlur();
  outside.props.onPointerDown();
  outside.props.onTouchStart();
  h.render();
  assert.deepEqual(h.food.ingredients, ['Custom']);
  assert.equal(h.changes, 1);
});

test('재료 입력창 안을 터치하면 입력을 유지하고 긴 재료 이름도 입력 영역 너비 안에 표시된다', () => {
  const h = editorHarness().open().type('A very long custom ingredient name '.repeat(10));
  let stopped = 0;
  const field = h.field();
  field.props.onPointerDown({ stopPropagation() { stopped++; } });
  field.props.onTouchStart({ stopPropagation() { stopped++; } });
  assert.equal(stopped, 2);
  assert.equal(h.changes, 0);
  assert.equal(field.ancestors.at(-1).props.style.at(-1).maxWidth, '100%');
  h.done();
  assert.equal(h.food.ingredients.length, 1);
});

test('재료 이름을 눌러도 삭제되지 않고 48 이상 크기의 삭제 버튼을 눌러야 해당 재료만 삭제된다', () => {
  const h = editorHarness({ selected: ['Carrot', 'Peas'] });
  const remove = h.button('Remove: Carrot');
  assert.equal(textOf(remove), '×');
  const chip = remove.ancestors.at(-1);
  assert.equal(chip.type, 'View');
  assert.equal(chip.props.onPress, undefined);
  const name = chip.children.find(node => node.type === 'Text');
  assert.equal(name.props.onPress, undefined);
  assert.deepEqual(h.food.ingredients, ['Carrot', 'Peas']);
  const style = Object.assign({}, ...remove.props.style({ pressed: false }).filter(Boolean));
  assert.ok(style.width >= 48 && style.height >= 48);
  remove.props.onPress();
  h.render();
  assert.deepEqual(h.food.ingredients, ['Peas']);
  assert.equal(h.changes, 1);
});

test('한국어 편집창에서 한글 재료 이름을 확정하면 입력한 이름 그대로 추가된다', () => {
  const h = editorHarness({ language: 'ko' }).open().type('우리집 양념').done();
  assert.deepEqual(h.food.ingredients, ['우리집 양념']);
});

test('식후 리뷰의 재료 추가 콜백이 값을 반환하지 않아도 포커스를 옮기면 추가 요청 후 입력창이 닫힌다', () => {
  const render = renderer(), s = copyFor('en');
  let additions = 0;
  const props = { food: { ...newFood(), name: 'Soup' }, mode: 'edit', meal: s.mealCheckin, common: s.common,
    labels: abcCopyFor('en'), ingredient: 'Custom', onIngredientChange: noop, onRemoveIngredient: noop,
    onChange: noop, onSave: noop, onCancel: noop, onAddIngredient() { additions++; } };
  let nodes = flatten(render(jsx(MealFoodEditorDialog, props)));
  nodes.find(node => node.type === 'Pressable' && textOf(node) === '+ Add').props.onPress();
  nodes = flatten(render(jsx(MealFoodEditorDialog, props)));
  const field = nodes.find(node => node.type === 'TextInput' && node.props.accessibilityLabel === s.mealCheckin.addIngredient);
  field.props.onBlur();
  assert.equal(additions, 1);
  nodes = flatten(render(jsx(MealFoodEditorDialog, props)));
  assert.equal(nodes.some(node => node.type === 'TextInput' && node.props.accessibilityLabel === s.mealCheckin.addIngredient), false);
});
