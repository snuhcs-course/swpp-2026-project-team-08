// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Regress sheet dismissal races across navigation, rapid taps, and reentry

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');

let focused = true;
const platform = { OS: 'ios' };
let removalGuard;
let disableCount = 0;
const disablePrevention = () => { disableCount += 1; };
mockModules(name => {
  if (name === 'react-native') return { Platform: platform };
  if (name === 'expo-router') return {
    useIsFocused: () => focused,
    useFocusEffect: callback => React.useEffect(() => {
      if (focused) return callback();
    }, [callback, focused]),
    usePreventRemove: (enabled, callback) => {
      removalGuard = { enabled, callback };
      return disablePrevention;
    },
  };
  return undefined;
});
const { useMealLogNavigation } = require('../../src/features/meal-log/hooks/useMealLogNavigation.ts');
const { useMealLogSheetDismissal } = require('../../src/features/meal-log/hooks/useMealLogSheetDismissal.ts');

beforeEach(() => { focused = true; disableCount = 0; platform.OS = 'ios'; });

function useNavigationAndSheet() {
  const navigation = useMealLogNavigation();
  const sheet = useMealLogSheetDismissal(navigation.active, navigation.sheetRef);
  return { ...navigation, sheet };
}

async function finishPresentation(hook) {
  await act(async () => {
    hook.current.sheet.onAppear();
    hook.current.sheet.onFinishTransitioning();
  });
}

test('a page push waits until native sheet dismissal completes', async t => {
  const hook = await renderHook(t, useNavigationAndSheet);
  const destinations = [];
  await finishPresentation(hook);
  await act(async () => hook.current.navigate(() => destinations.push('meal-details')));
  assert.equal(hook.current.sheet.visible, false);
  assert.deepEqual(destinations, []);
  assert.equal(removalGuard.enabled, true);
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.deepEqual(destinations, ['meal-details']);
  assert.equal(removalGuard.enabled, false);
  assert.equal(disableCount, 1);
});

test('leaving during sheet presentation waits for presentation and then dismissal', async t => {
  const hook = await renderHook(t, useNavigationAndSheet);
  let navigations = 0;
  await act(async () => hook.current.navigate(() => { navigations += 1; }));
  assert.equal(hook.current.sheet.visible, true);
  // The calendar stack can finish its own transition before the sheet appears.
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.equal(navigations, 0);
  assert.equal(hook.current.sheet.visible, true);
  await finishPresentation(hook);
  assert.equal(hook.current.sheet.visible, false);
  assert.equal(navigations, 0);
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.equal(navigations, 1);
});

test('tab replacements and back actions wait for the sheet before replaying', async t => {
  const hook = await renderHook(t, useNavigationAndSheet);
  await finishPresentation(hook);
  let repetitions = 0;
  await act(async () => removalGuard.callback({ repeat: () => { repetitions += 1; } }));
  assert.equal(hook.current.sheet.visible, false);
  assert.equal(repetitions, 0);
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.equal(repetitions, 1);
  assert.equal(removalGuard.enabled, false);
});

test('Android handles its transition-complete event arriving before the appear event', async t => {
  platform.OS = 'android';
  const hook = await renderHook(t, useNavigationAndSheet);
  let navigations = 0;
  await act(async () => hook.current.navigate(() => { navigations += 1; }));
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.equal(hook.current.sheet.visible, true);
  await act(async () => hook.current.sheet.onAppear());
  assert.equal(hook.current.sheet.visible, false);
  assert.equal(navigations, 0);
  await act(async () => assert.equal(hook.current.sheet.onNativeDismissed(), false));
  assert.equal(navigations, 0);
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.equal(navigations, 1);
});

test('rapid taps and late native dismissal events navigate only once', async t => {
  const hook = await renderHook(t, useNavigationAndSheet);
  await finishPresentation(hook);
  const destinations = [];
  await act(async () => {
    hook.current.navigate(() => destinations.push('first'));
    hook.current.navigate(() => destinations.push('second'));
  });
  await act(async () => {
    assert.equal(hook.current.sheet.onNativeDismissed(), false);
    hook.current.sheet.onFinishTransitioning();
  });
  assert.deepEqual(destinations, ['first']);
});

test('returning to Meal History presents a fresh sheet and can leave again', async t => {
  const hook = await renderHook(t, useNavigationAndSheet);
  let navigations = 0;
  await finishPresentation(hook);
  await act(async () => hook.current.navigate(() => { navigations += 1; }));
  await act(async () => hook.current.sheet.onFinishTransitioning());
  focused = false;
  await hook.rerender();
  assert.equal(hook.current.sheet.visible, false);
  focused = true;
  await hook.rerender();
  assert.equal(hook.current.sheet.visible, true);
  assert.equal(removalGuard.enabled, true);
  await finishPresentation(hook);
  await act(async () => hook.current.navigate(() => { navigations += 1; }));
  assert.equal(navigations, 1);
  await act(async () => hook.current.sheet.onFinishTransitioning());
  assert.equal(navigations, 2);
});

test('native user dismissal and navigation before sheet mounting do not wait indefinitely', async t => {
  const hook = await renderHook(t, useNavigationAndSheet);
  await finishPresentation(hook);
  await act(async () => assert.equal(hook.current.sheet.onNativeDismissed(), true));
  let navigations = 0;
  await act(async () => hook.current.navigate(() => { navigations += 1; }));
  assert.equal(navigations, 1);
  const withoutSheet = await renderHook(t, useMealLogNavigation);
  await act(async () => withoutSheet.current.navigate(() => { navigations += 1; }));
  assert.equal(navigations, 2);
});
