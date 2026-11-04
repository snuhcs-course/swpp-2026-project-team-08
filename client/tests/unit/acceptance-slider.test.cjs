// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Verify acceptance dragging, boundaries, optional clearing, and accessibility

// Runs the slider with real React state; only React Native primitives are mocked.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules(name => name === 'react-native' ? {
  View: 'view', Text: 'text', Pressable: 'pressable', StyleSheet: { create: s => s },
} : undefined);
const { AcceptanceSlider } = require('../../src/components/AcceptanceSlider.tsx');
const { abcCopyFor } = require('../../src/util/strings.ts');

const event = (locationX, pageX = locationX + 100) => ({ nativeEvent: { locationX, pageX } });
const rail = tree => tree.props.children[0];
const labels = tree => tree.props.children[1].props.children;
async function setup(t, initial = null, language = 'en') {
  const copy = abcCopyFor(language);
  const changes = [];
  const rendered = await renderHook(t, () => {
    const [value, setValue] = React.useState(initial);
    return AcceptanceSlider({ value, label: copy.acceptance, options: copy.acceptanceOptions,
      unsetLabel: copy.acceptanceUnset, onChange: next => { changes.push(next); setValue(next); } });
  });
  const control = () => rail(rendered.current).props;
  await act(async () => control().onLayout({ nativeEvent: { layout: { width: 320 } } }));
  return { rendered, control, changes };
}

test('dragging updates every acceptance level, clamps outside the track, and snaps on release', async t => {
  const h = await setup(t);
  assert.equal(h.control().accessibilityValue.text, 'Not entered');
  await act(async () => h.control().onResponderGrant(event(40)));
  assert.equal(h.control().accessibilityValue.now, 0);
  // locationX can change target during a gesture; pageX keeps movement stable.
  await act(async () => h.control().onResponderMove(event(0, 220)));
  assert.equal(h.control().accessibilityValue.now, 1);
  await act(async () => h.control().onResponderMove(event(0, 310)));
  assert.equal(h.control().accessibilityValue.now, 2);
  await act(async () => h.control().onResponderMove(event(0, 600)));
  assert.equal(h.control().accessibilityValue.now, 3);
  await act(async () => h.control().onResponderMove(event(0, 610)));
  assert.deepEqual(h.changes, [0, 1, 2, 3]);
  await act(async () => h.control().onResponderMove(event(0, 20)));
  assert.equal(h.control().accessibilityValue.now, 0);
  await act(async () => h.control().onResponderRelease(event(0, 230)));
  assert.equal(h.control().accessibilityValue.now, 1);
  const track = rail(h.rendered.current).props.children;
  const fill = track.props.children.props.children[0];
  assert.ok(Math.abs(parseFloat(fill.props.style[1].width) - 33.33333333333333) < 1e-10);
  assert.equal(h.control().onResponderTerminationRequest(), false);
});

test('tapping the rail selects without clearing; tapping the selected label clears the optional value', async t => {
  const h = await setup(t, 1);
  await act(async () => h.control().onResponderGrant(event(120)));
  await act(async () => h.control().onResponderRelease(event(120)));
  assert.equal(h.control().accessibilityValue.now, 1);
  await act(async () => labels(h.rendered.current)[3].props.onPress());
  assert.equal(h.control().accessibilityValue.now, 3);
  await act(async () => labels(h.rendered.current)[3].props.onPress());
  assert.equal(h.control().accessibilityValue.now, undefined);
  assert.equal(h.control().accessibilityValue.text, 'Not entered');
});

test('unmeasured and interrupted gestures remain usable', async t => {
  const h = await setup(t, 2);
  await act(async () => h.control().onLayout({ nativeEvent: { layout: { width: 0 } } }));
  await act(async () => h.control().onResponderGrant(event(50)));
  assert.deepEqual(h.changes, []);
  await act(async () => h.control().onResponderTerminate());
  assert.equal(h.control().accessibilityValue.now, 2);
  await act(async () => h.control().onLayout({ nativeEvent: { layout: { width: 320 } } }));
  await act(async () => h.control().onResponderGrant(event(280)));
  await act(async () => h.control().onResponderTerminate());
  assert.equal(h.control().accessibilityValue.now, 3);
  await act(async () => h.control().onResponderMove(event(0)));
  assert.equal(h.control().accessibilityValue.now, 3);
});

for (const language of ['en', 'ko']) {
  test(`${language}: accessible adjustments announce labels and stay within bounds`, async t => {
    const h = await setup(t, null, language);
    const adjust = name => act(async () => h.control().onAccessibilityAction({ nativeEvent: { actionName: name } }));
    await adjust('decrement');
    assert.equal(h.control().accessibilityValue.now, 0);
    await adjust('decrement');
    assert.equal(h.control().accessibilityValue.now, 0);
    for (let i = 0; i < 4; i++) await adjust('increment');
    assert.equal(h.control().accessibilityValue.now, 3);
    assert.equal(h.control().accessibilityValue.text, abcCopyFor(language).acceptanceOptions[3]);
    await adjust('decrement');
    assert.equal(h.control().accessibilityValue.text, abcCopyFor(language).acceptanceOptions[2].replace('\n', ' '));
  });
}
