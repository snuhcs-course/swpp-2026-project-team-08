// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty autosave, food editing, failure and server restoration
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 리뷰 요청의 대문자 outcome 과 식사 상세 응답 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 재료 난이도 테스트를 서버 난이도 값과 식사 상세 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: Add 없이 입력한 음식·재료 사유의 저장 실패·재시도·복원 검증
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 및 Record a Try 미리 채움 검증
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 편집 추천의 저장·취소·복원과 자동 연결 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 일반 추천 연결·취소·저장 검증을 행동별 테스트로 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 새 음식·추천 연결의 초안 저장 실패·재개 검증 분리
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values, failNextWrite } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {};
});
const { newDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../../src/rules/foodDraft.ts');
const { saveMealDraft, readMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
beforeEach(t => {
  values.clear();
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected HTTP request'); });
});
async function linkingHarness(t) {
  const firstFood = { ...newFood(), confirmed: true, id: 'rice', name: 'Rice' };
  const secondFood = { ...newFood(), confirmed: true, id: 'soup', name: 'Soup' };
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [firstFood, secondFood] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions), { props: [suggestion] });
  await waitFor(() => harness.current.draft !== null);
  return { harness };
}

test('새 음식의 자동 저장 실패 후 재시도하고 다시 열면 작성한 이름·추천 연결이 복원되며 Save food로 목록에 반영된다', async t => {
  const { harness } = await linkingHarness(t);
  await act(async () => harness.current.edit());
  const foodId = harness.current.draft.editingFood.id;
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
  await act(async () => harness.current.suggestionLinking.onLink(foodId));
  failNextWrite('nurturebites.meal-draft.1.v1');
  await act(async () => harness.current.changeFood({ name: 'Typed after linking' }));
  await waitFor(() => harness.current.saveStatus === 'error');
  assert.equal(harness.current.draft.editingFood.name, 'Typed after linking');
  await act(async () => assert.equal(await harness.current.flush(), true));
  const restored = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => restored.current.draft !== null);
  assert.equal(restored.current.draft.editingFood.name, 'Typed after linking');
  assert.equal(restored.current.draft.editingSuggestionLink.foodId, foodId);
  assert.deepEqual(restored.current.draft.suggestionLinks ?? [], []);
  await act(async () => restored.current.saveFood());
  const saved = await readMealDraft('1');
  assert.equal(saved.foods.find(food => food.id === foodId).name, 'Typed after linking');
  assert.equal(saved.suggestionLinks[0].suggestionId, '31');
  assert.equal(saved.suggestionLinks[0].foodId, foodId);
  assert.equal(saved.editingSuggestionLink, null);
});
