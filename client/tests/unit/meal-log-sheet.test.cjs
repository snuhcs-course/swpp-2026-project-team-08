// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Verify three sheet heights, collapsed filters, navigation, and meal actions

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
    TextInput: primitive('input'),
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
    FullWindowOverlay: primitive('aside'),
  };
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name.startsWith('@expo/vector-icons/')) return () => null;
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
  minimum: false, onFiltersLayout: noop,
  search: '', fromLabel: 'From all meal records', unreviewedOnly: false,
  onSearch: noop, onSubmitSearch: noop, onToggleUnreviewed: noop,
  loading: false, error: false,
  onRefresh: noop, onOpenMeal: noop, onGoCheckin: noop,
};

function sheetScreen(tree) {
  return tree.props.children.props.children[1];
}

test('native sheet waits for layout, leaves controls interactive, and closes on blur', async t => {
  const calendar = React.createElement('div', null, 'Calendar');
  const props = { children: calendar, sheet: 'Meals', controlsHeight: 480, filtersHeight: 72, onMinimumChange: noop, active: true, onBack: noop };
  const hook = await renderHook(t, input => MealLogSheetLayout(input), { props });
  assert.equal(sheetScreen(hook.current), false);
  await act(async () => hook.current.props.onLayout({ nativeEvent: { layout: { height: 740 } } }));
  const screen = sheetScreen(hook.current);
  assert.equal(screen.props.stackPresentation, 'formSheet');
  assert.equal(screen.props.sheetLargestUndimmedDetentIndex, 'last');
  assert.equal(screen.props.sheetGrabberVisible, true);
  assert.equal(screen.props.sheetAllowedDetents.length, 3);
  assert.equal(screen.props.sheetAllowedDetents[0], (28 + 72 + 12 + 60) / 800);
  assert.equal(screen.props.sheetInitialDetentIndex, 0);
  assert.equal(screen.props.sheetAllowedDetents[2], 0.9);
  assert.equal(screen.props.sheetAllowedDetents[1], 270 / 800);
  assert.equal(hook.current.props.children.props.children[0].props.children, calendar);
  await hook.rerender({ ...props, active: false });
  assert.equal(sheetScreen(hook.current), false);
  await hook.rerender(props);
  assert.equal(sheetScreen(hook.current).props.children, 'Meals');
});

test('Android uses its stack height and long calendars retain a usable compact sheet', async t => {
  platform.OS = 'android';
  t.after(() => { platform.OS = 'ios'; });
  const props = { children: 'Calendar', sheet: 'Meals', controlsHeight: 900, filtersHeight: 72, onMinimumChange: noop, active: true, onBack: noop };
  const hook = await renderHook(t, input => MealLogSheetLayout(input), { props });
  await act(async () => hook.current.props.onLayout({ nativeEvent: { layout: { height: 700 } } }));
  assert.equal(sheetScreen(hook.current).props.sheetAllowedDetents[0], (28 + 72 + 12) / 700);
  assert.equal(sheetScreen(hook.current).props.sheetAllowedDetents[1], 270 / 700);
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

test('populated sheet preserves review badges and navigation without gesture refresh', async t => {
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
  list.props.children[1][0].props.onPress();
  assert.deepEqual(opened, ['1']);
  assert.equal(list.props.refreshControl, undefined);
  const html = renderToStaticMarkup(list);
  assert.ok(html.includes(s.mealLog.awaitingReview));
  assert.ok(html.includes(s.mealLog.reviewed));
});


test('search and date/review filters stay at the top of the meal sheet and retain their actions', async t => {
  const actions = [];
  const hook = await renderHook(t, () => MealLogList({
    ...defaults, search: 'Carrot', fromLabel: 'Oct 27', unreviewedOnly: true,
    onSearch: value => actions.push(value),
    onSubmitSearch: () => actions.push('submit'),
    onToggleUnreviewed: () => actions.push('toggle'),
  }));
  const list = hook.current;
  assert.deepEqual(list.props.stickyHeaderIndices, [0]);
  const header = list.props.children[0];
  const [search, filters] = header.props.children[0].props.children;
  const [input, searchButton] = search.props.children;
  assert.equal(input.props.value, 'Carrot');
  assert.equal(filters.props.children[0].props.children, 'Oct 27');
  const checkbox = filters.props.children[1];
  assert.deepEqual(checkbox.props.accessibilityState, { checked: true });
  input.props.onChangeText('Rice');
  input.props.onSubmitEditing();
  searchButton.props.onPress();
  checkbox.props.onPress();
  assert.deepEqual(actions, ['Rice', 'submit', 'submit', 'toggle']);
  await act(async () => input.props.onFocus());
  assert.equal(hook.current.props.children[0].props.children[0].props.children[0].props.children[0].props.value, 'Carrot');
});


test('minimum height shows just the filter rows until the sheet expands', async t => {
  const records = [{ id: '1', title: 'Dinner', foods: 'Carrot', photoUri: null, awaiting: true }];
  const hook = await renderHook(t, input => MealLogList(input), {
    props: { ...defaults, records, minimum: true, query: 'Carrot' },
  });
  assert.equal(hook.current.props.scrollEnabled, false);
  const minimum = renderToStaticMarkup(hook.current);
  assert.ok(minimum.includes('From all meal records'));
  assert.ok(!minimum.includes('Dinner'));
  await hook.rerender({ ...defaults, records, minimum: false });
  assert.equal(hook.current.props.scrollEnabled, true);
  assert.ok(renderToStaticMarkup(hook.current).includes('Dinner'));
});

test('detent changes switch minimum mode and measured filters resize the minimum height', async t => {
  const changes = [];
  const props = { children: 'Calendar', sheet: 'Meals', controlsHeight: 480, filtersHeight: 72,
    active: true, onBack: noop, onMinimumChange: minimum => changes.push(minimum) };
  const hook = await renderHook(t, input => MealLogSheetLayout(input), { props });
  await act(async () => hook.current.props.onLayout({ nativeEvent: { layout: { height: 740 } } }));
  const screen = sheetScreen(hook.current);
  screen.props.onSheetDetentChanged({ nativeEvent: { index: 1, isStable: true } });
  screen.props.onSheetDetentChanged({ nativeEvent: { index: 2, isStable: true } });
  screen.props.onSheetDetentChanged({ nativeEvent: { index: 0, isStable: true } });
  assert.deepEqual(changes, [false, false, true]);
  const previousMinimum = screen.props.sheetAllowedDetents[0];
  await hook.rerender({ ...props, filtersHeight: 100 });
  assert.ok(sheetScreen(hook.current).props.sheetAllowedDetents[0] > previousMinimum);
});

test('iOS navigation stays above the native sheet without hiding accessible content', async t => {
  const { BottomNavigationOverlay } = require('../../src/components/BottomNavigationOverlay.native.tsx');
  const navigation = React.createElement('nav', null, 'Navigation');
  const hook = await renderHook(t, input => BottomNavigationOverlay(input), {
    props: { overSheet: true, children: navigation },
  });
  const [spacer, overlay] = hook.current.props.children;
  assert.equal(spacer.props.style.height, 94);
  assert.equal(overlay.props.unstable_accessibilityContainerViewIsModal, false);
  assert.equal(overlay.props.children.props.children, navigation);
  await hook.rerender({ overSheet: false, children: navigation });
  assert.equal(hook.current.props.children, navigation);
});
