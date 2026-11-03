// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: Android 목록 선택·취소·긴 목록 초기 위치 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
require('./helpers/register.cjs');
require('react/jsx-runtime');
let state = [], cursor = 0;
const load = Module._load;
Module._load = function(name, ...args) {
  if (name === 'react') return { useState(initial) {
    const i = cursor++;
    if (!(i in state)) state[i] = initial;
    return [state[i], value => { state[i] = value; }];
  } };
  if (name === 'react-native') return {
    FlatList: 'FlatList', Modal: 'Modal', Pressable: 'Pressable', Text: 'Text', View: 'View',
    StyleSheet: { create: x => x, absoluteFill: {} },
  };
  return load.call(this, name, ...args);
};
const { NativeDropdown } = require('../src/components/NativeDropdown.android.tsx');
Module._load = load;
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props.children)];
}
function render(props) { cursor = 0; return nodes(NativeDropdown(props)); }
const options = Array.from({ length: 301 }, (_, i) => ({ id: String(1900 + i), label: String(1900 + i) }));

test('Android opens a separate scrollable list at the selected year and commits stable IDs', () => {
  state = [];
  const changes = [];
  const props = { options, value: '2026', label: 'Year', children: null, onChange: id => changes.push(id) };
  let tree = render(props);
  assert.equal(tree.some(x => x.type === 'Modal'), false);
  tree.find(x => x.type === 'Pressable').props.onPress();
  tree = render(props);
  const list = tree.find(x => x.type === 'FlatList');
  assert.equal(list.props.data.length, 301);
  assert.equal(list.props.initialScrollIndex, 126);
  assert.equal(list.props.getItemLayout(null, 300).offset, 14400);
  assert.equal(list.props.keyExtractor(options[300]), '2200');
  const row = list.props.renderItem({ item: options[0] });
  row.props.onPress();
  assert.deepEqual(changes, ['1900']);
  assert.equal(render(props).some(x => x.type === 'Modal'), false);
});

test('system back and outside tap dismiss without changing a value', () => {
  for (const outside of [false, true]) {
    state = [];
    const props = { options, value: '2026', label: 'Year', onChange: assert.fail };
    render(props).find(x => x.type === 'Pressable').props.onPress();
    const tree = render(props);
    if (outside) tree.find(x => x.type === 'Pressable' && x.props.accessible === false).props.onPress();
    else tree.find(x => x.type === 'Modal').props.onRequestClose();
    assert.equal(render(props).some(x => x.type === 'Modal'), false);
  }
});

test('disabled and empty dropdowns cannot present a selection list', () => {
  for (const overrides of [{ disabled: true }, { options: [] }]) {
    state = [];
    const props = { options, value: '', label: 'Year', onChange: assert.fail, ...overrides };
    const tree = render(props);
    assert.equal(tree.find(x => x.type === 'Pressable').props.disabled, true);
    assert.equal(tree.some(x => x.type === 'Modal'), false);
  }
});
