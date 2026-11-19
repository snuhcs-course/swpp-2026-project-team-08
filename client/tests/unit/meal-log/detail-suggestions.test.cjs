// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 상세 추천 버튼 위치·상태·클릭 및 이동 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { React, act, renderHook } = require('../../helpers/react-harness.cjs');
const { renderToStaticMarkup } = require('react-dom/server');
const { mockModules } = require('../../helpers/mock-modules.cjs');
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { copyFor } = require('../../../src/util/strings.ts');
require.extensions['.svg'] = (module, file) => { module.exports = file; };
const noop = () => {};
const primitive = tag => ({ children, onPress, accessibilityLabel, disabled }) =>
  React.createElement(tag, { onClick: onPress, 'aria-label': accessibilityLabel, disabled }, children);
let viewProps;
let onFocus;
const destinations = [];
const response = mealResponse();
response.foods[0].outcome = 'EATEN';
const detail = {
  meal: toMealDetail(response), cards: [], loading: false, error: false,
  deleting: false, deleteError: false, canViewSuggestions: true,
  suggestionsLoading: false, suggestionsError: false,
  retry: async () => {}, deleteMeal: async () => {},
};
mockModules(name => {
  if (name === 'react-native') return {
    View: primitive('div'), Text: primitive('span'), Pressable: primitive('button'),
    ScrollView: primitive('section'), ActivityIndicator: primitive('progress'),
    Modal: ({ visible, children }) => visible ? children : null,
    StyleSheet: { create: value => value }, Platform: { OS: 'web' },
  };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: primitive('main') };
  if (name === 'expo-image') return { Image: primitive('img') };
  if (name === '@expo/vector-icons') return { Feather: primitive('i') };
  if (name.startsWith('@expo/vector-icons/')) return primitive('i');
  if (name === 'expo-router') return {
    router: { replace: destination => destinations.push(destination), back: noop },
    useFocusEffect: callback => { onFocus = callback; React.useEffect(callback, [callback]); },
  };
  if (name.endsWith('/providers/ProfileProvider')) return {
    useProfile: () => ({ status: 'ready', profile: { id: '1' }, language: 'en' }),
  };
  if (name.endsWith('/hooks/useMealDetails')) return { useMealDetails: () => detail };
  if (name === './MealDetailsView') return { MealDetailsView: props => { viewProps = props; return null; } };
});
const { MealDetailsView } = require('../../../src/features/meal-log/screens/MealDetailsView.tsx');
const { MealDetailsScreen } = require('../../../src/features/meal-log/screens/MealDetailsScreen.tsx');
const labels = copyFor('en');
function props(overrides = {}) {
  return {
    language: 'en', heading: 'Nov 19 · Lunch', deleteLine: 'Nov 19 · Lunch',
    beforeUri: null, afterUri: null, awaitingReview: false, cards: [],
    loading: false, error: false, deleting: false, deleteError: false,
    canViewSuggestions: true, suggestionsLoading: false, suggestionsError: false,
    onBack: noop, onContinueReview: noop, onRetry: noop, onDelete: noop,
    onViewSuggestions: noop, ...overrides,
  };
}

for (const { title, input, button, error, loading } of [
  { title: '조회 완료: 사진과 음식 결과 사이에 추천 버튼 표시', input: {}, button: true },
  { title: '대상 없음 또는 처리 완료: 추천 버튼 숨김', input: { canViewSuggestions: false }, button: false },
  { title: '최초 조회 중: 버튼 대신 준비 상태 표시',
    input: { canViewSuggestions: false, suggestionsLoading: true }, button: false, loading: true },
  { title: '최초 조회 실패: 상세를 유지하며 오류 표시',
    input: { canViewSuggestions: false, suggestionsError: true }, button: false, error: true },
  { title: '재조회 실패: 기존 추천 버튼과 오류 함께 표시',
    input: { suggestionsError: true }, button: true, error: true },
]) {
  test(title, () => {
    const html = renderToStaticMarkup(React.createElement(MealDetailsView, props(input)));
    assert.equal(html.includes('View Suggestion'), button);
    assert.equal(html.includes(labels.home.suggestionsLoadFailed), !!error);
    assert.equal(html.includes('<progress'), !!loading);
    assert.ok(html.includes(labels.mealLog.beforeImage));
    assert.ok(html.includes(labels.mealLog.foodsAndResponses));
    if (button) {
      assert.ok(html.indexOf(labels.mealLog.afterImage) < html.indexOf('View Suggestion'));
      assert.ok(html.indexOf('View Suggestion') < html.indexOf(labels.mealLog.foodsAndResponses));
    }
    if (error) assert.ok(!html.includes('Retry'));
  });
}

test('추천 버튼은 화면 이동 콜백을 실행한다', async t => {
  let opened = 0;
  await renderHook(t, () => null, { wrapper: () => React.createElement(MealDetailsView, props({
    onViewSuggestions: () => opened++,
  })) });
  await act(async () => document.querySelector('[aria-label="View Suggestion"]').click());
  assert.equal(opened, 1);
});

test('같은 식사의 추천 화면으로 한 번 이동하고 복귀 후 다시 이동한다', async t => {
  destinations.length = 0;
  await renderHook(t, () => null, { wrapper: () => React.createElement(MealDetailsScreen, { mealId: '10' }) });
  assert.equal(viewProps.canViewSuggestions, true);
  await act(async () => { viewProps.onViewSuggestions(); viewProps.onViewSuggestions(); });
  assert.deepEqual(destinations, [{ pathname: '/recommendation/[mealId]', params: { mealId: '10' } }]);
  await act(async () => onFocus());
  await act(async () => viewProps.onViewSuggestions());
  assert.equal(destinations.length, 2);
});

test('삭제 중에는 추천 화면을 열지 않는다', async t => {
  detail.deleting = true;
  t.after(() => { detail.deleting = false; });
  destinations.length = 0;
  await renderHook(t, () => null, { wrapper: () => React.createElement(MealDetailsScreen, { mealId: '10' }) });
  await act(async () => viewProps.onViewSuggestions());
  assert.equal(destinations.length, 0);
});
