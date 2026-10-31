// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: mock을 사용하는 Integration 테스트 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { renderHook, waitFor } = require('../../helpers/react-harness.cjs');
require('../../helpers/native-boundaries.cjs').nativeBoundaries();

const { clearSession } = require('../../../src/data/storage/authStorage.ts');
const { useMealDetail } = require('../../../src/data/queries/mealQueries.ts');

// 실제 Query Hook → API → 응답 변환을 연결한다. HTTP와 기기 저장소만 대체한다.
test('식사 상세를 조회하면 서버 응답이 앱 데이터로 변환되어 Query에 반영된다', async (t) => {
  // 준비
  await clearSession();
  const response = mealResponse();
  response.foods[0].name = '밥';
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    assert.equal(options.method ?? 'GET', 'GET');
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // 실행: 실제 React·Query를 실행하며, 테스트 종료 시 자동으로 정리한다.
  const hook = await renderHook(t, () => useMealDetail('1', '10'));
  await waitFor(() => hook.current.isSuccess);

  // 검증
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(hook.current.data.id, '10');
  assert.equal(hook.current.data.userId, '1');
  assert.equal(hook.current.data.mealDate, '2026-10-23');
  assert.equal(hook.current.data.foods.length, 1);
  assert.equal(hook.current.data.foods[0].name, '밥');
});
