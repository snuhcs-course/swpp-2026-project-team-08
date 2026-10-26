// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
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
  useState(initial) {
    const slots = activeSlots, index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
};
let catalogQuery;
const emptyQuery = { data: [], isPending: false, isError: false, refetch() {} };
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react') return react;
  if (name === 'react-native') return {
    View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', ScrollView: 'ScrollView',
    KeyboardAvoidingView: 'KeyboardAvoidingView', Modal: 'Modal', Platform: { OS: 'ios' },
    StyleSheet: { create: value => value },
  };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
  if (name === '../../../components/AppHeader') return { AppHeader: () => null, topBarStyles: { content: {} } };
  if (name.endsWith('/checkinReferenceQueries')) return {
    useIngredientCatalog: () => catalogQuery,
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

const { newDraft, getIngredientInput } = require('../src/features/meal-checkin/rules.ts');
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

function editorHarness({ photo = true, language = 'en', selected = [], catalog = ['Potato', 'Peanut Butter'], status = 'ready' } = {}) {
  const slots = [], renderTree = renderer();
  let draft = { ...newDraft('child'), step: 'foods',
    photo: photo ? { id: 'photo', uri: 'file:///before.jpg', mimeType: 'image/jpeg' } : null,
    editingFood: { ...newFood(), name: 'Soup', ingredients: selected } };
  let input, nodes, changes = 0, retries = 0;
  let rejectAddition = false;
  const copy = copyFor(language);
  const harness = {
    render() {
      input = withState(slots, () => useMealCheckinInputs({
        draft, ingredientOptions: catalog, ingredientCatalogStatus: status,
        onUpdate: noop, onEditFood: noop,
        onChangeFood(patch) { changes++; draft = { ...draft, editingFood: { ...draft.editingFood, ...patch } }; },
      })).food;
      const foodInput = rejectAddition ? { ...input, onAddIngredient: () => false, onSelectIngredient: () => false } : input;
      nodes = flatten(renderTree(jsx(MealCheckinView, { draft, language, foodInput, onRetryIngredients: () => { retries++; } })));
      return harness;
    },
    button(label) { return nodes.find(node => node.type === 'Pressable' && (node.props.accessibilityLabel === label || textOf(node) === label)); },
    field() { return nodes.find(node => node.type === 'TextInput' && node.props.accessibilityLabel === copy.mealCheckin.addIngredient); },
    text() { return nodes.map(node => node.text ?? '').join(' '); },
    open() { harness.button(`+ ${copy.common.add}`).props.onPress(); return harness.render(); },
    type(value) { harness.field().props.onChangeText(value); return harness.render(); },
    catalog(nextStatus, nextCatalog = catalog) { status = nextStatus; catalog = nextCatalog; return harness.render(); },
    reject() { rejectAddition = true; return harness.render(); },
    get input() { return input; }, get food() { return draft.editingFood; },
    get changes() { return changes; }, get retries() { return retries; }, get nodes() { return nodes; },
  };
  return harness.render();
}

for (const photo of [true, false]) test(`partial search selects the canonical ingredient in one press (photo: ${photo})`, () => {
  const h = editorHarness({ photo }).open().type('pot');
  assert.equal(h.button('Add').props.disabled, true);
  assert.match(h.text(), /Choose an ingredient from the suggestions/);
  const choice = h.button('Potato');
  // Exercise the production press handler under the dialog's keyboard-tap configuration.
  assert.ok(choice.ancestors.some(node => node.type === 'ScrollView'));
  for (const parent of choice.ancestors.filter(node => node.type === 'ScrollView')) {
    assert.equal(parent.props.keyboardShouldPersistTaps, 'handled');
  }
  choice.props.onPress();
  h.render();
  assert.deepEqual(h.food.ingredients, ['Potato']);
  assert.equal(h.changes, 1);
  assert.equal(h.input.ingredient, '');
  assert.equal(h.field(), undefined);
});

test('Add accepts case and repeated whitespace while storing the canonical catalog name', () => {
  const h = editorHarness().open().type('  pEaNuT   bUtTeR  ');
  assert.equal(h.button('Add').props.disabled, false);
  h.button('Add').props.onPress();
  h.render();
  assert.deepEqual(h.food.ingredients, ['Peanut Butter']);
  assert.equal(h.changes, 1);
  assert.equal(h.input.ingredient, '');
  assert.equal(h.field(), undefined);
});

test('blank and unknown names stay disabled and rejected submissions preserve the typed text', () => {
  const h = editorHarness().open();
  for (const [value, feedback] of [[' ', /Type an ingredient name/], ['Custom', /No matching ingredient/]]) {
    h.type(value);
    assert.equal(h.button('Add').props.disabled, true);
    assert.match(h.text(), feedback);
    assert.equal(h.input.onAddIngredient(), false);
    h.render();
    assert.equal(h.field().props.value, value);
  }
  assert.equal(h.changes, 0);
});

test('duplicates are rejected for typed and selected names regardless of case or whitespace', () => {
  const h = editorHarness({ selected: ['Peanut Butter'] }).open().type('peanut   BUTTER');
  assert.equal(h.button('Add').props.disabled, true);
  assert.match(h.text(), /already added/);
  assert.equal(h.button('Peanut Butter'), undefined);
  assert.equal(h.input.onAddIngredient(), false);
  assert.equal(h.input.onSelectIngredient('PEANUT BUTTER'), false);
  h.render();
  assert.deepEqual(h.food.ingredients, ['Peanut Butter']);
  assert.equal(h.field().props.value, 'peanut   BUTTER');
  assert.equal(h.changes, 0);
});

test('loading, errors, and a successful empty catalog never permit uncatalogued additions', () => {
  const h = editorHarness({ status: 'loading', catalog: [] }).open().type('Potato');
  for (const [status, feedback] of [['loading', /Loading ingredients/], ['error', /Could not load ingredients/], ['ready', /No matching ingredient/]]) {
    h.catalog(status);
    assert.equal(h.button('Add').props.disabled, true);
    assert.match(h.text(), feedback);
    assert.equal(h.input.onAddIngredient(), false);
    assert.equal(h.input.onSelectIngredient('Potato'), false);
    h.render();
    assert.equal(h.field().props.value, 'Potato');
  }
  assert.equal(h.changes, 0);
});

test('retry preserves input and enables Add after catalog recovery', () => {
  const h = editorHarness({ status: 'error', catalog: [] }).open().type('potato');
  h.button('Retry').props.onPress();
  assert.equal(h.retries, 1);
  h.catalog('loading');
  assert.equal(h.button('Retry'), undefined);
  assert.equal(h.field().props.value, 'potato');
  h.catalog('ready', ['Potato']);
  assert.equal(h.button('Add').props.disabled, false);
  h.button('Add').props.onPress();
  h.render();
  assert.deepEqual(h.food.ingredients, ['Potato']);
});

test('failed Add and selection callbacks keep the ingredient input open', () => {
  const h = editorHarness().open().type('Potato').reject();
  h.button('Add').props.onPress();
  h.render();
  assert.equal(h.field().props.value, 'Potato');
  h.button('Potato').props.onPress();
  h.render();
  assert.equal(h.field().props.value, 'Potato');
  assert.equal(h.changes, 0);
});

test('Korean feedback and retry labels are rendered through the check-in view', () => {
  const h = editorHarness({ language: 'ko', status: 'error' }).open().type('감자');
  assert.match(h.text(), /재료를 불러오지 못했습니다/);
  assert.ok(h.button('다시 시도'));
  h.catalog('ready', ['감자']).type('감');
  assert.match(h.text(), /검색 결과에서 재료를 선택/);
  h.button('감자').props.onPress();
  h.render();
  assert.deepEqual(h.food.ingredients, ['감자']);
});

test('reference hook exposes catalog states and retries only ingredients', () => {
  let refetches = 0;
  catalogQuery = { ...emptyQuery, isPending: true, isFetching: true, refetch() { refetches++; } };
  assert.equal(useMealSuggestions('child').ingredientCatalogStatus, 'loading');
  catalogQuery = { ...catalogQuery, isPending: false, isFetching: false, isError: true };
  const failed = useMealSuggestions('child');
  assert.equal(failed.ingredientCatalogStatus, 'error');
  failed.retryIngredients();
  assert.equal(refetches, 1);
  catalogQuery = { ...catalogQuery, isFetching: true };
  assert.equal(useMealSuggestions('child').ingredientCatalogStatus, 'loading');
  catalogQuery = { ...catalogQuery, isFetching: false, isError: false, data: [{ id: '212', name: '감자' }] };
  assert.equal(useMealSuggestions('child').ingredientCatalogStatus, 'ready');
  assert.deepEqual(useMealSuggestions('child').ingredientOptions, ['감자']);
  catalogQuery = { ...catalogQuery, data: [] };
  assert.equal(useMealSuggestions('child').ingredientCatalogStatus, 'ready');
});

test('suggestions exclude normalized duplicates and limit long result lists', () => {
  const catalog = Array.from({ length: 10 }, (_, index) => `Food ${index}`);
  const result = getIngredientInput('food', [' FOOD   0 '], catalog, 'ready');
  assert.deepEqual(result.choices, catalog.slice(1, 7));
  assert.equal(result.status, 'choose');
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
  const add = nodes.find(node => node.type === 'Pressable' && node.props.accessibilityLabel === 'Add');
  assert.equal(add.props.disabled, false);
  add.props.onPress();
  assert.equal(additions, 1);
  nodes = flatten(render(jsx(MealFoodEditorDialog, props)));
  assert.equal(nodes.some(node => node.type === 'TextInput' && node.props.accessibilityLabel === s.mealCheckin.addIngredient), false);
});
