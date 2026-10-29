// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require('react/jsx-runtime');

for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename,
);

let slots, cursor;
const platform = { OS: 'android' };
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react') return {
    useRef: () => ({ current: null }),
    useState(initial) {
      const state = slots, index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
  };
  if (name === 'react-native') return { Platform: platform, StyleSheet: { create: value => value },
    View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView' };
  if (name === '@react-native-community/datetimepicker') return { __esModule: true, default: 'SystemDatePicker' };
  if (name === './AppButton') return { AppButton: 'ConfirmButton' };
  if (name === './AppIcon') return { AppIcon: 'Icon' };
  if (name === './NativeDatePicker') return { NativeDatePicker: 'NativePicker' };
  if (name === './Dialog') return { Dialog: 'Dialog' };
  return load.call(this, name, ...args);
};
const { useMealCheckinInputs } = require('../src/features/meal-checkin/hooks/useMealCheckinInputs.ts');
const { NativeDatePicker } = require('../src/components/NativeDatePicker.native.tsx');
const { DateField } = require('../src/components/DateField.tsx');
Module._load = load;

const labels = { select: 'Select date', close: 'Close', confirm: 'Confirm date', locale: 'ko-KR' };
function harness(os) {
  platform.OS = os;
  slots = []; cursor = 0;
  let draft = { mealDate: '2026-10-27' }, input;
  let updates = 0;
  const h = {
    render() {
      cursor = 0;
      input = useMealCheckinInputs({ draft,
        onUpdate(patch) { draft = { ...draft, ...patch }; updates++; },
      }).date;
      return h;
    },
    picker() {
      const [year, month, day] = input.parts;
      return NativeDatePicker({ value: new Date(year, month - 1, day), labels,
        onChange: input.onDateChange, onConfirm: input.onConfirm, onClose: input.onToggle });
    },
    get input() { return input; }, get date() { return draft.mealDate; }, get updates() { return updates; },
  };
  h.render(); input.onToggle();
  return h.render();
}

test('Android confirmation commits the selected local date immediately and closes', () => {
  const h = harness('android'), picker = h.picker();
  assert.equal(picker.type, 'SystemDatePicker');
  assert.equal(picker.props.display, 'default');
  // A local midnight can be on the previous UTC day; never serialize with toISOString().
  picker.props.onValueChange({}, new Date(2024, 1, 29));
  h.render();
  assert.equal(h.date, '2024-02-29');
  assert.equal(h.updates, 1);
  assert.equal(h.input.open, false);
  h.input.onToggle(); h.render();
  assert.deepEqual(h.input.parts, [2024, 2, 29]);
});

test('Android cancellation or system back closes without saving', () => {
  const h = harness('android');
  h.picker().props.onDismiss(); h.render();
  assert.equal(h.input.open, false);
  assert.equal(h.date, '2026-10-27');
  assert.equal(h.updates, 0);
});

test('iOS wheel edits wait for confirmation and closing discards pending changes', () => {
  const h = harness('ios');
  let dialog = h.picker();
  assert.equal(dialog.type, 'Dialog');
  assert.equal(dialog.props.children.props.display, 'spinner');
  assert.equal(dialog.props.children.props.locale, 'ko-KR');
  dialog.props.children.props.onValueChange({}, new Date(2024, 1, 29)); h.render();
  assert.equal(h.updates, 0);
  dialog = h.picker(); dialog.props.onClose(); h.render();
  assert.equal(h.input.open, false);
  assert.equal(h.date, '2026-10-27');
  h.input.onToggle(); h.render();
  assert.deepEqual(h.input.parts, [2026, 10, 27]);
  h.picker().props.children.props.onValueChange({}, new Date(2024, 1, 29)); h.render();
  h.picker().props.footer.props.onPress(); h.render();
  assert.equal(h.date, '2024-02-29');
  assert.equal(h.updates, 1);
  assert.equal(h.input.open, false);
});

test('web dropdown confirmation still uses selected parts and clamps the day', () => {
  const h = harness('web');
  h.input.onFieldChange(2); h.render();
  h.input.onNumberSelect(31); h.render();
  h.input.onFieldChange(1); h.render();
  h.input.onNumberSelect(2); h.render();
  h.input.onConfirm(); h.render();
  assert.equal(h.date, '2026-02-28');
  assert.equal(h.input.open, false);
});

function elements(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(elements);
  if (typeof element.type === 'function') return elements(element.type(element.props));
  return [element, ...elements(element.props.children)];
}

test('Meal Details opens one native picker on mobile and keeps web date parts', () => {
  for (const os of ['ios', 'android', 'web']) {
    const h = harness(os);
    const nodes = elements(DateField({ ...h.input, label: h.date, labels: { ...labels, date: 'Date',
      year: 'Year', month: 'Month', day: 'Day', hint: '' } }));
    const native = os !== 'web';
    assert.equal(nodes.filter(node => node.type === 'NativePicker').length, native ? 1 : 0);
    assert.equal(nodes.filter(node => node.props.testID?.startsWith('date-part-')).length, native ? 0 : 3);
  }
});
