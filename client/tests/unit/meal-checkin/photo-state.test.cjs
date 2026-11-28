// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 선택 Hook의 중복 요청 차단과 단계 이동 후 늦은 응답 무시 검증
// AI-generated with GPT-6, 2026-11-24, reviewed by Seoyeon Heo
// Changed: 사진 건너뛰기 시 초안과 파일 초기화 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
let selectPhoto;
let deletedPhoto;
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker')
    ? { pickMealPhoto: source => selectPhoto(source), deleteMealPhoto: photo => { deletedPhoto = photo; }, PhotoError: class extends Error {} }
    : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
beforeEach(() => { values.clear(); deletedPhoto = null; });
const photo = { id: 'selected-photo', uri: 'file:///photo.png', mimeType: 'image/png' };

async function start(t) {
  const h = await renderHook(t, () => useMealCheckin('photo-state'));
  await waitFor(() => !!h.current.draft);
  await act(async () => h.current.go('photo'));
  return h;
}

test('사진 선택 응답을 기다리는 동안 다시 선택을 요청해도 선택기는 한 번만 열린다', async t => {
  const pending = deferred();
  selectPhoto = t.mock.fn(() => pending.promise);
  const h = await start(t);
  let first, second;
  await act(async () => {
    first = h.current.pick('camera');
    second = h.current.pick('gallery');
  });
  assert.equal(selectPhoto.mock.callCount(), 1);
  assert.equal(h.current.picking, true);
  await act(async () => { pending.resolve(photo); await Promise.all([first, second]); });
  assert.equal(h.current.picking, false);
  assert.equal(h.current.draft.step, 'preview');
  assert.deepEqual(h.current.draft.photo, photo);
});

test('사진 선택 중 음식 목록으로 이동하면 늦게 도착한 사진이 현재 단계와 초안을 바꾸지 않는다', async t => {
  const pending = deferred();
  selectPhoto = () => pending.promise;
  const h = await start(t);
  let selection;
  await act(async () => { selection = h.current.pick('gallery'); });
  assert.equal(h.current.picking, true);
  await act(async () => h.current.go('foods'));
  const skipped = structuredClone(h.current.draft);
  assert.equal(skipped.step, 'foods');
  assert.equal(skipped.photo, null);
  assert.equal(h.current.picking, false);
  await act(async () => { pending.resolve(photo); await selection; });
  assert.deepEqual(h.current.draft, skipped);
  assert.equal(h.current.error, null);
});

test('사진을 선택한 뒤 사진 단계로 돌아가 건너뛰면 저장된 초안과 파일을 비운다', async t => {
  selectPhoto = async () => photo;
  const h = await start(t);
  await act(async () => h.current.pick('camera'));
  await act(async () => h.current.go('photo'));
  await act(async () => h.current.go('foods'));
  await waitFor(() => deletedPhoto !== null);
  assert.equal(h.current.draft.photo, null);
  assert.equal(h.current.draft.step, 'foods');
  assert.deepEqual(deletedPhoto, photo);
  const { readMealDraft } = require('../../../src/data/storage/mealStorage.ts');
  assert.equal((await readMealDraft('photo-state')).photo, null);
});
