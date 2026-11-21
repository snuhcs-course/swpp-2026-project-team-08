// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 사진 교체·취소·실패·삭제 시 기존 입력 보존과 늦은 응답 무시 검증
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
const { reviewPhotoFixture } = require('../../fixtures/after-meal-photo.cjs');
const { saveAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const replacement = { id: 'new', uri: 'file:///new.png', mimeType: 'image/png' };

beforeEach(() => {
  values.clear();
  selectPhoto = () => { throw new Error('Unexpected photo selection'); };
});
async function start(t) {
  const { response, draft } = reviewPhotoFixture();
  await saveAfterMealDraft(draft);
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    assert.equal(init.method ?? 'GET', 'GET');
    return Response.json(response);
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  return { h, draft, meal: structuredClone(h.current.meal) };
}

test('유효한 교체 사진으로 변경 시 식후 사진만 변경된다', async t => {
  const { h, draft, meal } = await start(t);
  selectPhoto = async () => replacement;
  await act(async () => h.current.pick('gallery'));
  assert.deepEqual(h.current.draft, { ...draft, afterPhoto: replacement });
  assert.deepEqual(h.current.meal, meal);
  assert.equal(h.current.photoError, null);
  assert.equal(h.current.picking, false);
});

test('사진 교체 결과가 취소나 오류이면 기존 식후 사진·답변·사유는 같다', async t => {
  const { h, draft, meal } = await start(t);
  for (const code of [null, 'permission', 'image']) {
    selectPhoto = async () => { if (code) throw new PhotoError(code); return null; };
    await act(async () => h.current.pick('gallery'));
    assert.deepEqual(h.current.draft, draft);
    assert.deepEqual(h.current.meal, meal);
    assert.equal(h.current.photoError, code);
    assert.equal(h.current.picking, false);
  }
});

test('식후 사진 삭제 시 사진 선택 단계로 이동하며, 식후 사진만 사라진다', async t => {
  const { h, draft, meal } = await start(t);
  await act(async () => h.current.removePhoto());
  assert.deepEqual(h.current.draft, { ...draft, step: 'photo', afterPhoto: null });
  assert.deepEqual(h.current.meal, meal);
  assert.equal(h.current.photoError, null);
  assert.equal(h.current.picking, false);
});

test('사진 교체 중 삭제한 뒤 이전 요청의 성공·실패 응답이 도착해도 삭제 후 상태는 같다', async t => {
  const { h, draft, meal } = await start(t);
  for (const result of ['success', 'failure']) {
    await act(async () => h.current.update(draft));
    const pending = deferred();
    selectPhoto = () => pending.promise;
    let request;
    await act(async () => { request = h.current.pick('gallery'); });
    assert.equal(h.current.picking, true);
    await act(async () => h.current.removePhoto());
    const expected = { ...draft, step: 'photo', afterPhoto: null };
    assert.deepEqual(h.current.draft, expected);
    assert.equal(h.current.picking, false);
    await act(async () => {
      if (result === 'success') pending.resolve(replacement);
      else pending.reject(new PhotoError('image'));
      await request;
    });
    assert.deepEqual(h.current.draft, expected);
    assert.deepEqual(h.current.meal, meal);
    assert.equal(h.current.photoError, null);
    assert.equal(h.current.picking, false);
  }
});
