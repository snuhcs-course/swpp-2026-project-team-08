// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식 이름 검증·공백 정리·같은 이름의 개별 항목 추가 규칙 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? {
    pickMealPhoto() { throw new Error('음식 추가에서 사진 선택을 요청해서는 안 된다'); },
    PhotoError: class extends Error {},
  } : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { photoDraft } = require('../../fixtures/meal-photo.cjs');
beforeEach(() => values.clear());

async function start(t) {
  await saveMealDraft({ ...photoDraft(), step: 'foods' });
  const h = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => !!h.current.draft);
  await act(async () => h.current.continueDraft());
  return h;
}

test('빈 이름이나 공백뿐인 이름으로 저장을 요청하면 음식 목록과 작성 중 입력을 유지한다', async t => {
  const h = await start(t);
  await act(async () => h.current.edit());
  for (const name of ['', ' \t\n\u3000 ']) {
    await act(async () => h.current.changeFood({ name }));
    const before = structuredClone(h.current.draft);
    // 버튼 상태가 아니라 UI를 거치지 않은 저장 요청의 방어를 검사한다.
    await act(async () => h.current.saveFood());
    assert.deepEqual(h.current.draft, before);
  }
});

test('음식의 이름을 입력하고 저장하면 앞뒤 공백을 제거해 추가하고, 편집창 상태를 비운다', async t => {
  const h = await start(t);
  const original = structuredClone(h.current.draft);
  await act(async () => h.current.edit());
  const id = h.current.draft.editingFood.id;
  await act(async () => h.current.changeFood({ name: '  우리집  국 \t' }));
  await act(async () => h.current.saveFood());
  assert.deepEqual(h.current.draft, { ...original,
    foods: [...original.foods, { id, name: '우리집  국', ingredients: [], preparation: '',
      servingNote: '', source: 'parent', confirmed: true }],
    editingFood: null, editingSuggestionLink: null });
});

test('같은 이름의 음식을 두 번 추가하면 서로 다른 ID로 보관하고 기존 음식을 덮어쓰지 않는다', async t => {
  const h = await start(t);
  const original = structuredClone(h.current.draft.foods);
  const ids = [];
  for (let index = 0; index < 2; index++) {
    await act(async () => h.current.edit());
    ids.push(h.current.draft.editingFood.id);
    await act(async () => h.current.changeFood({ name: 'Rice' }));
    await act(async () => h.current.saveFood());
  }
  assert.notEqual(ids[0], ids[1]);
  assert.deepEqual(h.current.draft.foods.slice(0, original.length), original);
  assert.deepEqual(h.current.draft.foods.slice(original.length), ids.map(id => ({
    id, name: 'Rice', ingredients: [], preparation: '', servingNote: '',
    source: 'parent', confirmed: true,
  })));
});
