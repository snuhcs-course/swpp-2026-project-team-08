// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 교체의 초기화·취소·실패 및 삭제 후 늦은 응답 경계 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
let selectPhoto;
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker')
    ? { pickMealPhoto: source => selectPhoto(source), PhotoError: class extends Error {} }
    : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { photoDraft } = require('../../fixtures/meal-photo.cjs');
beforeEach(() => values.clear());
const replacement = { id: 'new-photo', uri: 'file:///new.png', mimeType: 'image/png' };

async function start(t, draft = photoDraft()) {
  await saveMealDraft(draft);
  const h = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => !!h.current.draft);
  await act(async () => h.current.continueDraft());
  return h;
}

test('유효한 사진으로 교체하면 음식·추천 연결·편집 상태를 비우고 식사 기본 정보는 유지한다', async t => {
  const original = photoDraft();
  original.editingFood = { ...original.foods[0], servingNote: '작성 중' };
  original.editingSuggestionLink = original.suggestionLinks[0];
  const h = await start(t, original);
  selectPhoto = async () => replacement;
  await act(async () => h.current.pick('gallery'));
  assert.deepEqual(h.current.draft, { ...original, photo: replacement, foods: [],
    suggestionLinks: [], editingFood: null, editingSuggestionLink: null });
  assert.equal(h.current.error, null);
  assert.equal(h.current.picking, false);
});

test('사진 교체를 취소하거나 실패하면 기존 사진·음식·연결을 유지한다', async t => {
  const h = await start(t);
  const original = structuredClone(h.current.draft);
  selectPhoto = async () => null;
  await act(async () => h.current.pick('gallery'));
  assert.deepEqual(h.current.draft, original);
  assert.equal(h.current.error, null);
  selectPhoto = async () => { throw new Error('Image unavailable'); };
  await act(async () => h.current.pick('files'));
  assert.deepEqual(h.current.draft, original);
  assert.equal(h.current.error, 'image');
  assert.equal(h.current.picking, false);
});

test('음식이 없는 상태에서 사진을 교체하면 새 사진과 기존 식사 기본 정보를 유지한다', async t => {
  const original = { ...photoDraft(), foods: [], suggestionLinks: [] };
  const h = await start(t, original);
  selectPhoto = async () => replacement;
  await act(async () => h.current.pick('camera'));
  assert.deepEqual(h.current.draft, { ...original, photo: replacement });
});

test('사진을 교체한 뒤에는 이전 음식 삭제를 취소해도 음식과 연결이 복원되지 않는다', async t => {
  const h = await start(t);
  await act(async () => h.current.removeFood('rice'));
  assert.equal(h.current.removed.food.id, 'rice');
  assert.equal(h.current.removed.links.length, 1);
  selectPhoto = async () => replacement;
  await act(async () => h.current.pick('gallery'));
  assert.equal(h.current.removed, null);
  await act(async () => h.current.undoRemove());
  assert.deepEqual(h.current.draft.foods, []);
  assert.deepEqual(h.current.draft.suggestionLinks, []);
  assert.deepEqual(h.current.draft.photo, replacement);
});

test('교체 중 사진을 삭제하면 음식과 연결은 유지하고 늦은 성공·실패 응답을 무시한다', async t => {
  const h = await start(t);
  for (const outcome of ['success', 'failure']) {
    await act(async () => h.current.update(photoDraft()));
    const original = structuredClone(h.current.draft);
    const pending = deferred();
    selectPhoto = () => pending.promise;
    let request;
    await act(async () => { request = h.current.pick('gallery'); });
    assert.equal(h.current.picking, true);
    await act(async () => h.current.removePhoto());
    const expected = { ...original, photo: null, step: 'photo' };
    assert.deepEqual(h.current.draft, expected);
    assert.equal(h.current.picking, false);
    await act(async () => {
      if (outcome === 'success') pending.resolve(replacement);
      else pending.reject(new Error('Late failure'));
      await request;
    });
    assert.deepEqual(h.current.draft, expected);
    assert.equal(h.current.error, null);
    assert.equal(h.current.picking, false);
  }
});
