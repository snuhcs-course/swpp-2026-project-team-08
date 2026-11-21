// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 재개 직후 진입 화면 복귀와 진행 후 이전 단계·새 재개 상태 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? { pickMealPhoto: async () => ({ id: 'picked', uri: 'file:///picked.png', mimeType: 'image/png' }) } : undefined);
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
beforeEach(() => values.clear());

async function mount(t, beforePhoto = true) {
  const response = { ...entryMeal(), before_photo_uri: beforePhoto ? 'file:///before.png' : null };
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    assert.equal(init.method ?? 'GET', 'GET');
    return Response.json(response);
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  return h;
}
async function start(t, step, beforePhoto = true) {
  const draft = { ...unfinishedReview(), step };
  if (step === 'photo') draft.afterPhoto = null;
  await saveAfterMealDraft(draft);
  return mount(t, beforePhoto);
}
async function back(h) {
  let handled;
  await act(async () => { handled = h.current.back(); });
  return handled;
}

test('재개 후 다음 단계로 진행하지 않은 초안의 뒤로가기 처리 결과는 false이고 입력과 단계는 같다', async t => {
  for (const step of ['photo', 'preview', 'compare', 'outcomes', 'difficulties']) {
    const h = await start(t, step);
    await act(async () => h.current.chooseOutcome('1', 'eaten'));
    await act(async () => h.current.editFood(h.current.meal.foods[0]));
    await act(async () => h.current.changeFood({ name: 'Changed rice' }));
    await act(async () => h.current.cancelFoodEdit());
    const before = structuredClone(h.current.draft);
    assert.equal(await back(h), false, step);
    assert.deepEqual(h.current.draft, before);
    assert.equal(h.current.meal.foods[0].name, 'Rice');
  }
});

test('재개 후 다음 단계로 진행한 초안은 처음 재개한 단계까지 돌아와도 뒤로가기 결과가 기존 이전 단계이다', async t => {
  for (const beforePhoto of [true, false]) {
    const h = await start(t, 'preview', beforePhoto);
    await act(async () => h.current.go('outcomes'));
    const before = structuredClone(h.current.draft);
    assert.equal(await back(h), true);
    assert.equal(h.current.draft.step, beforePhoto ? 'compare' : 'preview');
    if (beforePhoto) {
      assert.equal(await back(h), true);
      assert.equal(h.current.draft.step, 'preview');
    }
    assert.equal(await back(h), true);
    assert.deepEqual(h.current.draft, { ...before, step: 'photo' });
  }
  const h = await start(t, 'photo');
  await act(async () => h.current.pick('gallery'));
  assert.equal(h.current.draft.step, 'preview');
  assert.equal(await back(h), true);
  assert.equal(h.current.draft.step, 'photo');
});

test('이전 재개에서 다음 단계로 진행했어도 리뷰를 다시 연 직후 뒤로가기 처리 결과는 false이다', async t => {
  const h = await start(t, 'outcomes');
  await act(async () => h.current.go('difficulties'));
  assert.equal(await back(h), true);
  assert.equal(h.current.draft.step, 'outcomes');
  await act(async () => h.current.retrySave());
  const stored = await readAfterMealDraft('1', '10');
  const reopened = await mount(t);
  assert.deepEqual(reopened.current.draft, stored);
  assert.equal(await back(reopened), false);
  assert.deepEqual(reopened.current.draft, stored);
});
