// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 마이페이지 채식 제한 prop 이름 변경
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 날짜 상한·네이티브 메뉴 및 과거 연도의 월 이름 검증
// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 웹 편집 드롭다운 오버레이 위치·닫기·선택 검증

// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 날짜 테스트에서 공통 월·연도 선택 검증 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 네이티브 메뉴 Unit 테스트의 기기 대체·렌더 준비 공유
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
  if (name === 'react-native') return { Platform: platform, Modal: 'Modal', Dimensions: { get: () => ({ width: 393, height: 852 }) }, StyleSheet: { create: value => value },
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
const { NativeDropdown } = require('../../src/components/NativeDropdown.native.tsx');
const { DropdownChoice } = require('../../src/components/DropdownChoice.tsx');
const { DateField } = require('../../src/components/DateField.tsx');
const { ChildProfileView } = require('../../src/features/my-page/screens/ChildProfileView.tsx');
const { DifficultyEditor } = require('../../src/features/after-meal-review/components/DifficultyEditor.tsx');
const { abcCopyFor, copyFor, optionsFor } = require('../../src/util/strings.ts');
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


module.exports = { render, reset, choose, menus, elements, noop, NativeDropdown, DropdownChoice, DateField, ChildProfileView, DifficultyEditor, abcCopyFor, copyFor, optionsFor };
