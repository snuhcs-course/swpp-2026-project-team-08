// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require('react/jsx-runtime');

for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename,
);

const platform = { OS: 'android' };
let slots = [], cursor = 0;
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react') return {
    useRef: () => ({ current: null }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
  };
  if (name === 'react-native') return { Platform: platform, StyleSheet: { create: value => value },
    View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', ScrollView: 'ScrollView' };
  if (name === '@react-native-safe-area-context' || name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
  if (name === '@expo/ui/community/menu') return { MenuView: 'SystemMenu' };
  if (name.startsWith('@expo/vector-icons/')) return 'Icon';
  if (name.endsWith('/NativeDropdown') || name === './NativeDropdown') return {
    NativeDropdown: props => platform.OS === 'web' ? null : NativeDropdown(props),
  };
  if (name.endsWith('/AppHeader')) return { AppHeader: 'AppHeader', topBarStyles: { content: {} } };
  if (name.endsWith('/UiAssetIcon') || name === './UiAssetIcon') return { UiAssetIcon: 'Icon' };
  if (name === './AppIcon') return { AppIcon: 'Icon' };
  if (name === './AppButton') return { AppButton: 'Button' };
  if (name.endsWith('/ConfirmDialog')) return { ConfirmDialog: 'ConfirmDialog' };
  if (name === './NativeDatePicker') return { NativeDatePicker: 'SystemDatePicker' };
  return load.call(this, name, ...args);
};
const { NativeDropdown } = require('../src/components/NativeDropdown.native.tsx');
const { DropdownChoice } = require('../src/components/DropdownChoice.tsx');
const { DateField } = require('../src/components/DateField.tsx');
const { ChildProfileView } = require('../src/features/my-page/screens/ChildProfileView.tsx');
const { DifficultyEditor } = require('../src/features/after-meal-review/components/DifficultyEditor.tsx');
const { abcCopyFor, copyFor, optionsFor } = require('../src/util/strings.ts');
Module._load = load;

function elements(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(elements);
  if (typeof element.type === 'function') return elements(element.type(element.props));
  return [element, ...elements(element.props.children)];
}
function render(component, props) { cursor = 0; return elements(component(props)); }
function reset(os) { platform.OS = os; slots = []; cursor = 0; }
function choose(menu, id) { menu.props.onPressAction({ nativeEvent: { event: id } }); }
const menus = nodes => nodes.filter(node => node.type === 'SystemMenu');
const noop = () => {};

test('native menus preserve ids, show selection, and ignore unknown action events', () => {
  for (const os of ['android', 'ios']) {
    reset(os);
    const changes = [];
    const nodes = render(NativeDropdown, { options: [{ id: '4-5', label: '4–5 years' }, { id: '6-7', label: '6–7 years' }],
      value: '4-5', label: 'Age group', onChange: value => changes.push(value), children: null });
    const [menu] = menus(nodes);
    assert.equal(menu.props.shouldOpenOnLongPress, false);
    assert.deepEqual(menu.props.actions.map(action => action.state), ['on', 'off']);
    assert.deepEqual(changes, []); // Rendering or dismissing without an action never edits a value.
    choose(menu, '6-7');
    choose(menu, 'unknown');
    assert.deepEqual(changes, ['6-7']);
    assert.equal(nodes.find(node => node.props.accessible).props.accessibilityValue.text, '4–5 years');
  }
});

test('disabled and empty native dropdowns expose no menu or selection action', () => {
  for (const props of [{ disabled: true, options: [{ id: 'x', label: 'X' }] }, { options: [] }]) {
    reset('android');
    const nodes = render(NativeDropdown, { ...props, value: '', label: 'Choose', onChange: assert.fail, children: null });
    assert.equal(menus(nodes).length, 0);
    assert.equal(nodes.find(node => node.props.accessible).props.accessibilityState.disabled, true);
  }
});

test('shared age and cooking dropdowns use native menus and retain unlisted display values', () => {
  for (const os of ['android', 'ios']) for (const variant of ['onboarding', 'editor']) {
    reset(os);
    const changes = [];
    const nodes = render(DropdownChoice, { variant, value: 'legacy', displayFallback: 'Previously saved value',
      options: [{ id: 'steamed', label: 'Steamed' }], placeholder: 'Choose', onChange: value => changes.push(value) });
    const [menu] = menus(nodes);
    assert.ok(menu);
    assert.ok(nodes.some(node => node.type === 'Text' && node.props.children === 'Previously saved value'));
    assert.deepEqual(changes, []);
    choose(menu, 'steamed');
    assert.deepEqual(changes, ['steamed']);
    assert.equal(nodes.filter(node => node.type === 'Pressable').length, 0);
  }
});

test('web keeps its custom dropdown and commits the original option id on selection', () => {
  reset('web');
  const changes = [];
  const props = { value: '', options: [{ id: '4-5', label: '4–5 years' }],
    placeholder: 'Choose age', onChange: value => changes.push(value) };
  let nodes = render(DropdownChoice, props);
  assert.equal(menus(nodes).length, 0);
  nodes.find(node => node.type === 'Pressable').props.onPress();
  nodes = render(DropdownChoice, props);
  nodes.filter(node => node.type === 'Pressable')[1].props.onPress();
  assert.deepEqual(changes, ['4-5']);
  assert.equal(render(DropdownChoice, props).filter(node => node.type === 'Pressable').length, 1);
});

test('profile age editing uses native menus with localized labels and stable ids', () => {
  for (const os of ['android', 'ios']) for (const language of ['en', 'ko']) {
    reset(os);
    const changes = [], ages = optionsFor('age', language);
    const nodes = render(ChildProfileView, { language, editing: true, childName: 'Luna', ageRange: ages[0].id,
      allergies: '', familyFoods: '', safeFoods: '', onAge: value => changes.push(value) });
    const [menu] = menus(nodes);
    assert.equal(menu.props.title, copyFor(language).myPage.ageGroup);
    assert.deepEqual(menu.props.actions.map(action => action.title), ages.map(option => option.label));
    choose(menu, ages[1].id);
    assert.deepEqual(changes, [ages[1].id]);
  }
});

test('calendar month and year dropdowns keep their numeric bounds and one-based month callbacks', () => {
  for (const os of ['android', 'ios']) {
    reset(os);
    const changes = [];
    const nodes = render(DateField, { variant: 'month-year', year: 2026, month: 10,
      labels: { year: 'Year', month: 'Month', locale: 'en-US' }, onChange: (...value) => changes.push(value) });
    const [month, year] = menus(nodes);
    assert.equal(month.props.actions.length, 12);
    assert.equal(month.props.actions[9].title, 'Oct');
    assert.equal(month.props.actions[9].state, 'on');
    assert.equal(year.props.actions[0].id, '1900');
    assert.equal(year.props.actions.at(-1).id, '2200');
    choose(month, '2'); choose(year, '2024');
    assert.deepEqual(changes, [[2026, 2], [2024, 10]]);
  }
});

test('difficulty category, texture question, and value menus preserve dependent selection rules', () => {
  for (const os of ['android', 'ios']) {
    reset(os);
    const events = [];
    const s = copyFor('en'), a = abcCopyFor('en'), m = s.afterMealReview;
    const props = { foodName: 'Apple', category: null, value: '', note: '', tags: [], options: [],
      labels: { categoryPlaceholder: m.selectCategory, valuePlaceholder: m.selectValue, note: m.note,
        add: m.addTag, remove: s.common.remove, close: s.common.close, categories: a.difficultyCategories,
        questions: a.subcategories, textureQuestion: a.textureQuestion, textureCause: a.textureCause,
        textureTrait: a.textureTrait, examples: a.examples, values: { ...m.values, ...a.values } },
      canAdd: false, showNote: false,
      onCategory: value => events.push(['category', value]), onSubcategory: value => events.push(['question', value]),
      onValue: value => events.push(['value', value]), onNote: noop, onAdd: noop, onRemove: noop };
    let nodes = render(DifficultyEditor, props);
    assert.equal(menus(nodes).length, 1);
    choose(menus(nodes)[0], 'texture');
    nodes = render(DifficultyEditor, { ...props, category: 'texture' });
    assert.equal(menus(nodes).length, 2); // Value stays disabled until the texture question is answered.
    const question = menus(nodes)[1];
    const questionId = question.props.actions[0].id;
    choose(question, questionId);
    nodes = render(DifficultyEditor, { ...props, category: 'texture', subcategory: questionId, options: ['hard'], value: 'hard' });
    assert.equal(menus(nodes).length, 3);
    choose(menus(nodes)[2], 'hard');
    assert.deepEqual(events, [['category', 'texture'], ['question', questionId], ['value', 'hard']]);
    assert.equal(menus(nodes)[2].props.actions[0].state, 'on');
  }
});
