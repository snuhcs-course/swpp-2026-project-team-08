// Connects the screen's real mutation/query hooks, QueryClient, HTTP client and DTO parsing.
// Only fetch and native storage are replaced; responses use the current v1 API contract.
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 대문자 상태·조회 필터와 음식 단위 추천 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 추천 저장 결정·취소·목록 갱신 검증을 기능 폴더로 이동
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 결정 응답과 저장 목록 동기화 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
const { useSuggestionActions } = require('../../../src/data/queries/suggestionQueries.ts');
const { useSavedSuggestionsForCheckin } = require('../../../src/data/queries/checkinReferenceQueries.ts');
beforeEach(async () => { values.clear(); await clearSession(); });
const json = value => new Response(JSON.stringify(value));
const unavailable = () => new Response('{"error_code":"UNAVAILABLE"}', { status: 503 });
function suggestion(id = '31', status = 'pending') {
  return suggestionResponse({
    id, origin_food_id: id === '31' ? '2' : '3', ingredients: [],
    status: status.toUpperCase(), saved_at: status === 'saved' ? '2026-10-23T00:00:00Z' : null,
    created_at: '2026-10-23T00:00:00Z',
  });
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
    if (method === 'GET' && path === '/api/v1/suggestions') {
      return server.list ? server.list() : json(server.items.filter(item => item.status === 'SAVED'));
    }
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.ok(['PUT', 'DELETE'].includes(method), `Unexpected method: ${method}`);
    if (method === 'PUT') {
      assert.deepEqual(JSON.parse(init.body), { status: 'SAVED', dismiss_reasons: [] });
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
    actions: useSuggestionActions('1'),
    list: useSavedSuggestionsForCheckin('1'),
  }));
  await waitFor(() => hook.current.list.isSuccess);
  return hook;
}
const ids = query => query.data.map(item => item.id);
const save = hook => hook.current.actions.decide.mutateAsync({ id: '31', status: 'saved' });

test('추천 저장 응답과 갱신한 목록이 일치하고 다른 추천도 유지된다', async t => {
  const server = setup(t);
  const hook = await mount(t);
  assert.deepEqual(ids(hook.current.list), ['32']);
  await act(async () => { await save(hook); });
  await waitFor(() => !hook.current.list.isFetching
    && hook.current.list.data?.length === 2 && hook.current.list.data?.[0]?.id === '31');
  assert.deepEqual(ids(hook.current.list), ['31', '32']);
  assert.equal(hook.current.list.data[0].savedAt, '2026-10-23T00:00:00Z');
  await waitFor(() => hook.current.actions.decide.data?.status === 'saved');
  assert.deepEqual(hook.current.actions.decide.data, hook.current.list.data[0]);
  assert.deepEqual(server.writes, ['PUT']);
});

test('추천 저장에 실패하면 저장 목록을 유지하고 재시도에 성공하면 해당 추천이 한 번만 추가된다', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const before = hook.current.list.data;
  server.decide = unavailable;
  await act(async () => { await assert.rejects(save(hook), /UNAVAILABLE/); });
  await waitFor(() => hook.current.actions.decide.isError);
  assert.deepEqual(hook.current.list.data, before);
  assert.deepEqual(server.writes, ['PUT']);
  server.decide = async () => json(suggestion('31', 'saved'));
  await act(async () => { await save(hook); });
  await waitFor(() => !hook.current.list.isFetching
    && hook.current.list.data?.length === 2 && hook.current.list.data?.[0]?.id === '31');
  await waitFor(() => hook.current.actions.decide.data?.status === 'saved');
  assert.deepEqual(ids(hook.current.list), ['31', '32']);
  assert.deepEqual(server.writes, ['PUT', 'PUT']);
});

test('추천 저장 결정을 취소하면 응답 대기 중 저장 목록에서 해당 카드만 숨기고 성공 후 추천 상태는 pending이다', async t => {
  const server = setup(t, 'saved');
  const hook = await mount(t);
  const response = deferred();
  server.undo = () => response.promise;
  let pending;
  await act(async () => { pending = hook.current.actions.undo.mutateAsync('31'); });
  await waitFor(() => hook.current.actions.undo.isPending && ids(hook.current.list).join() === '32');
  assert.equal(server.items[0].status, 'SAVED');
  await act(async () => { response.resolve(json(suggestion())); await pending; });
  await waitFor(() => !hook.current.list.isFetching
    && hook.current.list.data?.length === 1 && hook.current.list.data?.[0]?.id === '32'
    && hook.current.actions.undo.data?.status === 'pending');
  assert.deepEqual(ids(hook.current.list), ['32']);
  assert.equal(hook.current.actions.undo.data.savedAt, null);
  assert.deepEqual(server.writes, ['DELETE']);
});

test('추천 저장 결정 취소에 실패하면 재조회 전 기존 목록을 복원하고 재시도에 성공하면 해당 카드만 제거한다', async t => {
  const server = setup(t, 'saved');
  const hook = await mount(t);
  const before = hook.current.list.data;
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
  assert.deepEqual(hook.current.list.data, before);
  assert.deepEqual(server.writes, ['DELETE']);
  await act(async () => { refetch.resolve(json(server.items)); });
  await waitFor(() => !hook.current.list.isFetching);
  server.list = null;
  server.undo = async () => json(suggestion());
  await act(async () => { await hook.current.actions.undo.mutateAsync('31'); });
  await waitFor(() => !hook.current.list.isFetching
    && hook.current.list.data?.length === 1 && hook.current.list.data?.[0]?.id === '32'
    && hook.current.actions.undo.data?.status === 'pending');
  assert.deepEqual(ids(hook.current.list), ['32']);
  assert.deepEqual(server.writes, ['DELETE', 'DELETE']);
});

test('추천 저장 후 목록 재조회가 실패하면 기존 목록을 유지하고 조회 재시도 후 저장 결과를 표시한다', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const previous = hook.current.list.data;
  server.list = unavailable;
  await act(async () => { await save(hook); });
  await waitFor(() => hook.current.list.isRefetchError);
  assert.deepEqual(hook.current.list.data, previous);
  await waitFor(() => hook.current.actions.decide.data?.status === 'saved');
  server.list = null;
  await act(async () => { await hook.current.list.refetch(); });
  await waitFor(() => hook.current.list.isSuccess && !hook.current.list.isFetching
    && hook.current.list.data?.length === 2 && hook.current.list.data?.[0]?.id === '31');
  assert.deepEqual(ids(hook.current.list), ['31', '32']);
  assert.deepEqual(server.writes, ['PUT']);
});
