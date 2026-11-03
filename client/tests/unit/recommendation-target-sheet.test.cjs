// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Existing recommendation targets remain editable through the target sheet

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
let model;
const ChangeFoodsSheet = () => null;
mockModules(name => {
  if (name === 'react-native') return { View: 'view', Text: 'text', Pressable: 'pressable', ScrollView: 'scroll',
    BackHandler: { addEventListener: () => ({ remove() {} }) }, StyleSheet: { create: value => value } };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'safe-area' };
  if (name === 'expo-router') return { Redirect: () => null, router: { replace() {} } };
  if (name.endsWith('/ProfileProvider')) return { useProfile: () => ({ language: 'en', status: 'ready', profile: { id: '1' } }) };
  if (name.endsWith('/AuthProvider')) return { useAuth: () => ({ status: 'ready', session: { user: { id: '1' } } }) };
  if (name.endsWith('/useRecommendationFlow')) return { useRecommendationFlow: () => model };
  if (name.endsWith('/ChangeFoodsSheet')) return { ChangeFoodsSheet };
  if (name.endsWith('/AppHeader')) return { AppHeader: () => null, topBarStyles: { content: {} } };
  for (const component of [ 'AppButton', 'UiAssetIcon', 'RecommendationCard', 'RecommendationStateCard']) {
    if (name.endsWith('/' + component)) return { [component]: () => null };
  }
  return undefined;
});
const { RecommendationScreen } = require('../../src/features/suggestions/screens/RecommendationScreen.tsx');
const { suggestionCopyFor } = require('../../src/util/strings.ts');
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

test('Choose targets opens with all foods and current selections even when no targets need generation', async t => {
  const targetOptions = ['1', '2'].map(foodId => ({ target: { foodId, ingredientId: null }, name: `Food ${foodId}`, detail: '' }));
  const selections = [targetOptions[0].target];
  const updates = [];
  const item = { id: '901', foodId: '1', ingredientId: null, foodSnapshot: { name: 'Food 1' } };
  model = { source: { data: { mealDate: '2026-11-02', mealType: 'lunch', foods: targetOptions.map(option => ({ id: option.target.foodId, name: option.name })) } },
    suggestions: {}, items: [item], current: item, visibleTargets: selections, availableTargets: [], targetOptions,
    busy: false, generating: false, selectTargets: targets => updates.push(targets) };
  const route = RecommendationScreen({ mealId: '10' });
  const h = await renderHook(t, () => route.type(route.props));
  const chooser = () => elements(h.current).find(node => node.props?.accessibilityLabel === suggestionCopyFor('en').changeFoods);
  const sheet = () => elements(h.current).find(node => node.type === ChangeFoodsSheet);
  assert.equal(chooser().props.disabled, false);
  await act(async () => chooser().props.onPress());
  assert.deepEqual(sheet().props.current, selections);
  assert.deepEqual(sheet().props.options, targetOptions);
  await act(async () => sheet().props.onClose());
  assert.equal(sheet(), undefined);
  assert.deepEqual(model.visibleTargets, selections);
  assert.equal(updates.length, 0);
  await act(async () => chooser().props.onPress());
  await act(async () => sheet().props.onUpdate([targetOptions[1].target]));
  assert.deepEqual(updates, [[targetOptions[1].target]]);
  assert.equal(sheet(), undefined);
  model = { ...model, busy: true };
  await h.rerender();
  assert.equal(chooser().props.disabled, true);
});
