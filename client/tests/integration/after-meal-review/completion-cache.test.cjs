// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty autosave, food editing, failure and server restoration
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 리뷰 요청의 대문자 outcome 과 식사 상세 응답 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 재료 난이도 테스트를 서버 난이도 값과 식사 상세 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: Add 없이 입력한 음식·재료 사유의 저장 실패·재시도·복원 검증
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 및 Record a Try 미리 채움 검증
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 편집 추천의 저장·취소·복원과 자동 연결 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 일반 추천 연결·취소·저장 검증을 행동별 테스트로 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 완료 캐시 갱신 검증 분리 및 기존 Retry 흐름 중복 제거
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {};
});
const { mealResponse, reviewResponse } = require('../../fixtures/server-meal.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { saveMeal } = require('../../../src/data/storage/mealStorage.ts');
const { readHomeMeals } = require('../../../src/data/storage/homeMealStorage.ts');
const { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { newReviewDraft, reviewFromDraft, setOutcome } = require('../../../src/features/after-meal-review/rules.ts');
const { afterMealKeys, useSaveAfterMealReview } = require('../../../src/data/queries/afterMealReviewQueries.ts');
const { useMealList } = require('../../../src/data/queries/mealLogQueries.ts');
const { mealKeys, mealLogKeys } = require('../../../src/data/queries/mealQueryKeys.ts');
const { checkinReferenceKeys } = require('../../../src/data/queries/checkinReferenceQueries.ts');
beforeEach(t => {
  values.clear();
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected HTTP request'); });
});

test('리뷰 저장 실패 시 초안과 조회 결과를 유지하고 재시도 성공 후 로컬 저장값·상세 캐시·홈 목록을 갱신한다', async (t) => {
  const response = mealResponse();
  const detail = toMealDetail(response);
  const meal = toLegacyMeal(detail);
  await saveMeal(meal);
  const draft = { ...newReviewDraft(meal), step: 'difficulties' };
  draft.outcomes = setOutcome(draft.outcomes, '1', 'tasted');
  await saveAfterMealDraft(draft);
  const review = reviewFromDraft(draft, meal);
  let fails = true;
  let requests = 0;
  let listRequests = 0;
  let serverMeal = response;
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    if (new URL(url).pathname === '/api/v1/meals' && !init.method) {
      listRequests++;
      return new Response(JSON.stringify([serverMeal]));
    }
    assert.equal(new URL(url).pathname, '/api/v1/meals/10/review');
    assert.equal(init.method, 'PUT');
    const body = JSON.parse(init.body);
    assert.equal(body.food_results[0].outcome, 'TASTED');
    requests++;
    if (!fails) serverMeal = reviewResponse(response, body);
    return new Response(JSON.stringify(fails ? { error_code: 'UNAVAILABLE' } : reviewResponse(response, body)),
      { status: fails ? 503 : 200 });
  });
  const harness = await renderHook(t, () => ({ mutation: useSaveAfterMealReview(), home: useMealList('1', null) }));
  await waitFor(() => harness.current.home.isSuccess);
  assert.equal(harness.current.home.data[0].review, null);
  const staleKeys = [mealLogKeys.all('1'), checkinReferenceKeys.meals('1'), ['suggestions', '1']];
  harness.client.setQueryData(mealKeys.detail('1', '10'), detail);
  for (const key of staleKeys) harness.client.setQueryData(key, []);
  await act(async () => {
    await assert.rejects(harness.current.mutation.mutateAsync({ review, detail }), /UNAVAILABLE/);
  });
  assert.equal(requests, 1);
  assert.equal(await readAfterMealReview('1', '10'), null);
  assert.equal((await readAfterMealDraft('1', '10')).step, 'difficulties');
  assert.equal(harness.client.getQueryData(mealKeys.detail('1', '10')).review, null);
  assert.equal(harness.current.home.data[0].review, null);
  for (const key of staleKeys) assert.equal(harness.client.getQueryState(key).isInvalidated, false);
  fails = false;
  await act(async () => { await harness.current.mutation.mutateAsync({ review, detail }); });
  await waitFor(() => harness.current.home.data[0].review?.foodResults[0].outcome === 'tasted');
  assert.equal(listRequests, 2);
  assert.equal(requests, 2);
  assert.equal((await readHomeMeals('1'))[0].reviewed, true);
  assert.equal((await readAfterMealDraft('1', '10')).step, 'complete');
  assert.equal(harness.client.getQueryData(afterMealKeys.draft('1', '10')).step, 'complete');
  assert.deepEqual(harness.client.getQueryData(afterMealKeys.result('1', '10')), review);
  assert.equal(harness.client.getQueryData(mealKeys.detail('1', '10')).review.foodResults[0].outcome, 'tasted');
  for (const key of staleKeys) assert.equal(harness.client.getQueryState(key).isInvalidated, true);
  assert.equal(harness.client.getQueryState(mealLogKeys.list('1', null)).isInvalidated, false);
});
