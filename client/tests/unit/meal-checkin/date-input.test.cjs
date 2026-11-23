// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 오늘 상한 및 네이티브 UTC 날짜 전달·복원 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 날짜 입력의 플랫폼 동작·경계 검증을 Unit으로 분리
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
const { useMealCheckinInputs } = require('../../../src/features/meal-checkin/hooks/useMealCheckinInputs.ts');
const { NativeDatePicker } = require('../../../src/components/NativeDatePicker.native.tsx');
const { DateField } = require('../../../src/components/DateField.tsx');
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

test('안드로이드에서 날짜를 확정하면 선택한 날짜를 저장하고 선택기를 닫는다', () => {
  const h = harness('android'), picker = h.picker();
  assert.equal(picker.type, 'SystemDatePicker');
  assert.equal(picker.props.display, 'default');
  // The native picker emits UTC components; storage remains a local calendar date.
  picker.props.onValueChange({}, new Date(Date.UTC(2024, 1, 29)));
  h.render();
  assert.equal(h.date, '2024-02-29');
  assert.equal(h.updates, 1);
  assert.equal(h.input.open, false);
  h.input.onToggle(); h.render();
  assert.deepEqual(h.input.parts, [2024, 2, 29]);
});

test('안드로이드에서 날짜 선택을 취소하거나 뒤로가면 기존 날짜를 유지한다', () => {
  const h = harness('android');
  h.picker().props.onDismiss(); h.render();
  assert.equal(h.input.open, false);
  assert.equal(h.date, '2026-10-27');
  assert.equal(h.updates, 0);
});

test('아이폰에서 날짜는 확정할 때만 저장하고 닫으면 변경 중인 날짜를 버린다', () => {
  const h = harness('ios');
  let dialog = h.picker();
  assert.equal(dialog.type, 'Dialog');
  assert.equal(dialog.props.children.props.display, 'spinner');
  assert.equal(dialog.props.children.props.locale, 'ko-KR');
  dialog.props.children.props.onValueChange({}, new Date(Date.UTC(2024, 1, 29))); h.render();
  assert.equal(h.updates, 0);
  dialog = h.picker(); dialog.props.onClose(); h.render();
  assert.equal(h.input.open, false);
  assert.equal(h.date, '2026-10-27');
  h.input.onToggle(); h.render();
  assert.deepEqual(h.input.parts, [2026, 10, 27]);
  h.picker().props.children.props.onValueChange({}, new Date(Date.UTC(2024, 1, 29))); h.render();
  h.picker().props.footer.props.onPress(); h.render();
  assert.equal(h.date, '2024-02-29');
  assert.equal(h.updates, 1);
  assert.equal(h.input.open, false);
});

test('웹에서 월을 바꾸고 확정하면 선택한 날짜를 해당 월의 마지막 날 이내로 저장한다', () => {
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

test('모바일은 날짜 선택기 하나를 열고 웹은 연·월·일 선택을 제공한다', () => {
  for (const os of ['ios', 'android', 'web']) {
    const h = harness(os);
    const nodes = elements(DateField({ ...h.input, label: h.date, labels: { ...labels, date: 'Date',
      year: 'Year', month: 'Month', day: 'Day', hint: '' } }));
    const native = os !== 'web';
    assert.equal(nodes.filter(node => node.type === 'NativePicker').length, native ? 1 : 0);
    assert.equal(nodes.filter(node => node.props.testID?.startsWith('date-part-')).length, native ? 0 : 3);
  }
});

test('모바일 날짜 선택은 오늘까지만 허용하며 미래 날짜를 확정해도 오늘을 넘지 않는다', t => {
  const now = new Date(2026, 10, 3, 12);
  t.mock.timers.enable({ apis: ['Date'], now: now.getTime() });
  for (const os of ['android', 'ios']) {
    const h = harness(os);
    const view = h.picker();
    const picker = os === 'android' ? view : view.props.children;
    assert.equal(picker.props.timeZoneName, 'UTC');
    assert.equal(picker.props.maximumDate.getTime(), Date.UTC(2026, 10, 3));
    h.input.onConfirm(new Date(2026, 11, 1)); h.render();
    assert.equal(h.date, '2026-11-03');
  }
});

test('새 날짜 입력은 오늘로 시작하고 기존 초안은 저장된 날짜로 연다', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 3, 12).getTime() });
  slots = []; cursor = 0;
  const input = useMealCheckinInputs({ draft: null, onUpdate() {} }).date;
  assert.deepEqual(input.parts, [2026, 11, 3]);
  assert.deepEqual(harness('web').input.parts, [2026, 10, 27]);
});

test('웹 날짜 선택지는 오늘 이후의 연·월·일을 제공하지 않는다', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 3, 12).getTime() });
  platform.OS = 'web';
  const fullLabels = { ...labels, date: 'Date', year: 'Year', month: 'Month', day: 'Day', hint: '' };
  for (const [part, last] of [[0, '2026'], [1, 'Nov'], [2, '03']]) {
    slots = []; cursor = 0;
    const nodes = elements(DateField({ label: '', labels: { ...fullLabels, locale: 'en-US' },
      parts: [2026, 11, 3], open: true, field: part,
      onToggle() {}, onFieldChange() {}, onNumberSelect() {}, onDateChange() {}, onConfirm() {} }));
    const options = nodes.find(node => node.props.testID === `date-options-${part}`);
    const text = elements(options).filter(node => node.type === 'Text').map(node => node.props.children);
    assert.equal(text.at(-1), last);
  }

});

test('모바일에서 과거 날짜를 선택해도 시차로 날짜가 달라지지 않는다', () => {
  for (const os of ['ios', 'android']) {
    const h = harness(os);
    const view = h.picker();
    const picker = os === 'android' ? view : view.props.children;
    assert.equal(picker.props.timeZoneName, 'UTC');
    assert.equal(picker.props.value.toISOString(), '2026-10-27T00:00:00.000Z');
    assert.equal(picker.props.minimumDate.toISOString(), '1900-01-01T00:00:00.000Z');
    picker.props.onValueChange({}, new Date(Date.UTC(1900, 2, 1)));
    h.render();
    if (os === 'ios') { h.picker().props.footer.props.onPress(); h.render(); }
    assert.equal(h.date, '1900-03-01');
  }
});
