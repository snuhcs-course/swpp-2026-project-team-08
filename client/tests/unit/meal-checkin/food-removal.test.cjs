// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식 ID별 삭제·Undo 복원 및 마지막 삭제만 되돌리는 규칙 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? {
    pickMealPhoto() { throw new Error('음식 삭제에서 사진 선택을 요청해서는 안 된다'); },
    PhotoError: class extends Error {},
  } : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { removalDraft } = require('../../fixtures/meal-food-removal.cjs');
beforeEach(() => values.clear());

async function start(t, draft) {
  await saveMealDraft(draft);
  const h = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => !!h.current.draft);
  await act(async () => h.current.continueDraft());
  return h;
}

test('음식을 삭제하면 해당 음식과 추천 연결만 제거하고 같은 이름의 다른 음식은 유지한다', async t => {
  const original = removalDraft();
  original.foods[1].name = original.foods[0].name;
  const h = await start(t, original);
  await act(async () => h.current.removeFood('soup'));
  assert.deepEqual(h.current.draft, { ...original, foods: [original.foods[0], original.foods[2]],
    suggestionLinks: [original.suggestionLinks[0]] });
});

test('Undo하면 삭제한 음식이 같은 ID와 원래 순서로 돌아오고 재료·조리법·설명·수용도·추천 연결이 복원된다', async t => {
  const original = removalDraft();
  const h = await start(t, original);
  await act(async () => h.current.removeFood('soup'));
  assert.deepEqual(h.current.draft.foods.map(food => food.id), ['rice', 'apple']);
  await act(async () => h.current.undoRemove());
  assert.deepEqual(h.current.draft, original);
  assert.equal(h.current.removed, null);
});

test('음식을 연속해서 삭제한 뒤 Undo하면 마지막으로 삭제한 음식만 복원한다', async t => {
  const original = removalDraft();
  const h = await start(t, original);
  await act(async () => h.current.removeFood('rice'));
  await act(async () => h.current.removeFood('soup'));
  assert.deepEqual(h.current.draft.foods.map(food => food.id), ['apple']);
  await act(async () => h.current.undoRemove());
  const expected = { ...original, foods: [original.foods[1], original.foods[2]],
    suggestionLinks: [original.suggestionLinks[1]] };
  assert.deepEqual(h.current.draft, expected);
  assert.equal(h.current.removed, null);
});
