// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Food targets, automatic generation, reselection and retry boundaries
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 서버 식사 상세·음식 단위 추천 응답 모양으로 수정
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 추천 제외 및 음식 단위 요청 검증

// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 음식 단위 추천 요청 기대값 반영
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 선택적 추가 추천·중복 클릭·응답 복구·대상 재선택 검증

// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 추천 생성 대상·중복 방지·실패 복구 검증 분리
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 생성·재시도·결정 중복 방지와 재생성 기기 환경 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { homeSuggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name === 'expo') return { uuid: { v4: require('node:crypto').randomUUID } };
  if (name === 'react-native') return { AppState: { addEventListener: () => ({ remove() {} }) } };
});
const { useRecommendationFlow } = require('../../../src/features/suggestions/hooks/useRecommendationFlow.ts');

function generate(t, response) {
  return t.mock.method(global, 'fetch', async (url, init) => {
    assert.equal(new URL(url).pathname, '/api/v1/suggestions');
    assert.equal(init.method, 'POST');
    assert.equal(init.body, undefined);
    return response(init);
  });
}

test('화면에 진입하면 추천 한 장을 요청하고 다시 그려도 중복 생성하지 않는다', async t => {
  const pending = deferred();
  const post = generate(t, () => pending.promise);
  const hook = await renderHook(t, () => useRecommendationFlow('1'), {
    wrapper: child => React.createElement(React.StrictMode, null, child),
  });
  await act(async () => { hook.current.request(); hook.current.request(); });
  assert.equal(hook.current.current, null);
  assert.equal(post.mock.callCount(), 1);
  await act(async () => pending.resolve(Response.json(homeSuggestionResponse())));
  await waitFor(() => hook.current.current?.status === 'pending');
  await hook.rerender();
  assert.equal(hook.current.current.foodName, 'Rice');
  assert.equal(post.mock.callCount(), 1);
});

for (const failure of ['서버 오류', '시간 초과', '불완전한 카드']) {
  test(`${failure} 후에는 명시적으로 재시도해야 새 카드가 표시된다`, async t => {
    const timeout = new AbortController();
    t.mock.method(AbortSignal, 'timeout', milliseconds => {
      assert.equal(milliseconds, 10_000);
      return timeout.signal;
    });
    let retry = false;
    const post = generate(t, ({ signal }) => {
      if (retry) return Response.json(homeSuggestionResponse());
      if (failure === '시간 초과') {
        return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
      }
      if (failure === '서버 오류') return Response.json({ error_code: 'GENERATION_FAILED' }, { status: 503 });
      return Response.json(homeSuggestionResponse({ food_name: '' }));
    });
    const hook = await renderHook(t, () => useRecommendationFlow('1'));
    if (failure === '시간 초과') await act(async () => timeout.abort());
    await waitFor(() => hook.current.generationFailed);
    await hook.rerender();
    assert.equal(hook.current.current, null);
    assert.equal(post.mock.callCount(), 1);
    retry = true;
    await act(async () => { hook.current.request(); hook.current.request(); });
    await waitFor(() => hook.current.current?.id === '31');
    assert.equal(hook.current.generationFailed, false);
    assert.equal(post.mock.callCount(), 2);
  });
}

test('응답 전에 아이가 바뀌면 새 아이의 카드만 표시한다', async t => {
  const first = deferred();
  const second = deferred();
  let childId = '1';
  const post = generate(t, () => childId === '1' ? first.promise : second.promise);
  const hook = await renderHook(t, () => useRecommendationFlow(childId), {
    wrapper: child => React.cloneElement(child, { key: childId }),
  });
  childId = '2';
  await hook.rerender();
  await act(async () => second.resolve(Response.json(homeSuggestionResponse({ id: '32', user_id: '2' }))));
  await waitFor(() => hook.current.current?.id === '32');
  await act(async () => first.resolve(Response.json(homeSuggestionResponse())));
  assert.equal(hook.current.current.id, '32');
  assert.equal(post.mock.callCount(), 2);
});

test('결정에 실패하면 카드를 유지하고 제외·되돌리기 중에 중복 요청을 막는다', async t => {
  const writes = [];
  const dismissal = deferred();
  const undo = deferred();
  let retry = false;
  t.mock.method(global, 'fetch', async (url, init) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/suggestions' && init.method === 'POST') return Response.json(homeSuggestionResponse());
    assert.equal(path, '/api/v1/suggestions/31/decision');
    writes.push(init.method);
    if (init.method === 'PUT') {
      assert.deepEqual(JSON.parse(init.body), { status: 'DISMISSED', dismiss_reasons: ['DISLIKE'] });
      return retry ? dismissal.promise : Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
    }
    assert.equal(init.method, 'DELETE');
    return undo.promise;
  });
  const hook = await renderHook(t, () => useRecommendationFlow('1'));
  await waitFor(() => hook.current.current?.status === 'pending');
  const dismiss = () => hook.current.changeDecision('dismissed', ['dislike']);
  await act(async () => dismiss());
  await waitFor(() => hook.current.decisionFailed);
  assert.equal(hook.current.current.status, 'pending');
  retry = true;
  await act(async () => { dismiss(); dismiss(); });
  assert.deepEqual(writes, ['PUT', 'PUT']);
  await act(async () => dismissal.resolve(Response.json(homeSuggestionResponse({
    status: 'DISMISSED', dismiss_reasons: ['DISLIKE'],
  }))));
  await waitFor(() => hook.current.current.status === 'dismissed' && !hook.current.busy);
  assert.deepEqual(hook.current.current.dismissReasons, ['dislike']);
  await act(async () => { hook.current.changeDecision('pending'); hook.current.changeDecision('pending'); });
  await act(async () => undo.resolve(Response.json(homeSuggestionResponse())));
  await waitFor(() => hook.current.current.status === 'pending' && !hook.current.busy);
  assert.deepEqual(writes, ['PUT', 'PUT', 'DELETE']);
});
