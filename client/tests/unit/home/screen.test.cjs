// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 추천 카드 표시·콜백과 화면 이동·중복 이동 방지 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { React, act, renderHook } = require('../../helpers/react-harness.cjs');
const { mockModules } = require('../../helpers/mock-modules.cjs');
const { renderToStaticMarkup } = require('react-dom/server');

for (const ext of ['.svg', '.png'])
  require.extensions[ext] = (module, file) => { module.exports = file; };

const primitive = tag => ({ children }) => React.createElement(tag, null, children);
let viewProps;
let onFocus;
const destinations = [];
let refreshCount = 0;
const refresh = async () => { refreshCount++; };
const home = {
  refresh, data: { suggestions: [] }, suggestionMeals: [{ id: '10' }],
  suggestionMealsLoading: false, suggestionMealsError: false,
};
mockModules(name => {
  if (name === 'react-native') return {
    View: primitive('div'), Text: primitive('span'), Pressable: primitive('button'),
    ScrollView: primitive('section'), TextInput: primitive('input'),
    ActivityIndicator: primitive('progress'), RefreshControl: () => null,
    Modal: ({ visible = true, children }) => visible ? children : null,
    Platform: { OS: 'web' }, StyleSheet: { create: value => value },
  };
  if (name === 'expo-image') return { Image: primitive('img') };
  if (name === '@expo/vector-icons') return { Feather: primitive('i') };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: ({ children }) => children };
  if (name === 'expo-router') return {
    router: { push: destination => destinations.push(destination) },
    useFocusEffect: callback => { onFocus = callback; React.useEffect(callback, [callback]); },
  };
  if (name.endsWith('/providers/AuthProvider')) return { useAuth: () => ({ status: 'ready', session: {} }) };
  if (name.endsWith('/providers/ProfileProvider')) return {
    useProfile: () => ({ status: 'ready', profile: { id: '1' }, language: 'en' }),
  };
  if (name.endsWith('/hooks/useHome')) return { useHome: () => home };
  if (name === './HomeView') return { HomeView: props => { viewProps = props; return null; } };
  return undefined;
});
const { HomeScreen } = require('../../../src/features/home/screens/HomeScreen.tsx');

test('추천 카드는 같은 식사의 추천 화면을 한 번 열고 복귀 후 다시 열 수 있다', async t => {
  await renderHook(t, () => null, { wrapper: () => React.createElement(HomeScreen) });
  assert.equal(viewProps.suggestionMeals, home.suggestionMeals);
  assert.equal(refreshCount, 1);
  await act(async () => {
    viewProps.onViewSuggestions('10');
    viewProps.onViewSuggestions('10');
  });
  assert.deepEqual(destinations, [{ pathname: '/recommendation/[mealId]', params: { mealId: '10' } }]);
  await act(async () => onFocus());
  assert.equal(refreshCount, 2);
  await act(async () => viewProps.onViewSuggestions('20'));
  assert.deepEqual(destinations[1], { pathname: '/recommendation/[mealId]', params: { mealId: '20' } });
});

const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const noop = () => {};

function reviewedMeal(id, foods) {
  const response = mealResponse();
  const meal = toMealDetail({ ...response,
    foods: response.foods.map(food => ({ ...food, outcome: 'TASTED' })) });
  return { ...meal, id, mealDate: '2026-10-08',
    foods: foods ?? meal.foods };
}

function homeProps() {
  return {
    profile: { id: "home-child", childName: "Luna", caregiverName: "Alex" },
    language: "en",
    now: new Date(2026, 9, 8, 9),
    draft: null,
    draftLoading: false,
    draftError: false,
    pendingMeals: [],
    suggestionMeals: [],
    suggestionMealsLoading: false,
    suggestionMealsError: false,
    onViewSuggestions: noop,
    meals: [],
    data: { loggedDates: new Set(), suggestions: [] },
    loading: false,
    error: false,
    refreshing: false,
    onRefresh: noop,
    onLogMeal: noop,
    onReviewDraft: noop,
    onReviewMeal: noop,
    onSavedSuggestions: noop,
    onMealHistory: noop,
    onTrySuggestion: noop,
    suggestionText: {},
  };
}

function findElement(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}

test('홈 추천 카드는 실제 정보를 표시하고 식사 ID를 전달한다', () => {
  const { HomeView } = require('../../../src/features/home/screens/HomeView.tsx');
  const meal = reviewedMeal('reviewed-meal');
  let opened;
  const props = { ...homeProps(), language: 'en', meals: [meal], suggestionMeals: [meal],
    onViewSuggestions: id => { opened = id; } };
  const html = renderToStaticMarkup(React.createElement(HomeView, props));
  assert.ok(html.includes('View Suggestion'));
  assert.ok(html.includes('Luna'));
  assert.doesNotMatch(html, /Meal Log Calendar/);
  const card = findElement(HomeView(props), node => node.props?.actionLabel === 'View Suggestion');
  assert.ok(card);
  card.props.onPress();
  assert.equal(opened, 'reviewed-meal');
});

test('추천 대상과 진행 중인 조회가 없으면 홈 추천 영역을 숨긴다', () => {
  const { HomeView } = require('../../../src/features/home/screens/HomeView.tsx');
  const html = renderToStaticMarkup(React.createElement(HomeView, homeProps()));
  assert.doesNotMatch(html, /View Suggestion/);
});
