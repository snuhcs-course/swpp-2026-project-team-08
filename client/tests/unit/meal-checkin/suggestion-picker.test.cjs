// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 추천 목록의 단일 선택·재선택 유지·연결 버튼과 원본 식사 표시 검증
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { React } = require('../../helpers/react-harness.cjs');
const { mockModules } = require('../../helpers/mock-modules.cjs');
const shadowRoot = Object.getOwnPropertyDescriptor(globalThis, 'ShadowRoot');
Reflect.defineProperty(globalThis, 'ShadowRoot', { configurable: true, value: window.ShadowRoot });
after(() => {
  if (shadowRoot) Reflect.defineProperty(globalThis, 'ShadowRoot', shadowRoot);
  else delete globalThis.ShadowRoot;
});
const native = require('react-native-web');
mockModules(name => {
  if (name === 'react-native') return native;
  if (name === '@expo/vector-icons/Feather') return () => null;
});
const { renderToStaticMarkup } = require('react-dom/server');
const { MealSavedSuggestionPicker } = require('../../../src/features/meal-checkin/components/MealSavedSuggestionPicker.tsx');
const { AppButton } = require('../../../src/components/AppButton.tsx');
const { options } = require('../../fixtures/meal-suggestion-linking.cjs');

function elements(node, match) {
  if (!node || typeof node !== 'object') return [];
  return [ ...(match(node) ? [node] : []),
    ...React.Children.toArray(node.props?.children).flatMap(child => elements(child, match)) ];
}
function picker() {
  let selectedId = '';
  function tree() {
    return MealSavedSuggestionPicker({ language: 'en', suggestions: options, selectedId,
      onSelect: id => { selectedId = id; }, onLink() {}, onClose() {} });
  }
  return {
    tree,
    radios: () => elements(tree(), node => node.props.accessibilityRole === 'radio'),
    linkButton: () => elements(tree().props.footer, node => node.type === AppButton && !node.props.secondary)[0],
  };
}

test('추천을 고르기 전에는 연결 버튼이 비활성화되고, 추천을 바꾸면 새 추천 하나만 선택된다', () => {
  const h = picker();
  assert.equal(h.linkButton().props.disabled, true);
  assert.deepEqual(h.radios().map(node => node.props.accessibilityState.checked), [false, false]);
  h.radios()[0].props.onPress();
  assert.equal(h.linkButton().props.disabled, false);
  assert.deepEqual(h.radios().map(node => node.props.accessibilityState.checked), [true, false]);
  h.radios()[1].props.onPress();
  assert.deepEqual(h.radios().map(node => node.props.accessibilityState.checked), [false, true]);
  assert.equal(h.linkButton().props.disabled, false);
});

test('이미 선택한 추천을 다시 눌러도 선택이 해제되지 않고 연결 버튼이 활성화된 상태를 유지한다', () => {
  const h = picker();
  h.radios()[0].props.onPress();
  assert.deepEqual(h.radios().map(node => node.props.accessibilityState.checked), [true, false]);
  h.radios()[0].props.onPress();
  assert.deepEqual(h.radios().map(node => node.props.accessibilityState.checked), [true, false]);
  assert.equal(h.linkButton().props.disabled, false);
});

test('추천 목록에 음식 이름·추천 내용·원본 식사의 날짜와 유형이 표시된다', () => {
  const h = picker();
  assert.equal(h.tree().props.title, 'Saved suggestions');
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, h.tree().props.children));
  for (const text of ['2 saved suggestions', 'Choose the suggestion you tried.',
    'Potato mash', 'Offer a small spoonful.', 'Oct 11, 2026', 'Lunch',
    'Soft carrot', 'Try a soft strip.', 'Oct 12, 2026', 'Dinner']) assert.ok(html.includes(text), text);
});
