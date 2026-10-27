// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo; explicit ingredient removal interactions
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo; inline ingredient chip interactions
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
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
    useIngredientCatalog: () => { throw new Error('Free-text input must not load the catalog'); },
    useMealsForCheckin: () => emptyQuery,
    useSavedSuggestionsForCheckin: () => emptyQuery,
  };
  const unusedComponents = {
    './DropdownChoice': 'DropdownChoice',
    '../../../components/UiAssetIcon': 'UiAssetIcon', './MealCompleteStepView': 'MealCompleteStepView',
    './MealDetailsStepView': 'MealDetailsStepView', './MealFoodsStepView': 'MealFoodsStepView',
    '../../../components/MealSaveStatusView': 'MealSaveStatusView',
    './MealPrivacySheetView': 'MealPrivacySheetView', './MealPhotoStepsView': 'MealPhotoStepsView',
  };
  if (name in unusedComponents) return { [unusedComponents[name]]: () => null };
  return originalLoad.call(this, name, ...args);
};

const { newDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { useMealCheckinInputs } = require('../src/features/meal-checkin/hooks/useMealCheckinInputs.ts');
const { useMealSuggestions } = require('../src/features/meal-checkin/hooks/useMealSuggestions.ts');
const { MealCheckinView } = require('../src/features/meal-checkin/screens/MealCheckinView.tsx');
const { MealFoodEditorDialog } = require('../src/components/MealFoodEditorDialog.tsx');
const { copyFor, abcCopyFor } = require('../src/util/strings.ts');
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
    button(label) { return nodes.find(node => node.type === 'Pressable' && (node.props.accessibilityLabel === label || textOf(node) === label)); },
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

for (const photo of [true, false]) test(`Done finishes an inline ingredient chip (photo: ${photo})`, () => {
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

test('blur trims surrounding whitespace and preserves the entered spelling', () => {
  const h = editorHarness().open().type('  pEaNuT   bUtTeR  ').blur();
  assert.deepEqual(h.food.ingredients, ['pEaNuT   bUtTeR']);
  assert.equal(h.changes, 1);
  assert.equal(h.input.ingredient, '');
  assert.equal(h.field(), undefined);
});

test('clicking empty space finishes the chip without requiring a catalog selection', () => {
  const h = editorHarness().open().type('pot');
  assert.equal(h.button('Potato'), undefined);
  assert.equal(h.button('Retry'), undefined);
  h.outside();
  assert.deepEqual(h.food.ingredients, ['pot']);
  assert.equal(h.field(), undefined);
});

test('Done and outside clicks discard blank placeholder chips', () => {
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

test('duplicates remain editable without adding a repeated chip', () => {
  const h = editorHarness({ selected: ['Peanut Butter'] }).open().type('peanut   BUTTER').done();
  assert.deepEqual(h.food.ingredients, ['Peanut Butter']);
  assert.equal(h.field().props.value, 'peanut   BUTTER');
  assert.equal(h.changes, 0);
  h.type('Custom spice').done();
  assert.deepEqual(h.food.ingredients, ['Peanut Butter', 'Custom spice']);
});

test('a rejected addition keeps the ingredient chip editable', () => {
  const h = editorHarness().open().type('Custom').reject().done();
  assert.equal(h.field().props.value, 'Custom');
  assert.equal(h.changes, 0);
});

test('submit, blur, pointer, and touch events only finish the chip once', () => {
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

test('touching within the input preserves editing and long text stays in the chip list', () => {
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

test('finished chips support removal and adding another ingredient', () => {
  const h = editorHarness().open().type('Custom').done();
  h.open().type('Another').outside();
  assert.deepEqual(h.food.ingredients, ['Custom', 'Another']);
  h.button('Remove: Custom').props.onPress();
  h.render();
  assert.deepEqual(h.food.ingredients, ['Another']);
});

test('only the explicit removal button deletes an ingredient and has a mobile touch target', () => {
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

test('Korean free-text names can be finished through the check-in view', () => {
  const h = editorHarness({ language: 'ko' }).open().type('우리집 양념').done();
  assert.deepEqual(h.food.ingredients, ['우리집 양념']);
});

test('meal suggestions do not request the ingredient catalog', () => {
  assert.deepEqual(useMealSuggestions('child').suggestions, []);
  useMealSuggestions('child').retry();
});

test('shared editor preserves the after-meal caller without catalog validation props', () => {
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
