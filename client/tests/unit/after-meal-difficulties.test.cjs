// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Separate ingredient difficulty targets, isolation and draft reconciliation
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 제외·단계 건너뛰기 및 기존 카드 숨김 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
const DifficultyEditor = () => null;
mockModules(name => {
  if (name === 'react-native') return { View: 'view', Text: 'text', StyleSheet: { create: s => s } };
  if (name.endsWith('/DifficultyEditor')) return { DifficultyEditor };
  return undefined;
});
const { savedMeal } = require('../fixtures/after-meal-review.cjs');
const { newReviewDraft, setOutcome, toggleIngredient, addDifficulty, difficultyTargets, reconcileDifficultyEntries,
  reconcileOutcomes, reviewFromDraft } = require('../../src/features/after-meal-review/rules.ts');
const { AfterMealDifficultiesView } = require('../../src/features/after-meal-review/screens/AfterMealDifficultiesView.tsx');
const { abcCopyFor } = require('../../src/util/strings.ts');

function setup() {
  const meal = savedMeal('difficulty-targets');
  meal.foods.push({ ...meal.foods[0], id: 'food-2', name: 'Soup', ingredients: ['Carrot'] });
  const draft = newReviewDraft(meal);
  for (const food of draft.outcomes) {
    draft.outcomes = setOutcome(draft.outcomes, food.foodId, 'tasted');
    draft.outcomes = setOutcome(draft.outcomes, food.foodId, 'untouched', food.ingredients[0].id);
  }
  return { meal, draft };
}

for (const language of ['en', 'ko']) {
  test(`${language}: selected ingredients get distinct editors with parent names and target-specific callbacks`, () => {
    const { meal, draft } = setup();
    const id = draft.outcomes[0].ingredients[0].id;
    const tag = addDifficulty([], 'texture', 'firm', '', 'hardness')[0];
    draft.difficulties[id] = [tag];
    draft.difficultyInputs[id] = { category: 'smell', value: 'mint', note: '' };
    const calls = [];
    const tree = AfterMealDifficultiesView({ p: { meal, draft, language,
      difficultyTargets: difficultyTargets(meal.foods, draft.outcomes),
      difficultyForms: { [id]: { options: ['mint', 'fruit'], canAdd: true, showNote: false } },
      onDifficultyInput: (...args) => calls.push(args), onAddDifficulty: (...args) => calls.push(args),
      onRemoveDifficulty: (...args) => calls.push(args),
    } });
    const editors = tree.props.children[1];
    assert.deepEqual(editors.map(n => n.key), ['food-1', id, 'food-2', draft.outcomes[1].ingredients[0].id]);
    const ingredient = editors[1].props;
    assert.equal(ingredient.foodName, abcCopyFor(language).ingredientIn('Carrot', meal.foods[0].name));
    assert.equal(editors[3].props.foodName, abcCopyFor(language).ingredientIn('Carrot', 'Soup'));
    assert.deepEqual(ingredient.tags, [tag]);
    assert.deepEqual(editors[0].props.tags, []);
    assert.equal(ingredient.canAdd, true);
    ingredient.onCategory('texture'); ingredient.onSubcategory('hardness'); ingredient.onValue('hard');
    ingredient.onNote('note'); ingredient.onAdd(); ingredient.onRemove(tag.id);
    assert.ok(calls.every(call => call[0] === id));
    assert.deepEqual(calls.at(-1), [id, tag.id]);
  });
}

test('deselection hides a target and excludes final tags while preserving draft tags for reselection', () => {
  const { meal, draft } = setup();
  const id = draft.outcomes[0].ingredients[0].id;
  draft.difficulties[id] = addDifficulty([], 'smell', 'mint');
  draft.outcomes = toggleIngredient(draft.outcomes, 'food-1', id);
  assert.equal(difficultyTargets(meal.foods, draft.outcomes).some(target => target.id === id), false);
  assert.deepEqual(reconcileDifficultyEntries(draft.difficulties, draft.outcomes), draft.difficulties);
  assert.equal(reviewFromDraft(draft, meal).difficulties[id], undefined);
  draft.outcomes = toggleIngredient(draft.outcomes, 'food-1', id);
  assert.deepEqual(reviewFromDraft(draft, meal).difficulties[id], draft.difficulties[id]);
});

test('editing keeps matching ingredient tags and inputs while removing deleted ingredients and foods', () => {
  const { meal, draft } = setup();
  const [carrot, egg] = draft.outcomes[0].ingredients;
  const otherCarrot = draft.outcomes[1].ingredients[0];
  const entries = { 'food-1': ['food'], [carrot.id]: ['carrot'], [egg.id]: ['egg'],
    'food-2': ['soup'], [otherCarrot.id]: ['other-carrot'] };
  const outcomes = reconcileOutcomes(draft.outcomes, [{ ...meal.foods[0], ingredients: ['Carrot', 'Potato'] }]);
  assert.deepEqual(reconcileDifficultyEntries(entries, outcomes), { 'food-1': ['food'], [carrot.id]: ['carrot'] });
});

test('eaten foods and ingredients are excluded while separately untouched ingredients remain', () => {
  const { meal, draft } = setup();
  const ingredient = draft.outcomes[0].ingredients[0].id;
  draft.difficulties['food-1'] = addDifficulty([], 'smell', 'mint');
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  assert.deepEqual(difficultyTargets(meal.foods, draft.outcomes).map(x => x.id),
    [ingredient, 'food-2', draft.outcomes[1].ingredients[0].id]);
  assert.equal(reviewFromDraft(draft, meal).difficulties['food-1'], undefined);
  for (const food of draft.outcomes) {
    draft.outcomes = setOutcome(draft.outcomes, food.foodId, 'eaten');
    for (const item of food.ingredients.filter(i => i.selected))
      draft.outcomes = setOutcome(draft.outcomes, food.foodId, 'eaten', item.id);
  }
  assert.deepEqual(difficultyTargets(meal.foods, draft.outcomes), []);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted');
  assert.deepEqual(reviewFromDraft(draft, meal).difficulties['food-1'], draft.difficulties['food-1']);
});
