// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Connects real suggestion mutations, Query cache and saved-list observer to API parsing.
// Only HTTP and native boundaries are mocked; no router/screen interaction is claimed.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
const { values } = require('../helpers/native-boundaries.cjs').nativeBoundaries();
const { suggestion } = require('../fixtures/suggestion.cjs');
const { useSuggestionActions, useSavedSuggestions, suggestionKeys } = require('../../src/data/queries/suggestionQueries.ts');
beforeEach(() => values.clear());
const json = value => new Response(JSON.stringify(value));
function setup(t, put) {
  let saved = [];
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/children/child/suggestions' && !init.method) return json(saved);
    assert.equal(path, '/api/v1/children/child/suggestions/s1/saved');
    assert.equal(init.method, 'PUT');
    const response = await put(JSON.parse(init.body));
    if (response.ok) {
      const item = await response.clone().json();
      saved = item.saved_at ? [item] : [];
    }
    return response;
  });
}
async function mount(t) {
  const hook = await renderHook(t, () => ({ actions: useSuggestionActions('child', 'meal'), list: useSavedSuggestions('child') }));
  await waitFor(() => hook.current.list.isSuccess);
  hook.client.setQueryData(suggestionKeys.detail('child', 's1'), suggestion);
  hook.client.setQueryData(suggestionKeys.batch('child', 'meal'), { revision: 'v1', selected_food_ids: ['food'], items: [suggestion] });
  return hook;
}

test('saving and removing a suggestion update detail, batch and the observed saved list', async t => {
  // Arrange: explicit responses for each saved state.
  setup(t, ({ saved }) => json({ ...suggestion, saved_at: saved ? suggestion.created_at : null }));
  const hook = await mount(t);
  for (const saved of [true, false]) {
    // Act: invoke the real mutation, including its success callback and refetch.
    await act(async () => hook.current.actions.save.mutateAsync({ id: 's1', saved }));
    // Assert: all consumers agree on the new state.
    await waitFor(() => hook.current.list.data.length === (saved ? 1 : 0));
    assert.equal(hook.client.getQueryData(suggestionKeys.detail('child', 's1')).saved_at, saved ? suggestion.created_at : null);
    assert.equal(hook.client.getQueryData(suggestionKeys.batch('child', 'meal')).items[0].saved_at, saved ? suggestion.created_at : null);
  }
});

test('failed save preserves caches and retry updates the list', async t => {
  let fail = true;
  setup(t, () => fail ? new Response('{}', { status: 503 }) : json({ ...suggestion, saved_at: suggestion.created_at }));
  const hook = await mount(t);
  await act(async () => assert.rejects(hook.current.actions.save.mutateAsync({ id: 's1', saved: true })));
  assert.deepEqual(hook.current.list.data, []);
  assert.deepEqual(hook.client.getQueryData(suggestionKeys.detail('child', 's1')), suggestion);
  assert.equal(hook.client.getQueryData(suggestionKeys.batch('child', 'meal')).items[0].saved_at, null);
  fail = false;
  await act(async () => hook.current.actions.save.mutateAsync({ id: 's1', saved: true }));
  assert.equal(hook.current.list.data[0].id, 's1');
});

test('late save from a previous child does not populate either child cache after switching', async t => {
  const response = deferred();
  const started = deferred();
  setup(t, () => { started.resolve(); return response.promise; });
  const hook = await renderHook(t, child => useSuggestionActions(child), { props: 'child' });
  let pending;
  await act(async () => { pending = hook.current.save.mutateAsync({ id: 's1', saved: true }); await started.promise; });
  await hook.rerender('other');
  await act(async () => { response.resolve(json({ ...suggestion, saved_at: suggestion.created_at })); await pending; });
  await waitFor(() => hook.current.save.isSuccess);
  assert.equal(hook.client.getQueryData(suggestionKeys.detail('child', 's1')), undefined);
  assert.equal(hook.client.getQueryData(suggestionKeys.detail('other', 's1')), undefined);
});
