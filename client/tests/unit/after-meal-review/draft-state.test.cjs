// AI-generated with GPT-6, GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 현재 리뷰 단계 복원과 저장 대기·실패·재시도·조회 실패 검증 · 통합 사진 확인 흐름 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values, storage, failNextWrite } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? {} : undefined);
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const key = 'nurturebites.after-meal.1.10.draft.v1';
beforeEach(() => values.clear());

async function mount(t) {
  const meal = { ...entryMeal(), before_photo_uri: 'file:///before.png' };
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    assert.equal(init.method ?? 'GET', 'GET');
    return Response.json(meal);
  });
  const profile = { id: '1' };
  return renderHook(t, () => useAfterMealReview(profile, '10'));
}
async function start(t, draft = unfinishedReview()) {
  await saveAfterMealDraft(draft);
  const h = await mount(t);
  await waitFor(() => h.current.draft !== null);
  return h;
}
async function failedEaten(t) {
  const h = await start(t);
  const before = values.get(key);
  failNextWrite(key);
  await act(async () => h.current.chooseOutcome('1', 'eaten'));
  await waitFor(() => h.current.saveStatus === 'error');
  return { h, before };
}

test('사진 선택·사진 확인·결과·어려움 단계의 초안을 저장하고 불러온 결과는 저장한 단계와 입력값이 같다', async t => {
  for (const step of ['photo', 'preview', 'outcomes', 'difficulties']) {
    const draft = { ...unfinishedReview(), step };
    if (step === 'photo') draft.afterPhoto = null;
    const h = await start(t, draft);
    assert.deepEqual(h.current.draft, draft, step);
    assert.deepEqual(await readAfterMealDraft('1', '10'), draft, step);
    assert.equal(h.current.meal.id, '10');
    assert.equal(h.current.finalSaveState, 'idle');
    assert.equal(h.current.canContinueOutcomes, false);
  }
});

test('Tasted에서 Eaten으로 수정했을 때, Eaten 저장이 진행 중이면 저장 상태는 saving이다', async t => {
  const h = await start(t);
  const write = storage.setItem.bind(storage);
  const tasted = deferred(), eaten = deferred();
  const writes = [];
  t.mock.method(storage, 'setItem', async (storageKey, value) => {
    if (storageKey === key) {
      const outcome = JSON.parse(value).outcomes[0].decision.confirmed;
      writes.push(outcome);
      await (outcome === 'tasted' ? tasted.promise : eaten.promise);
    }
    return write(storageKey, value);
  });
  let oldSave;
  await act(async () => { oldSave = h.current.retrySave(); });
  await waitFor(() => writes.length === 1);
  await act(async () => h.current.chooseOutcome('1', 'eaten'));
  assert.equal(h.current.saveStatus, 'saving');
  await act(async () => { tasted.resolve(); await oldSave; });
  await waitFor(() => writes.length === 2);
  assert.deepEqual(writes, ['tasted', 'eaten']);
  assert.equal(h.current.draft.outcomes[0].decision.confirmed, 'eaten');
  assert.equal(h.current.saveStatus, 'saving');
  assert.equal(JSON.parse(values.get(key)).outcomes[0].decision.confirmed, 'tasted');
  await act(async () => eaten.resolve());
  await waitFor(() => h.current.saveStatus === 'saved');
  assert.equal((await readAfterMealDraft('1', '10')).outcomes[0].decision.confirmed, 'eaten');
});

test('Eaten 입력의 초안 저장이 실패하면 화면의 결과는 Eaten이고 저장 상태는 error이다', async t => {
  const { h, before } = await failedEaten(t);
  const expected = unfinishedReview();
  expected.outcomes[0].decision.confirmed = 'eaten';
  assert.deepEqual(h.current.draft, expected);
  assert.equal(h.current.saveStatus, 'error');
  assert.equal(h.current.finalSaveState, 'idle');
  assert.equal(values.get(key), before);
});

test('저장에 실패한 Eaten 초안을 다시 저장해 성공하면 저장값은 Eaten이고 저장 상태는 saved이다', async t => {
  const { h } = await failedEaten(t);
  const current = structuredClone(h.current.draft);
  await act(async () => h.current.retrySave());
  assert.equal(h.current.saveStatus, 'saved');
  assert.deepEqual(await readAfterMealDraft('1', '10'), current);
  assert.equal((await readAfterMealDraft('1', '10')).outcomes[0].decision.confirmed, 'eaten');
  assert.deepEqual(h.current.draft, current);
});

test('초안 조회가 실패하면 불러오기 오류가 설정되고 기존 저장값은 변경되지 않는다', async t => {
  await saveAfterMealDraft(unfinishedReview());
  const before = values.get(key);
  const read = storage.getItem.bind(storage);
  t.mock.method(storage, 'getItem', async storageKey => {
    if (storageKey === key) throw new Error('Storage unavailable');
    return read(storageKey);
  });
  const writes = t.mock.method(storage, 'setItem');
  const h = await mount(t);
  await waitFor(() => h.current.loadError);
  assert.equal(h.current.draft, null);
  assert.equal(h.current.loading, false);
  assert.equal(values.get(key), before);
  assert.equal(writes.mock.callCount(), 0);
});
