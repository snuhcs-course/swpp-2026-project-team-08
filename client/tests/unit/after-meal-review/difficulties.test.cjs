// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 어려움 추가 경계·복수와 단일 값·중복·입력 초기화·대상별 삭제 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {};
  if (name === 'react-native') return { View: 'view', Text: 'text', StyleSheet: { create: s => s } };
  if (name.endsWith('/DifficultyEditor')) return { DifficultyEditor: () => null };
});
const { difficultyFixture } = require('../../fixtures/after-meal-difficulties.cjs');
const { canAddDifficulty, addDifficulty, difficultyTargets } = require('../../../src/features/after-meal-review/rules.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const { AfterMealDifficultiesView } = require('../../../src/features/after-meal-review/screens/AfterMealDifficultiesView.tsx');
const { saveAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');

const multiCases = [
  { category: 'texture', first: ['hard', 'hardness'], second: ['dry', 'moisture'] },
  { category: 'tasteType', first: ['sweet'], second: ['salty'] },
  { category: 'color', first: ['red'], second: ['yellow'] },
];
const singleCases = [
  ['smell', 'fruit', 'mint'], ['temperature', 'hot', 'warm'],
  ['pieceSize', 'fine', 'large'], ['arrangement', 'even', 'clustered'],
];
beforeEach(() => values.clear());
async function start(t, fixture) {
  await saveAfterMealDraft(fixture.draft);
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    assert.equal(init.method ?? 'GET', 'GET');
    return Response.json(fixture.response);
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  return h;
}
function editor(h, targetId) {
  const state = h.current;
  const view = AfterMealDifficultiesView({ p: {
    meal: state.meal, draft: state.draft, language: 'en',
    difficultyTargets: difficultyTargets(state.meal.foods, state.draft.outcomes), difficultyForms: {},
    onDifficultyInput: state.setDifficultyInput, onAddDifficulty: state.addDifficultyTag,
    onRemoveDifficulty: state.removeDifficultyTag,
  } });
  return view.props.children[1].find(element => element.key === targetId).props;
}

test('카테고리나 값이 없으면 어려움 추가 가능 여부는 false이다', () => {
  for (const [category, value] of [[null, ''], [null, 'red'], ['color', '']]) {
    assert.equal(canAddDifficulty(category, value, ''), false);
  }
  assert.equal(canAddDifficulty('color', 'red', ''), true);
});

test('Texture의 세부 항목이 없거나 해당 항목에 속하지 않는 값이면 추가 가능 여부는 false이다', () => {
  for (const [aspect, value] of [['', 'hard'], ['moisture', 'hard'], ['hardness', '']]) {
    assert.equal(canAddDifficulty('texture', value, '', aspect), false);
  }
  assert.equal(canAddDifficulty('texture', 'hard', '', 'hardness'), true);
});

test('Other의 직접 입력이 빈 문자열이나 공백이면 추가 가능 여부는 false이고 문구가 있으면 true이다', () => {
  for (const category of ['color', 'arrangement']) {
    for (const note of ['', ' \t\n\u3000 ']) assert.equal(canAddDifficulty(category, 'other', note), false);
    assert.equal(canAddDifficulty(category, 'other', '  보라색 소스  '), true);
  }
});

test('Texture·맛·색에 서로 다른 값을 추가한 결과는 기존 값과 새 값을 모두 포함한다', () => {
  for (const { category, first, second } of multiCases) {
    const tags = addDifficulty([], category, first[0], '', first[1]);
    const before = structuredClone(tags);
    const result = addDifficulty(tags, category, second[0], '', second[1]);
    assert.deepEqual(result[0], before[0]);
    assert.deepEqual(result.map(tag => [tag.category, tag.subcategory ?? null, tag.value]), [
      [category, first[1] ?? null, first[0]], [category, second[1] ?? null, second[0]],
    ]);
    assert.deepEqual(tags, before);
  }
});

test('냄새·온도·크기·배치에 새 값을 추가한 결과는 같은 카테고리의 이전 값만 교체한다', () => {
  const unrelated = addDifficulty([], 'color', 'yellow');
  for (const [category, first, next] of singleCases) {
    const tags = addDifficulty(unrelated, category, first);
    const result = addDifficulty(tags, category, next);
    assert.deepEqual(result[0], unrelated[0]);
    assert.deepEqual(result.map(tag => [tag.category, tag.value]), [['color', 'yellow'], [category, next]]);
  }
});

test('같은 어려움을 두 번 추가한 결과는 태그 하나이다', () => {
  for (const [category, value, note, aspect] of [
    ['color', 'red', ''], ['color', 'other', '보라색'], ['texture', 'hard', '', 'hardness'], ['smell', 'mint', ''],
  ]) {
    const once = addDifficulty([], category, value, note, aspect);
    assert.equal(once.length, 1);
    assert.deepEqual(addDifficulty(once, category, value, note, aspect), once);
  }
});

test('카테고리나 Texture 세부 항목을 변경한 결과는 작성 중 값이 비어 있고 추가한 태그는 같다', async t => {
  const fixture = difficultyFixture();
  fixture.draft.difficulties['1'] = addDifficulty([], 'color', 'red');
  fixture.draft.difficultyInputs['1'] = { category: 'color', value: 'other', note: '보라색', subcategory: '' };
  fixture.draft.difficultyInputs[fixture.carrotId] = { category: 'smell', value: 'mint', note: '' };
  const h = await start(t, fixture);
  await act(async () => editor(h, '1').onCategory('texture'));
  assert.deepEqual(h.current.draft.difficultyInputs['1'], { category: 'texture', value: '', note: '', subcategory: '' });
  await act(async () => editor(h, '1').onSubcategory('hardness'));
  await act(async () => editor(h, '1').onValue('hard'));
  await act(async () => editor(h, '1').onSubcategory('moisture'));
  assert.deepEqual(h.current.draft.difficultyInputs['1'], { category: 'texture', value: '', note: '', subcategory: 'moisture' });
  assert.deepEqual(h.current.draft.difficulties, fixture.draft.difficulties);
  assert.deepEqual(h.current.draft.difficultyInputs[fixture.carrotId], fixture.draft.difficultyInputs[fixture.carrotId]);
});

test('한 대상의 태그를 삭제한 결과는 해당 태그만 없고 다른 음식·재료의 태그는 같다', async t => {
  const fixture = difficultyFixture();
  const red = addDifficulty([], 'color', 'red');
  fixture.draft.difficulties = { '1': addDifficulty(red, 'color', 'yellow'), '2': structuredClone(red), [fixture.carrotId]: structuredClone(red) };
  fixture.draft.difficultyInputs['1'] = { category: 'smell', value: 'mint', note: '' };
  const h = await start(t, fixture);
  await act(async () => h.current.removeDifficultyTag('1', red[0].id));
  assert.deepEqual(h.current.draft.difficulties, { ...fixture.draft.difficulties, '1': [fixture.draft.difficulties['1'][1]] });
  assert.deepEqual(h.current.draft.difficultyInputs, fixture.draft.difficultyInputs);
  assert.deepEqual(h.current.draft.outcomes, fixture.draft.outcomes);
});
