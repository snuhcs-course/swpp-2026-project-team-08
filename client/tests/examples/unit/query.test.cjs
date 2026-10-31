// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 레이어별 Unit 테스트와 입력값 선정 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { renderHook, waitFor } = require('../../helpers/react-harness.cjs');
require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const api = require('../../../src/data/api/mealReadApi.ts');
const { useMealDetail } = require('../../../src/data/queries/mealQueries.ts');

// API는 mock으로 대체하고 React·Query는 실제로 실행한다.
const cases = [
  { title: '식사 조회 API가 실패하면 Query에 오류가 반영된다', childId: '1', mealId: '10', expectedCalls: 1 },
  { title: '식사 ID가 비어 있으면 조회 요청을 보내지 않는다', childId: '1', mealId: '', expectedCalls: 0 },
  { title: '자녀 ID가 비어 있으면 조회 요청을 보내지 않는다', childId: '', mealId: '10', expectedCalls: 0 },
];

for (const { title, childId, mealId, expectedCalls } of cases) {
  test(title, async (t) => {
    // 준비
    const error = new Error('식사 조회 실패');
    const request = t.mock.method(api, 'getMealDetail', async () => { throw error; });

    // 실행: 공통 도구는 재시도를 끄고 종료 시 캐시를 정리한다.
    const hook = await renderHook(t, () => useMealDetail(childId, mealId));
    if (expectedCalls > 0) await waitFor(() => hook.current.isError);

    // 검증
    assert.equal(request.mock.callCount(), expectedCalls);
    assert.equal(hook.current.fetchStatus, 'idle');
    assert.equal(hook.current.data, undefined);
    if (expectedCalls > 0) {
      assert.equal(request.mock.calls[0].arguments[0], mealId);
      assert.equal(hook.current.error, error);
    } else {
      assert.equal(hook.current.error, null);
    }
  });
}
