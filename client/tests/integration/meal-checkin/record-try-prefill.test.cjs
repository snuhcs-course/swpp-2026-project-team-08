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
// Changed: Record a Try의 음식 편집창 자동 연결·늦은 응답 검증 분리
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {};
});
const { newDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { saveMealDraft, readMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
beforeEach(t => {
  values.clear();
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected HTTP request'); });
});

test('Record a Try로 시작한 새 음식 편집창에는 해당 추천이 채워지고 음식 카드에는 아직 연결되지 않는다', async (t) => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'), { props: [suggestion] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  assert.deepEqual(harness.current.draft.editingSuggestionLink, {
    suggestionId: '31',
    foodId: harness.current.draft.editingFood.id,
    title: 'Try less',
    description: 'Keep it separate',
    servingTip: 'No pressure',
  });
  assert.deepEqual((await readMealDraft('1')).editingSuggestionLink,
    harness.current.draft.editingSuggestionLink);
});

test('Record a Try의 추천 목록이 늦게 도착하면 열려 있는 새 음식 편집창에 해당 추천이 채워진다', async (t) => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'), { props: [] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  await act(async () => { await harness.rerender([suggestion]); });
  assert.equal(harness.current.draft.editingSuggestionLink.suggestionId, '31');
  assert.equal(harness.current.draft.editingSuggestionLink.foodId, harness.current.draft.editingFood.id);
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
});

test('Record a Try의 추천을 첫 음식에 저장한 뒤 두 번째 음식을 추가해도 첫 음식의 연결을 유지한다', async (t) => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'), { props: [suggestion] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  const firstId = harness.current.draft.editingFood.id;
  await act(async () => harness.current.changeFood({ name: 'Rice' }));
  await act(async () => harness.current.saveFood());
  await act(async () => harness.current.edit());
  assert.equal(harness.current.draft.suggestionLinks.length, 1);
  assert.equal(harness.current.draft.suggestionLinks[0].foodId, firstId);
});

test('추천을 직접 선택한 뒤 Record a Try 응답이 도착해도 직접 선택한 추천을 유지한다', async t => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const incoming = { id: '31', title: 'Incoming', description: 'Try less' };
  const manual = { id: '32', title: 'Selected', description: 'Keep it separate' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'),
    { props: [manual] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('32'));
  await act(async () => harness.current.suggestionLinking.onLink(harness.current.draft.editingFood.id));
  await harness.rerender([incoming, manual]);
  assert.equal(harness.current.draft.editingSuggestionLink.suggestionId, '32');
  assert.equal((await readMealDraft('1')).editingSuggestionLink.suggestionId, '32');
});
