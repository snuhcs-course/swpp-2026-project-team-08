// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 리뷰 완료 입력·제출값·중복 요청과 로컬 실패·서버 실패·재시도 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values, storage, failNextWrite } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? {} : undefined);
const { completionFixture, expectedReview } = require('../../fixtures/after-meal-completion.cjs');
const { reviewResponse } = require('../../fixtures/server-meal.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { prepareReviewWrite } = require('../../../src/data/api/mealReviewApi.ts');
const { toMealReviewWrite } = require('../../../src/data/dto/reviewDto.ts');
const { reviewFromDraft } = require('../../../src/features/after-meal-review/rules.ts');
const { saveAfterMealDraft, readAfterMealReview } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const draftKey = 'nurturebites.after-meal.1.10.draft.v1';
const resultKey = 'nurturebites.after-meal.1.10.result.v1';
beforeEach(() => values.clear());

async function start(t, draft = completionFixture().draft) {
  const { response } = completionFixture();
  await saveAfterMealDraft(draft);
  const server = { requests: [], next: null };
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/meals/10' && !init.method) return Response.json(response);
    assert.equal(path, '/api/v1/meals/10/review');
    assert.equal(init.method, 'PUT');
    const body = JSON.parse(init.body);
    server.requests.push(body);
    const result = server.next ? await server.next.promise : 'success';
    if (result === 'failure') return Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
    return Response.json(reviewResponse(response, body));
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  return { h, server };
}

test('필수 결과가 미응답인 초안의 완료 요청 결과는 false이고 서버 요청은 없다', async t => {
  const { h, server } = await start(t);
  for (const target of ['food', 'ingredient']) {
    const { draft } = completionFixture();
    if (target === 'food') draft.outcomes[1].decision.confirmed = null;
    else draft.outcomes[0].ingredients[0].decision.confirmed = null;
    await act(async () => h.current.update(draft));
    await act(async () => assert.equal(await h.current.finish(), false));
    assert.deepEqual(h.current.draft, draft);
    assert.equal(h.current.finalSaveState, 'idle');
  }
  assert.deepEqual(server.requests, []);
});

test('완료 요청에는 음식 결과·선택한 재료 결과·식후 사진이 포함되고 선택하지 않은 재료는 제외된다', () => {
  const { response, draft } = completionFixture();
  const detail = toMealDetail(response), meal = toLegacyMeal(detail);
  const excluded = draft.outcomes[0].ingredients[1];
  excluded.decision.confirmed = 'untouched';
  draft.difficultyInputs[excluded.id] = { category: 'color', value: 'red', note: '' };
  for (const photo of [draft.afterPhoto, null]) {
    const input = { ...draft, afterPhoto: photo };
    const before = structuredClone(input);
    const review = reviewFromDraft(input, meal);
    assert.deepEqual(review.afterPhoto, photo);
    assert.equal(review.outcomes[0].ingredients.length, 1);
    assert.equal(review.difficulties[excluded.id], undefined);
    assert.deepEqual(toMealReviewWrite(prepareReviewWrite(review, detail)), expectedReview(photo?.uri ?? null));
    assert.deepEqual(input, before);
  }
});

test('완성된 어려움 입력은 Add 없이 최종 사유에 포함되고 미완성 입력은 제외된다', () => {
  const { response, draft, carrotId } = completionFixture();
  const meal = toLegacyMeal(toMealDetail(response));
  draft.difficulties['1'].push({ id: 'smell:fruit', category: 'smell', value: 'fruit' });
  const before = structuredClone(draft);
  const review = reviewFromDraft(draft, meal);
  assert.deepEqual(review.difficulties['1'].map(tag => tag.value), ['yellow', 'mint']);
  assert.deepEqual(review.difficulties[carrotId].map(tag => [tag.subcategory, tag.value]), [['hardness', 'firm']]);
  assert.deepEqual(draft, before);
  const withSavedTags = { ...draft, difficulties: review.difficulties };
  assert.deepEqual(reviewFromDraft(withSavedTags, meal).difficulties, review.difficulties);
  for (const input of [
    { category: null, value: '', note: '' },
    { category: 'texture', value: 'firm', note: '' },
    { category: 'texture', subcategory: 'moisture', value: 'firm', note: '' },
    { category: 'color', value: 'other', note: ' ' },
  ]) {
    draft.difficultyInputs['1'] = input;
    assert.deepEqual(reviewFromDraft(draft, meal).difficulties['1'], before.difficulties['1']);
  }
});

test('저장 응답이 대기 중일 때 완료를 다시 요청한 결과는 false이고 서버 요청은 한 번이며 저장 상태는 saving이다', async t => {
  const { h, server } = await start(t);
  const before = structuredClone(h.current.draft);
  server.next = deferred();
  let first;
  await act(async () => { first = h.current.finish(); });
  await waitFor(() => server.requests.length === 1);
  await act(async () => assert.equal(await h.current.finish(), false));
  assert.equal(server.requests.length, 1);
  assert.equal(h.current.finalSaveState, 'saving');
  assert.equal(h.current.saving, true);
  assert.deepEqual(h.current.draft, before);
  await act(async () => { server.next.resolve('success'); assert.equal(await first, true); });
  assert.equal(h.current.draft.step, 'complete');
  assert.equal(h.current.saving, false);
});

test('초안 저장이 실패한 상태에서도 서버 저장이 성공하면 완료 결과는 true이고 단계는 complete이다', async t => {
  const { h, server } = await start(t);
  const setItem = storage.setItem.bind(storage);
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === draftKey) throw new Error('Disk full');
    return setItem(key, value);
  });
  await act(async () => h.current.chooseOutcome('2', 'tasted'));
  await waitFor(() => h.current.saveStatus === 'error');
  await act(async () => assert.equal(await h.current.finish(), true));
  const expected = expectedReview();
  expected.food_results[1].outcome = 'TASTED';
  assert.deepEqual(server.requests, [expected]);
  assert.equal(h.current.draft.step, 'complete');
  assert.equal(h.current.saveStatus, 'saved');
  assert.equal(h.current.finalSaveState, 'idle');
});

test('서버 저장 실패의 완료 결과는 false이고 사진·답변·사유는 같으며 재시도 성공의 완료 결과는 true이다', async t => {
  const { h, server } = await start(t);
  const before = structuredClone(h.current.draft);
  server.next = deferred();
  server.next.resolve('failure');
  await act(async () => assert.equal(await h.current.finish(), false));
  assert.deepEqual(h.current.draft, before);
  assert.equal(h.current.finalSaveState, 'error');
  assert.equal(h.current.saving, false);
  assert.equal(await readAfterMealReview('1', '10'), null);
  server.next = null;
  await act(async () => assert.equal(await h.current.finish(), true));
  assert.deepEqual(server.requests, [expectedReview(), expectedReview()]);
  assert.equal(h.current.draft.step, 'complete');
  assert.equal(h.current.finalSaveState, 'idle');
});

test('서버 저장이 성공하면 로컬 사본 저장이 실패해도 완료 결과는 true이고 단계는 complete이다', async t => {
  const { h, server } = await start(t);
  failNextWrite(resultKey);
  await act(async () => assert.equal(await h.current.finish(), true));
  assert.deepEqual(server.requests, [expectedReview()]);
  assert.equal(await readAfterMealReview('1', '10'), null);
  assert.equal(h.current.draft.step, 'complete');
  assert.equal(h.current.finalSaveState, 'idle');
  assert.equal(h.current.saveStatus, 'saved');
  assert.deepEqual(h.current.draft.afterPhoto, completionFixture().draft.afterPhoto);
});
