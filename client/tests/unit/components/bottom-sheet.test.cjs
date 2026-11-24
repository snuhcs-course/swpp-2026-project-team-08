// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 저장 중 닫기 차단과 완료 후 바텀시트 닫기·드래그 복원 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: Unit 테스트를 담당 기능·공통 컴포넌트 폴더로 이동
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook } = require('../../helpers/react-harness.cjs');
const { mockModules } = require('../../helpers/mock-modules.cjs');

class Value {
  constructor(value) { this.value = value; }
  setValue(value) { this.value = value; }
  stopAnimation() {}
}
for (const extension of ['.svg', '.png']) {
  require.extensions[extension] = (module, filename) => { module.exports = filename; };
}
mockModules(name => {
  if (name === 'react-native') return {
    Animated: {
      Value,
      createAnimatedComponent: component => component,
      spring: (value, config) => ({ start: () => value.setValue(config.toValue) }),
    },
    PanResponder: { create: handlers => ({ panHandlers: handlers }) },
    Modal: 'modal', View: 'view', Text: 'text', Pressable: 'pressable',
    ScrollView: 'scroll-view', KeyboardAvoidingView: 'keyboard-avoiding-view',
    Platform: { OS: 'android' }, StyleSheet: { create: styles => styles },
  };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'safe-area' };
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name === 'expo-image') return { Image: () => null };
  return undefined;
});
const { BottomSheet } = require('../../../src/components/BottomSheet.tsx');
const defaults = { title: 'Saved suggestion', closeLabel: 'Close', children: 'Suggestion details' };

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node?.props) return [];
  return [node, ...elements(node.props.children)];
}
const closeButtons = tree => elements(tree).filter(node =>
  node.type === 'pressable' && node.props.accessibilityLabel === 'Close');
const dragHandle = tree => elements(tree).find(node => node.props.onPanResponderRelease)?.props;
const translation = tree => elements(tree).find(node => node.type === 'safe-area')
  .props.style.flat().find(style => style?.transform).transform[0].translateY;

for (const [variant, closeButtonCount] of [['sheet', 2], ['dialog', 1]]) {
  test(`${variant}: saving disables close controls and Android back until saving finishes`, async t => {
    const onClose = t.mock.fn();
    const props = { ...defaults, variant, onClose };
    const sheet = await renderHook(t, input => BottomSheet(input), { props });
    assert.equal(closeButtons(sheet.current).length, closeButtonCount);
    assert.ok(closeButtons(sheet.current).every(button => button.props.disabled === false));

    await sheet.rerender({ ...props, dismissDisabled: true });
    // Native Pressable owns disabled touch handling; assert its actual boundary props.
    assert.equal(closeButtons(sheet.current).length, closeButtonCount);
    for (const button of closeButtons(sheet.current)) assert.equal(button.props.disabled, true);
    await act(async () => sheet.current.props.onRequestClose());
    assert.equal(onClose.mock.callCount(), 0);

    await sheet.rerender({ ...props, dismissDisabled: false });
    for (const button of closeButtons(sheet.current)) {
      assert.equal(button.props.disabled, false);
      await act(async () => button.props.onPress());
    }
    await act(async () => sheet.current.props.onRequestClose());
    assert.equal(onClose.mock.callCount(), closeButtonCount + 1);
  });
}

test('saving blocks drag recognition and an ongoing drag release; dragging resumes afterward', async t => {
  const onClose = t.mock.fn();
  const props = { ...defaults, onClose };
  const sheet = await renderHook(t, input => BottomSheet(input), { props });
  const gesture = { dx: 0, dy: 90, vy: 0.2 };
  assert.equal(dragHandle(sheet.current).onStartShouldSetPanResponder(), true);
  assert.equal(dragHandle(sheet.current).onMoveShouldSetPanResponder(null, gesture), true);
  await act(async () => {
    dragHandle(sheet.current).onPanResponderGrant();
    dragHandle(sheet.current).onPanResponderMove(null, gesture);
  });
  assert.equal(translation(sheet.current).value, 90);

  await sheet.rerender({ ...props, dismissDisabled: true });
  assert.equal(dragHandle(sheet.current).onStartShouldSetPanResponder(), false);
  assert.equal(dragHandle(sheet.current).onMoveShouldSetPanResponder(null, gesture), false);
  await act(async () => dragHandle(sheet.current).onPanResponderRelease(null, gesture));
  assert.equal(onClose.mock.callCount(), 0);
  assert.equal(translation(sheet.current).value, 0);

  await sheet.rerender({ ...props, dismissDisabled: false });
  assert.equal(dragHandle(sheet.current).onStartShouldSetPanResponder(), true);
  assert.equal(dragHandle(sheet.current).onMoveShouldSetPanResponder(null, gesture), true);
  await act(async () => {
    dragHandle(sheet.current).onPanResponderGrant();
    dragHandle(sheet.current).onPanResponderMove(null, gesture);
    dragHandle(sheet.current).onPanResponderRelease(null, gesture);
  });
  assert.equal(onClose.mock.callCount(), 1);
});
