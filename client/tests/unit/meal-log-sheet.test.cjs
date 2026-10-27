// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Verify native history sheet lifecycle and meal list states and actions

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook } = require('../helpers/react-harness.cjs');
const { renderToStaticMarkup } = require('react-dom/server');
const { mockModules } = require('../helpers/mock-modules.cjs');

for (const extension of ['.svg', '.png']) {
  require.extensions[extension] = (module, filename) => { module.exports = filename; };
}

const platform = { OS: 'ios' };
function primitive(tag) {
  return ({ children, onPress, testID }) => React.createElement(tag, {
    onClick: onPress, 'data-testid': testID,
  }, children);
}
mockModules(name => {
  if (name === 'react-native') return {
    Platform: platform,
    View: primitive('div'), Text: primitive('span'), Pressable: primitive('button'),
    ScrollView: primitive('section'), ActivityIndicator: primitive('progress'),
    RefreshControl: () => null,
    StyleSheet: { create: styles => styles },
    useWindowDimensions: () => ({ height: 844, width: 390 }),
  };
  if (name === 'react-native-safe-area-context') return {
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  };
  if (name === 'react-native-screens') return {
    ScreenStack: primitive('main'), ScreenStackItem: primitive('article'),
  };
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name === 'expo-image') return { Image: () => null };
  return undefined;
});
const { MealLogSheetLayout } = require('../../src/features/meal-log/components/MealLogSheetLayout.native.tsx');
const { MealLogList } = require('../../src/features/meal-log/components/MealLogList.tsx');
const { copyFor } = require('../../src/util/strings.ts');
const noop = () => {};
const s = copyFor('en');
const defaults = {
  language: 'en', records: [], query: '', hasMeals: false,
  loading: false, error: false, refreshing: false,
  onRefresh: noop, onOpenMeal: noop, onGoCheckin: noop,
};

function sheetScreen(tree) {
  return tree.props.children.props.children[1];
}

test('native sheet waits for layout, leaves controls interactive, and closes on blur', async t => {
  const calendar = React.createElement('div', null, 'Calendar');
  const props = { children: calendar, sheet: 'Meals', controlsHeight: 480, active: true, onBack: noop };
  const hook = await renderHook(t, input => MealLogSheetLayout(input), { props });
  assert.equal(sheetScreen(hook.current), false);
  await act(async () => hook.current.props.onLayout({ nativeEvent: { layout: { height: 740 } } }));
  const screen = sheetScreen(hook.current);
  assert.equal(screen.props.stackPresentation, 'formSheet');
  assert.equal(screen.props.sheetLargestUndimmedDetentIndex, 'last');
  assert.equal(screen.props.sheetGrabberVisible, true);
  assert.equal(screen.props.sheetAllowedDetents[1], 0.9);
  assert.equal(screen.props.sheetAllowedDetents[0], (800 - 56 - 480 - 16) / 800);
  assert.equal(hook.current.props.children.props.children[0].props.children, calendar);
  await hook.rerender({ ...props, active: false });
  assert.equal(sheetScreen(hook.current), false);
  await hook.rerender(props);
  assert.equal(sheetScreen(hook.current).props.children, 'Meals');
});

test('Android uses its stack height and long calendars retain a usable compact sheet', async t => {
  platform.OS = 'android';
  t.after(() => { platform.OS = 'ios'; });
  const props = { children: 'Calendar', sheet: 'Meals', controlsHeight: 900, active: true, onBack: noop };
  const hook = await renderHook(t, input => MealLogSheetLayout(input), { props });
  await act(async () => hook.current.props.onLayout({ nativeEvent: { layout: { height: 700 } } }));
  assert.equal(sheetScreen(hook.current).props.sheetAllowedDetents[0], 200 / 700);
});

test('loading and errors take precedence over an empty sheet', () => {
  const loading = renderToStaticMarkup(React.createElement(MealLogList, { ...defaults, loading: true }));
  assert.match(loading, /<progress/);
  assert.ok(!loading.includes(s.mealLog.emptyTitle));
  const error = renderToStaticMarkup(React.createElement(MealLogList, { ...defaults, error: true }));
  assert.ok(error.includes(s.mealLog.loadFailed));
  assert.ok(error.includes(s.common.retry));
  assert.ok(!error.includes(s.mealLog.emptyTitle));
});

test('empty history offers check-in and an unmatched search displays its query', () => {
  const empty = renderToStaticMarkup(React.createElement(MealLogList, defaults));
  assert.ok(empty.includes(s.mealLog.emptyTitle));
  assert.ok(empty.includes(s.mealLog.goToCheckin));
  const search = renderToStaticMarkup(React.createElement(MealLogList, {
    ...defaults, query: 'Carrot', hasMeals: true,
  }));
  assert.ok(search.includes(s.mealLog.noMatchingTitle));
  assert.ok(search.includes('Carrot'));
  assert.ok(!search.includes(s.mealLog.goToCheckin));
});

test('populated sheet preserves review badges, meal navigation, and refresh', async t => {
  const opened = [];
  const records = [
    { id: '1', title: 'Dinner', foods: 'Carrot', photoUri: null, awaiting: true },
    { id: '2', title: 'Lunch', foods: 'Rice', photoUri: null, awaiting: false },
  ];
  const hook = await renderHook(t, () => MealLogList({
    ...defaults, records, hasMeals: true, onOpenMeal: id => opened.push(id),
  }));
  const list = hook.current;
  assert.equal(list.props.nestedScrollEnabled, true);
  list.props.children[0].props.onPress();
  assert.deepEqual(opened, ['1']);
  assert.equal(list.props.refreshControl.props.onRefresh, defaults.onRefresh);
  const html = renderToStaticMarkup(list);
  assert.ok(html.includes(s.mealLog.awaitingReview));
  assert.ok(html.includes(s.mealLog.reviewed));
});
