// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 추천 연결의 저장·취소 후 재선택·음식 간 이동·개별 해제 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? {
    pickMealPhoto() { throw new Error('추천 연결에서 사진 선택을 요청해서는 안 된다'); },
    PhotoError: class extends Error {},
  } : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { saveMealDraft, readMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { mealKeys } = require('../../../src/data/queries/mealQueryKeys.ts');
const { options, link, linkingDraft } = require('../../fixtures/meal-suggestion-linking.cjs');
beforeEach(() => values.clear());

async function start(t, draft = linkingDraft()) {
  await saveMealDraft(draft);
  const h = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions), { props: options });
  await waitFor(() => !!h.current.draft);
  await act(async () => h.current.continueDraft());
  return h;
}
async function select(h, id, foodId = h.current.draft.editingFood.id) {
  await act(async () => h.current.suggestionLinking.onOpenPicker());
  await act(async () => h.current.suggestionLinking.onSelectSuggestion(id));
  await act(async () => h.current.suggestionLinking.onLink(foodId));
}
async function expectStored(h, expected) {
  await act(async () => { await h.current.flush(); });
  assert.deepEqual(h.current.draft, expected);
  assert.deepEqual(await readMealDraft('1'), expected);
  assert.deepEqual(h.client.getQueryData(mealKeys.draft('1')), expected);
}

async function editLink(h, original, next) {
  await act(async () => h.current.edit(h.current.draft.foods[0]));
  await act(async () => h.current.changeFood({ name: 'Edited rice' }));
  if (next) await select(h, next.suggestionId);
  else await act(async () => h.current.suggestionLinking.onUnlink('32'));
  assert.deepEqual(h.current.draft.foods, original.foods);
  assert.deepEqual(h.current.draft.suggestionLinks, original.suggestionLinks);
  assert.deepEqual(h.current.draft.editingSuggestionLink, next);
  await expectStored(h, h.current.draft);
}

test('유효한 추천을 선택하지 않았거나 편집 중인 음식과 대상이 다르면 연결하지 않는다', async t => {
  const h = await start(t);
  await act(async () => h.current.edit(h.current.draft.foods[0]));
  const before = structuredClone(h.current.draft);
  for (const [id, foodId] of [['', 'rice'], ['missing', 'rice'], ['31', 'soup']]) {
    await select(h, id, foodId);
    assert.deepEqual(h.current.draft, before);
  }
  await h.rerender([]);
  assert.equal(h.current.suggestionLinking.canOpenPicker, false);
  await act(async () => h.current.suggestionLinking.onLink('rice'));
  assert.deepEqual(h.current.draft, before);
});

test('편집 중 연결·변경·해제는 기존 연결에 반영되지 않고, 취소하면 유지하며 저장하면 반영한다', async t => {
  const h = await start(t);
  // 연결 → 변경 → 해제 모두 동일한 저장 경계를 지킨다.
  for (const next of [link(0, 'rice'), link(1, 'rice'), null]) {
    const original = structuredClone(h.current.draft);
    for (const close of ['cancelEdit', 'back']) {
      await editLink(h, original, next);
      await act(async () => h.current[close]());
      await expectStored(h, original);
    }
    await editLink(h, original, next);
    await act(async () => h.current.saveFood());
    await expectStored(h, { ...original,
      foods: [{ ...original.foods[0], name: 'Edited rice' }, original.foods[1]],
      suggestionLinks: next ? [next] : [] });
  }
});

test('추천 변경을 취소하고 목록을 다시 열면 기존 추천이 선택되고, 그대로 연결·저장해도 기존 연결이 유지된다', async t => {
  const original = linkingDraft([link(0, 'rice')]);
  const h = await start(t, original);
  for (const cancelAt of ['picker', 'editor']) {
    await act(async () => h.current.edit(original.foods[0]));
    await act(async () => h.current.suggestionLinking.onOpenPicker());
    assert.equal(h.current.suggestionLinking.selectedSuggestionId, '31');
    await act(async () => h.current.suggestionLinking.onSelectSuggestion('32'));
    assert.equal(h.current.suggestionLinking.selectedSuggestionId, '32');
    if (cancelAt === 'picker') {
      await act(async () => h.current.suggestionLinking.onClosePicker());
    } else {
      await act(async () => h.current.suggestionLinking.onLink('rice'));
      assert.deepEqual(h.current.draft.editingSuggestionLink, link(1, 'rice'));
      await act(async () => h.current.cancelEdit());
      await act(async () => h.current.edit(original.foods[0]));
    }
    assert.equal(h.current.suggestionLinking.pickerOpen, false);
    assert.deepEqual(h.current.draft.editingSuggestionLink, link(0, 'rice'));
    await act(async () => h.current.suggestionLinking.onOpenPicker());
    assert.equal(h.current.suggestionLinking.pickerOpen, true);
    assert.equal(h.current.suggestionLinking.selectedSuggestionId, '31');
    // 다시 선택하지 않고 연결해도 취소했던 추천이 적용되지 않아야 한다.
    await act(async () => h.current.suggestionLinking.onLink('rice'));
    assert.deepEqual(h.current.draft.editingSuggestionLink, link(0, 'rice'));
    await act(async () => h.current.saveFood());
    await expectStored(h, original);
  }
});

test('새 음식 편집을 취소하면 음식과 임시 연결이 남지 않고 기존 음식의 연결은 유지된다', async t => {
  const original = linkingDraft([link(0, 'rice')]);
  const h = await start(t, original);
  for (const close of ['cancelEdit', 'back']) {
    await act(async () => h.current.edit());
    const newId = h.current.draft.editingFood.id;
    await select(h, '31');
    assert.deepEqual(h.current.draft.editingSuggestionLink, link(0, newId));
    await act(async () => h.current[close]());
    await expectStored(h, original);
  }
});

test('다른 음식의 추천을 저장하면 이전 연결과 대상 음식의 기존 연결을 제거하고 새 음식에만 연결한다', async t => {
  const original = linkingDraft([link(0, 'rice'), link(1, 'soup')]);
  const h = await start(t, original);
  await act(async () => h.current.edit(original.foods[1]));
  await select(h, '31');
  assert.deepEqual(h.current.draft.suggestionLinks, original.suggestionLinks);
  await act(async () => h.current.saveFood());
  await expectStored(h, { ...original, suggestionLinks: [link(0, 'soup')] });
});

test('음식 카드에서 추천을 해제하면 해당 연결만 제거하고 음식과 다른 연결은 유지한다', async t => {
  const original = linkingDraft([link(0, 'rice'), link(1, 'soup')]);
  const h = await start(t, original);
  await act(async () => h.current.suggestionLinking.onUnlink('31'));
  await expectStored(h, { ...original, suggestionLinks: [link(1, 'soup')] });
});
