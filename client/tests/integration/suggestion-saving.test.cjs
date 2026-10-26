// Connects the screen's real mutation/query hooks, QueryClient, HTTP client and DTO parsing.
// Only fetch and native storage are replaced; responses use the current v1 API contract.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
const { values } = require('../helpers/native-boundaries.cjs').nativeBoundaries();
const { clearSession } = require('../../src/data/storage/authStorage.ts');
const { useMealSuggestionActions, useMealSuggestions } = require('../../src/data/queries/mealSuggestionQueries.ts');
const { useSavedSuggestionsForCheckin } = require('../../src/data/queries/checkinReferenceQueries.ts');

beforeEach(async () => { values.clear(); await clearSession(); });
const json = value => new Response(JSON.stringify(value));
const unavailable = () => new Response('{"error_code":"UNAVAILABLE"}', { status: 503 });
function suggestion(id = '31', status = 'pending') {
  return {
    id, user_id: '1', meal_id: '8', food_id: id === '31' ? '2' : '3', ingredient_id: null,
    food_snapshot: { name: 'Rice', ingredients: [], cooking_method: null,
      serving_note: null, acceptance: null },
    what_to_try: 'Try a little', why_this_may_help: 'Familiar texture', serving_tip: null,
    status, dismiss_reasons: [], saved_at: status === 'saved' ? '2026-10-23T00:00:00Z' : null,
    created_at: '2026-10-23T00:00:00Z',
  };
}
function setup(t, status = 'pending') {
  const server = {
    items: [suggestion('31', status), suggestion('32', 'saved')],
    decide: async () => json(suggestion('31', 'saved')),
    undo: async () => json(suggestion()),
    list: null,
    writes: [],
  };
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname + new URL(url).search;
    const method = init.method ?? 'GET';
    if (method === 'GET' && path === '/api/v1/meals/8/suggestions?status=all') {
      return json(server.items);
    }
    if (method === 'GET' && path === '/api/v1/suggestions') {
      return server.list ? server.list() : json(server.items.filter(item => item.status === 'saved'));
    }
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.ok(['PUT', 'DELETE'].includes(method), `Unexpected method: ${method}`);
    if (method === 'PUT') {
      assert.deepEqual(JSON.parse(init.body), { status: 'saved', dismiss_reasons: [] });
    } else {
      assert.equal(init.body, undefined);
    }
    server.writes.push(method);
    const response = await (method === 'PUT' ? server.decide() : server.undo());
    if (response.ok) {
      const item = await response.clone().json();
      server.items = server.items.map(old => old.id === item.id ? item : old);
    }
    return response;
  });
  return server;
}
async function mount(t) {
  const hook = await renderHook(t, () => ({
    actions: useMealSuggestionActions('1', '8'),
    meal: useMealSuggestions('1', '8'),
    list: useSavedSuggestionsForCheckin('1'),
  }));
  await waitFor(() => hook.current.meal.isSuccess && hook.current.list.isSuccess);
  return hook;
}
const ids = query => query.data.map(item => item.id);
const save = hook => hook.current.actions.decide.mutateAsync({ id: '31', status: 'saved' });

test('saving updates the meal observer and refetches the saved list without losing another card', async t => {
  const server = setup(t);
  const hook = await mount(t);
  assert.deepEqual(ids(hook.current.list), ['32']);
  await act(async () => { await save(hook); });
  await waitFor(() => !hook.current.list.isFetching && hook.current.list.data.length === 2);
  assert.deepEqual(ids(hook.current.list), ['31', '32']);
  assert.equal(hook.current.list.data[0].savedAt, '2026-10-23T00:00:00Z');
  await waitFor(() => hook.current.meal.data[0].status === 'saved');
  assert.deepEqual(hook.current.meal.data[0], hook.current.list.data[0]);
  assert.deepEqual(server.writes, ['PUT']);
});

test('failed save preserves both observed lists and an explicit retry adds the card once', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const before = { meal: hook.current.meal.data, saved: hook.current.list.data };
  server.decide = unavailable;
  await act(async () => { await assert.rejects(save(hook), /UNAVAILABLE/); });
  await waitFor(() => hook.current.actions.decide.isError);
  assert.deepEqual(hook.current.meal.data, before.meal);
  assert.deepEqual(hook.current.list.data, before.saved);
  assert.deepEqual(server.writes, ['PUT']);
  server.decide = async () => json(suggestion('31', 'saved'));
  await act(async () => { await save(hook); });
  await waitFor(() => !hook.current.list.isFetching && hook.current.list.data.length === 2);
  await waitFor(() => hook.current.meal.data[0].status === 'saved');
  assert.deepEqual(ids(hook.current.list), ['31', '32']);
  assert.deepEqual(server.writes, ['PUT', 'PUT']);
});

test('removal hides only the selected card while pending and commits the pending meal status', async t => {
  const server = setup(t, 'saved');
  const hook = await mount(t);
  const response = deferred();
  server.undo = () => response.promise;
  let pending;
  await act(async () => { pending = hook.current.actions.undo.mutateAsync('31'); });
  await waitFor(() => hook.current.actions.undo.isPending && ids(hook.current.list).join() === '32');
  assert.equal(hook.current.meal.data[0].status, 'saved');
  await act(async () => { response.resolve(json(suggestion())); await pending; });
  await waitFor(() => !hook.current.list.isFetching && hook.current.meal.data[0].status === 'pending');
  assert.deepEqual(ids(hook.current.list), ['32']);
  assert.equal(hook.current.meal.data[0].savedAt, null);
  assert.deepEqual(server.writes, ['DELETE']);
});

test('failed removal restores the exact list before refetch completes; retry removes only that card', async t => {
  const server = setup(t, 'saved');
  const hook = await mount(t);
  const before = { meal: hook.current.meal.data, saved: hook.current.list.data };
  const response = deferred();
  const refetch = deferred();
  server.undo = () => response.promise;
  server.list = () => refetch.promise;
  let rejected;
  await act(async () => {
    rejected = assert.rejects(hook.current.actions.undo.mutateAsync('31'), /UNAVAILABLE/);
  });
  await waitFor(() => ids(hook.current.list).join() === '32');
  await act(async () => { response.resolve(unavailable()); await rejected; });
  await waitFor(() => hook.current.actions.undo.isError && hook.current.list.data.length === 2);
  // A held GET cannot conceal a missing optimistic rollback.
  assert.equal(hook.current.list.isFetching, true);
  assert.deepEqual(hook.current.list.data, before.saved);
  assert.deepEqual(hook.current.meal.data, before.meal);
  assert.deepEqual(server.writes, ['DELETE']);
  await act(async () => { refetch.resolve(json(server.items)); });
  await waitFor(() => !hook.current.list.isFetching);
  server.list = null;
  server.undo = async () => json(suggestion());
  await act(async () => { await hook.current.actions.undo.mutateAsync('31'); });
  await waitFor(() => !hook.current.list.isFetching && hook.current.meal.data[0].status === 'pending');
  assert.deepEqual(ids(hook.current.list), ['32']);
  assert.deepEqual(server.writes, ['DELETE', 'DELETE']);
});

test('failed saved-list refresh keeps existing data and retry reflects the successful save', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const previous = hook.current.list.data;
  server.list = unavailable;
  await act(async () => { await save(hook); });
  await waitFor(() => hook.current.list.isRefetchError);
  assert.deepEqual(hook.current.list.data, previous);
  await waitFor(() => hook.current.meal.data[0].status === 'saved');
  server.list = null;
  await act(async () => { await hook.current.list.refetch(); });
  await waitFor(() => hook.current.list.isSuccess && !hook.current.list.isFetching);
  assert.deepEqual(ids(hook.current.list), ['31', '32']);
  assert.deepEqual(server.writes, ['PUT']);
});
