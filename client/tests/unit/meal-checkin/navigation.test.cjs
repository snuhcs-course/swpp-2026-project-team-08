// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 재개 후 진행 여부·팝업 우선 닫기·기본 앞뒤 단계 이동 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const photo = { id: 'picked', uri: 'file:///picked.png', mimeType: 'image/png' };
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? { pickMealPhoto: async () => photo, PhotoError: class extends Error {} } : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { linkingDraft, link, options } = require('../../fixtures/meal-suggestion-linking.cjs');
beforeEach(() => values.clear());

function draftAt(step, withPhoto = true) {
  const draft = linkingDraft([link(0, 'rice')]);
  return { ...draft, step, photo: withPhoto ? draft.photo : null };
}
async function start(t, draft) {
  if (draft) await saveMealDraft(draft);
  const h = await renderHook(t, () => useMealCheckin('1', undefined, false, options));
  await waitFor(() => !!h.current.draft);
  if (draft) await act(async () => h.current.continueDraft());
  return h;
}
async function back(h) {
  let handled;
  await act(async () => { handled = h.current.back(); });
  return handled;
}
function expectStep(h, original, step) {
  assert.equal(h.current.resumeRequired, false);
  assert.deepEqual(h.current.draft, { ...original, step });
}

test('Ongoing Meal에서 재개한 뒤 다음 단계로 이동한 적이 없으면 뒤로가기 대상은 Ongoing Meal이다', async t => {
  for (const step of ['details', 'photo', 'preview', 'foods']) {
    const h = await start(t, draftAt(step));
    await act(async () => h.current.update({ setting: 'school' }));
    const edited = structuredClone(h.current.draft);
    assert.equal(await back(h), true);
    assert.equal(h.current.resumeRequired, true);
    assert.deepEqual(h.current.draft, edited);
  }
});

test('재개 후 다음 단계로 한 번이라도 이동했으면 뒤로가기 대상은 현재 단계의 이전 단계다', async t => {
  for (const withPhoto of [true, false]) {
    const h = await start(t, draftAt('photo', false));
    if (withPhoto) await act(async () => h.current.pick('gallery'));
    await act(async () => h.current.go('foods'));
    const original = structuredClone(h.current.draft);
    if (withPhoto) {
      await back(h);
      expectStep(h, original, 'preview');
    }
    await back(h);
    expectStep(h, original, 'photo');
    await back(h);
    expectStep(h, original, 'details');
    assert.equal(await back(h), false);
  }
  // 사진 선택 성공도 다음 단계 진행이다. 음식 목록까지 갈 필요는 없다.
  const h = await start(t, draftAt('photo', false));
  await act(async () => h.current.pick('gallery'));
  const picked = structuredClone(h.current.draft);
  await back(h);
  expectStep(h, picked, 'photo');
});

test('Ongoing Meal에서 다시 재개한 상태의 뒤로가기 대상은 Ongoing Meal이다', async t => {
  const h = await start(t, draftAt('photo', false));
  await act(async () => h.current.go('foods'));
  await act(async () => { await h.current.flush(); await h.current.reload(); });
  assert.equal(h.current.resumeRequired, true);
  const original = structuredClone(h.current.draft);
  for (let attempt = 0; attempt < 2; attempt++) {
    await act(async () => h.current.continueDraft());
    assert.equal(h.current.resumeRequired, false);
    await back(h);
    assert.equal(h.current.resumeRequired, true);
    assert.deepEqual(h.current.draft, original);
  }
});

test('편집창이나 추천 선택창이 열린 상태의 뒤로가기는 열린 창만 닫고 작성 단계를 변경하지 않는다', async t => {
  const original = draftAt('foods');
  const h = await start(t, original);
  await act(async () => h.current.edit(h.current.draft.foods[0]));
  await act(async () => h.current.changeFood({ name: 'Changed rice' }));
  await act(async () => h.current.suggestionLinking.onOpenPicker());
  await act(async () => h.current.suggestionLinking.onSelectSuggestion('32'));
  await back(h);
  assert.equal(h.current.suggestionLinking.pickerOpen, false);
  assert.equal(h.current.draft.editingFood.name, 'Changed rice');
  assert.deepEqual(h.current.draft.editingSuggestionLink, link(0, 'rice'));
  assert.equal(h.current.resumeRequired, false);
  assert.equal(h.current.draft.step, 'foods');
  await back(h);
  assert.equal(h.current.resumeRequired, false);
  assert.deepEqual(h.current.draft, original);
  await back(h);
  assert.equal(h.current.resumeRequired, true);
});

test('기본 정보에서 다음 이동의 결과는 사진 선택이고, 사진 확인에서 다음 이동과 사진 건너뛰기의 결과는 음식 목록이다', async t => {
  const h = await start(t);
  for (const [from, to, withPhoto] of [['details', 'photo', false], ['preview', 'foods', true], ['photo', 'foods', false]]) {
    await act(async () => h.current.update(draftAt(from, withPhoto)));
    const original = structuredClone(h.current.draft);
    await act(async () => h.current.go(to));
    expectStep(h, original, to);
  }
});

test('일반 흐름의 뒤로가기 결과는 사진 선택에서 기본 정보, 사진 확인에서 사진 선택, 음식 목록에서 사진 유무에 따른 이전 단계다', async t => {
  const h = await start(t);
  for (const [from, to, withPhoto] of [['photo', 'details', false], ['preview', 'photo', true],
    ['foods', 'preview', true], ['foods', 'photo', false]]) {
    await act(async () => h.current.update(draftAt(from, withPhoto)));
    const original = structuredClone(h.current.draft);
    assert.equal(await back(h), true);
    expectStep(h, original, to);
  }
});
