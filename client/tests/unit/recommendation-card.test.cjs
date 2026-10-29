// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Verify flat card text, flip cancellation, and native swipe spring recovery
// Runs the real card and React hooks; native views and animation completion are controlled.

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');

const animations = [];
class Value {
  constructor(value) { this.value = value; }
  setValue(value) { this.value = value; }
  interpolate(config) { return { value: this, config }; }
}
function timing(value, config) {
  const animation = {
    value, config,
    start(callback) {
      if (value.__isNative && !config.useNativeDriver) {
        throw new Error('Cannot run a JS animation on a native animated value');
      }
      if (config.useNativeDriver) value.__isNative = true;
      this.callback = callback;
      animations.push(this);
    },
    complete(finished = true) {
      if (finished) value.setValue(config.toValue);
      this.callback?.({ finished });
    },
    stop() { this.stopped = true; this.complete(false); },
  };
  return animation;
}
for (const extension of ['.svg', '.png']) {
  require.extensions[extension] = (module, filename) => { module.exports = filename; };
}
mockModules(name => {
  if (name === 'react-native') return {
    Animated: { Value, timing, spring: timing, View: 'animated-view' },
    PanResponder: { create: handlers => ({ panHandlers: handlers }) },
    View: 'view', Text: 'text', Pressable: 'pressable', ScrollView: 'scroll-view',
    StyleSheet: { create: styles => styles },
  };
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name.startsWith('@expo/vector-icons/')) return () => null;
  if (name === 'expo-image') return { Image: () => null };
  return undefined;
});
const { RecommendationCard } = require('../../src/features/suggestions/components/RecommendationCard.tsx');
const defaults = {
  item: {
    id: '1', foodSnapshot: { name: 'Bread', ingredients: [] },
    whatToTry: 'Offer a small piece.', whyThisMayHelp: 'A familiar texture.',
    servingTip: 'Use a separate spot on the plate.',
  },
  language: 'en', index: 1, total: 1, disabled: false,
  onSave: () => {}, onDismiss: () => {},
};
const face = tree => tree.props.children[2];
const surface = tree => face(tree).props.children[0];
const content = tree => face(tree).props.children[1];
const body = tree => content(tree).props.children[1];
const flipButton = tree => content(tree).props.children[2];
const showingDetails = tree => body(tree).props.children.props.children[1].props.details;
const flatten = styles => Object.assign({}, ...[styles].flat(Infinity).filter(Boolean));
function assertTextOutside3D(tree, inside3D = false) {
  if (Array.isArray(tree)) {
    tree.forEach(child => assertTextOutside3D(child, inside3D));
    return;
  }
  if (!tree?.props) return;
  const transform = flatten(tree.props.style).transform ?? [];
  const transformed = inside3D || transform.some(part => 'perspective' in part || 'rotateY' in part);
  if (tree.type === 'text' || typeof tree.type === 'function') {
    assert.equal(transformed, false, 'Text and suggestion content must never inherit a 3D transform');
  }
  assertTextOutside3D(tree.props.children, transformed);
}
function contentOpacity(tree) {
  const { value, config } = content(tree).props.style.opacity;
  return config.outputRange[config.inputRange.indexOf(value.value)];
}
beforeEach(() => { animations.length = 0; });

test('both card sides keep text outside 3D transforms throughout repeated flips', async t => {
  const card = await renderHook(t, props => RecommendationCard(props), { props: defaults });
  const initialBody = body(card.current);
  assertTextOutside3D(card.current);
  assert.equal(contentOpacity(card.current), 1);
  assert.equal(showingDetails(card.current), false);
  for (const details of [true, false, true, false]) {
    await act(async () => flipButton(card.current).props.onPress());
    assertTextOutside3D(card.current);
    assert.equal(flatten(surface(card.current).props.style).transform[0].perspective, 1000);
    assert.equal(surface(card.current).props.children, undefined);
    const outgoing = animations.at(-1);
    await act(async () => outgoing.complete());
    assert.equal(showingDetails(card.current), details);
    assertTextOutside3D(card.current);
    assert.equal(contentOpacity(card.current), 0);
    await act(async () => animations.at(-1).complete());
    assertTextOutside3D(card.current);
    assert.equal(contentOpacity(card.current), 1);
    assert.deepEqual(flatten(surface(card.current).props.style).transform, []);
    assert.equal(body(card.current).type, initialBody.type);
    assert.equal(body(card.current).key, initialBody.key);
  }
});

test('rapid taps start one flip and disabled cards ignore taps', async t => {
  const card = await renderHook(t, props => RecommendationCard(props), { props: defaults });
  const tap = flipButton(card.current).props.onPress;
  await act(async () => { tap(); tap(); tap(); });
  assert.equal(animations.length, 1);
  await act(async () => animations[0].complete());
  await act(async () => flipButton(card.current).props.onPress());
  assert.equal(animations.length, 2);
  await act(async () => animations[1].complete());
  await card.rerender({ ...defaults, disabled: true });
  await act(async () => flipButton(card.current).props.onPress());
  assert.equal(animations.length, 2);
  assert.equal(showingDetails(card.current), true);
});

test('an interrupted flip clears the transform and allows another flip', async t => {
  const card = await renderHook(t, props => RecommendationCard(props), { props: defaults });
  for (const interruptIncoming of [false, true]) {
    await act(async () => flipButton(card.current).props.onPress());
    if (interruptIncoming) await act(async () => animations.at(-1).complete());
    await act(async () => animations.at(-1).complete(false));
    assertTextOutside3D(card.current);
    assert.equal(contentOpacity(card.current), 1);
    assert.equal(showingDetails(card.current), interruptIncoming);
    assert.equal(animations.at(-1).value.value, 0);
  }
});

test('unmount stops the flip and ignores its late completion', async t => {
  const { React } = require('../helpers/react-harness.cjs');
  let setVisible;
  function Wrapper({ children }) {
    const [visible, update] = React.useState(true);
    setVisible = update;
    return visible ? children : null;
  }
  const card = await renderHook(t, () => RecommendationCard(defaults), {
    wrapper: children => React.createElement(Wrapper, null, children),
  });
  await act(async () => flipButton(card.current).props.onPress());
  const outgoing = animations.at(-1);
  await act(async () => setVisible(false));
  assert.equal(outgoing.stopped, true);
  await act(async () => outgoing.complete());
  assert.equal(animations.length, 1);
});

test('swiping stays blocked during a flip and works again after completion', async t => {
  const actions = [];
  const card = await renderHook(t, props => RecommendationCard(props), {
    props: { ...defaults, onSave: () => actions.push('save'), onDismiss: () => actions.push('dismiss') },
  });
  const gesture = { dx: 120, dy: 0, vx: 0 };
  assert.equal(face(card.current).props.onMoveShouldSetPanResponder(null, gesture), true);
  await act(async () => flipButton(card.current).props.onPress());
  assert.equal(face(card.current).props.onMoveShouldSetPanResponder(null, gesture), false);
  await act(async () => animations.at(-1).complete());
  await act(async () => animations.at(-1).complete());
  assert.equal(face(card.current).props.onMoveShouldSetPanResponder(null, gesture), true);
  await act(async () => face(card.current).props.onPanResponderRelease(null, gesture));
  await act(async () => face(card.current).props.onPanResponderRelease(null, { ...gesture, dx: -120 }));
  assert.deepEqual(actions, ['save', 'dismiss']);
});

test('a cancelled swipe springs a native animated value back to center before and after flipping', async t => {
  const actions = [];
  const card = await renderHook(t, props => RecommendationCard(props), {
    props: { ...defaults, onSave: () => actions.push('save'), onDismiss: () => actions.push('dismiss') },
  });
  const x = face(card.current).props.style.transform[0].translateX;
  // Native Animated promotes every value connected to a native-driven view's style.
  x.__isNative = true;
  for (const dx of [65, -65]) {
    await act(async () => face(card.current).props.onPanResponderMove(null, { dx }));
    assert.equal(x.value, dx);
    await act(async () => face(card.current).props.onPanResponderTerminate());
    const spring = animations.at(-1);
    assert.equal(spring.value, x);
    await act(async () => spring.complete());
    assert.equal(x.value, 0);
    assert.deepEqual(actions, []);
    await act(async () => flipButton(card.current).props.onPress());
    await act(async () => animations.at(-1).complete());
    await act(async () => animations.at(-1).complete());
  }
});
