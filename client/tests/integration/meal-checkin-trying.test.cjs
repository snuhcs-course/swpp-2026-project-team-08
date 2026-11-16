// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 실제 체크인 화면의 Trying 해제·취소 및 저장 요청 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
const { mealResponse } = require('../fixtures/server-meal.cjs');
const { suggestionResponse } = require('../fixtures/server-suggestion.cjs');

// Exercise Screen callbacks and real hooks/API/storage; omit native rendering and navigation.
const { values } = require('../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name === 'react-native') return {
    ActivityIndicator: 'activity-indicator', Text: 'text',
    BackHandler: { addEventListener: () => ({ remove() {} }) },
  };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'safe-area' };
  if (name === 'expo-router') return { router: { replace() {}, canGoBack: () => false } };
  if (name.endsWith('/mealPhotoPicker')) return { pickMealPhoto: async () => null, PhotoError: class extends Error {} };
  if (name.endsWith('/ProfileProvider')) return { useProfile: () => ({ profile: { id: '1', childName: 'Test' } }) };
  if (name.endsWith('/AppButton')) return { AppButton: 'app-button' };
  if (name === './MealCheckinView') return { MealCheckinView: 'meal-checkin-view' };
  if (name === './MealDraftResumeView') return { MealDraftResumeView: 'meal-draft-resume-view' };
});
const { MealCheckinScreen } = require('../../src/features/meal-checkin/screens/MealCheckinScreen.tsx');
const { readMealDraft } = require('../../src/data/storage/mealStorage.ts');
beforeEach(() => values.clear());

async function mountCheckin(t, { delaySuggestions = false } = {}) {
  const suggestions = [suggestionResponse({ status: 'SAVED', meal_id: '10', origin_food_id: '1' })];
  const suggestionsGate = deferred();
  const requests = [];
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/suggestions' && !init.method) {
      return Response.json(delaySuggestions ? await suggestionsGate.promise : suggestions);
    }
    if (path === '/api/v1/meals' && !init.method) return Response.json([mealResponse()]);
    assert.equal(path, '/api/v1/meals');
    assert.equal(init.method, 'PUT');
    const body = JSON.parse(init.body);
    requests.push(body);
    const response = mealResponse();
    return Response.json({
      ...response, meal_date: body.meal_date, meal_type: body.meal_type, setting: body.setting,
      foods: body.foods.map((food, index) => ({
        ...response.foods[0], id: String(index + 1), name: food.name,
      })),
    });
  });
  const harness = await renderHook(t, () => MealCheckinScreen({
    childId: '1', language: 'en', afterMealIntent: false, tryingSuggestionId: '31',
  }));
  await waitFor(() => !!harness.current.props.onEdit);
  await act(async () => {
    harness.current.props.onUpdate({ mealType: 'lunch', setting: 'home', mealDate: '2026-10-23' });
    harness.current.props.onGo('foods');
  });
  if (!delaySuggestions) await waitFor(() => harness.current.props.suggestions[0]?.title === 'Rice');
  return { harness, requests, resolveSuggestions: () => suggestionsGate.resolve(suggestions) };
}

async function addFood(harness) {
  await act(async () => harness.current.props.onEdit());
  await act(async () => harness.current.props.onChangeFood({ name: 'Soup' }));
}

async function saveCheckin(harness) {
  await act(async () => harness.current.props.onConfirm());
  await waitFor(() => harness.current.props.draft.step === 'complete');
}

test('unchecking Trying clears the committed link and excludes it from a successful HTTP save', async t => {
  const { harness, requests } = await mountCheckin(t);
  await addFood(harness);
  assert.equal(harness.current.props.draft.editingSuggestionLink.suggestionId, '31');
  await act(async () => harness.current.props.onSaveFood());
  assert.equal(harness.current.props.draft.suggestionLinks[0].suggestionId, '31');
  await act(async () => harness.current.props.tryingSuggestion.onToggle());
  assert.equal(harness.current.props.tryingSuggestion.checked, false);
  assert.deepEqual((await readMealDraft('1')).suggestionLinks, []);
  await saveCheckin(harness);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].foods[0].food_recommendation_ids, []);
  assert.equal((await readMealDraft('1')).step, 'complete');
});

test('unchecking Trying clears the editor link and prevents a late response from refilling it', async t => {
  const { harness, resolveSuggestions } = await mountCheckin(t, { delaySuggestions: true });
  await addFood(harness);
  await act(async () => harness.current.props.tryingSuggestion.onToggle());
  await act(async () => resolveSuggestions());
  await waitFor(() => harness.current.props.suggestions.length === 1);
  assert.equal(harness.current.props.draft.editingSuggestionLink, null);
  await act(async () => harness.current.props.onCancelFood());
  await act(async () => harness.current.props.tryingSuggestion.onToggle());
  await addFood(harness);
  assert.equal(harness.current.props.draft.editingSuggestionLink.suggestionId, '31');
  await act(async () => harness.current.props.tryingSuggestion.onToggle());
  assert.equal((await readMealDraft('1')).editingSuggestionLink, null);
});

test('editor unlink can be cancelled; saving the unlink stops Trying and prevents fallback relinking', async t => {
  const { harness, requests } = await mountCheckin(t);
  await addFood(harness);
  await act(async () => harness.current.props.onSaveFood());
  const food = harness.current.props.draft.foods[0];
  await act(async () => harness.current.props.onEdit(food));
  await act(async () => harness.current.props.suggestionLinking.onUnlink('31'));
  await act(async () => harness.current.props.onCancelFood());
  assert.equal(harness.current.props.tryingSuggestion.checked, true);
  assert.equal(harness.current.props.draft.suggestionLinks[0].suggestionId, '31');
  await act(async () => harness.current.props.onEdit(food));
  await act(async () => harness.current.props.suggestionLinking.onUnlink('31'));
  await act(async () => harness.current.props.onSaveFood());
  assert.equal(harness.current.props.tryingSuggestion.checked, false);
  await saveCheckin(harness);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].foods[0].food_recommendation_ids, []);
});

test('food-card unlink stops Trying, and explicitly rechecking permits linking again', async t => {
  const { harness, requests } = await mountCheckin(t);
  await addFood(harness);
  await act(async () => harness.current.props.onSaveFood());
  await act(async () => harness.current.props.suggestionLinking.onUnlink('31'));
  assert.equal(harness.current.props.tryingSuggestion.checked, false);
  assert.deepEqual((await readMealDraft('1')).suggestionLinks, []);
  await act(async () => harness.current.props.tryingSuggestion.onToggle());
  await saveCheckin(harness);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].foods[0].food_recommendation_ids, ['31']);
});

test('Undo after unchecking Trying restores the removed food without its recommendation', async t => {
  const { harness } = await mountCheckin(t);
  await addFood(harness);
  await act(async () => harness.current.props.onSaveFood());
  const food = harness.current.props.draft.foods[0];
  await act(async () => harness.current.props.onRemove(food.id));
  await act(async () => harness.current.props.tryingSuggestion.onToggle());
  await act(async () => harness.current.props.onUndoRemove());
  const stored = await readMealDraft('1');
  assert.deepEqual(stored.foods, [food]);
  assert.deepEqual(stored.suggestionLinks, []);
});
