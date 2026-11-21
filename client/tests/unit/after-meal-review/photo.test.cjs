// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 사진 선택 취소·오류·중복 요청과 건너뛴 뒤 늦은 응답 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
let selectPhoto;
class PhotoError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker')
    ? { pickMealPhoto: source => selectPhoto(source), PhotoError } : undefined);
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { saveAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const photo = { id: 'selected', uri: 'file:///selected.png', mimeType: 'image/png' };

beforeEach(() => {
  values.clear();
  selectPhoto = () => { throw new Error('Unexpected photo selection'); };
});
async function start(t) {
  await saveAfterMealDraft({ ...unfinishedReview(), step: 'photo', afterPhoto: null });
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    assert.equal(init.method ?? 'GET', 'GET');
    return Response.json(entryMeal());
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  return h;
}

test('사진 선택 결과가 취소이면 현재 단계·사진·답변은 선택 전과 같다', async t => {
  const h = await start(t);
  const before = structuredClone(h.current.draft);
  selectPhoto = () => Promise.resolve(null);
  await act(async () => h.current.pick('gallery'));
  assert.deepEqual(h.current.draft, before);
  assert.equal(h.current.photoError, null);
  assert.equal(h.current.picking, false);
});

test('사진 선택이 권한 오류나 이미지 오류로 실패하면 해당 오류가 설정되고 기존 입력은 같다', async t => {
  const h = await start(t);
  const before = structuredClone(h.current.draft);
  for (const code of ['permission', 'image']) {
    selectPhoto = () => Promise.reject(new PhotoError(code));
    await act(async () => h.current.pick('camera'));
    assert.equal(h.current.photoError, code);
    assert.equal(h.current.picking, false);
    assert.deepEqual(h.current.draft, before);
  }
});

test('사진 선택 요청이 대기 중일 때 다시 선택을 요청해도 선택기 호출 수는 1이다', async t => {
  const h = await start(t);
  const pending = deferred();
  selectPhoto = t.mock.fn(() => pending.promise);
  let first, second;
  await act(async () => {
    first = h.current.pick('camera');
    second = h.current.pick('gallery');
  });
  assert.equal(selectPhoto.mock.callCount(), 1);
  assert.deepEqual(selectPhoto.mock.calls[0].arguments, ['camera']);
  assert.equal(h.current.picking, true);
  assert.equal(h.current.draft.step, 'photo');
  assert.equal(h.current.draft.afterPhoto, null);
  await act(async () => { pending.resolve(photo); await Promise.all([first, second]); });
  assert.equal(h.current.picking, false);
  assert.equal(h.current.draft.step, 'preview');
  assert.deepEqual(h.current.draft.afterPhoto, photo);
});

test('사진 선택 중 결과 입력으로 이동한 뒤 이전 선택 결과가 도착해도 현재 단계·사진·답변은 같다', async t => {
  const h = await start(t);
  const old = deferred(), next = deferred();
  selectPhoto = () => old.promise;
  let oldPick, newPick;
  await act(async () => { oldPick = h.current.pick('gallery'); });
  await act(async () => h.current.manual());
  const skipped = structuredClone(h.current.draft);
  assert.equal(skipped.step, 'outcomes');
  assert.equal(skipped.afterPhoto, null);
  assert.equal(h.current.picking, false);
  // 이전 응답은 새 선택 요청의 대기 표시도 해제하지 않는다.
  selectPhoto = () => next.promise;
  await act(async () => { newPick = h.current.pick('gallery'); });
  await act(async () => { old.resolve(photo); await oldPick; });
  assert.deepEqual(h.current.draft, skipped);
  assert.equal(h.current.photoError, null);
  assert.equal(h.current.picking, true);
  const latest = { ...photo, id: 'latest', uri: 'file:///latest.png' };
  await act(async () => { next.resolve(latest); await newPick; });
  assert.deepEqual(h.current.draft, { ...skipped, afterPhoto: latest, step: 'preview' });
  assert.equal(h.current.picking, false);
});
