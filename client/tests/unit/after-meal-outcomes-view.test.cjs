// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Unclear-first outcome slider and ingredient review interactions

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules(name => {
  if (name === 'react-native') return { View: 'view', Text: 'text', Pressable: 'pressable', StyleSheet: { create: s => s } };
  if (name === '@expo/vector-icons') return { Ionicons: () => null };
  return undefined;
});
const { FoodOutcomeCard } = require('../../src/features/after-meal-review/components/FoodOutcomeCard.tsx');
const { MealOutcomeSlider } = require('../../src/features/after-meal-review/components/MealOutcomeSlider.tsx');
const { AcceptanceSlider } = require('../../src/components/AcceptanceSlider.tsx');
const { allOutcomesConfirmed, newReviewDraft, setOutcome, toggleIngredient } = require('../../src/features/after-meal-review/rules.ts');
const { savedMeal } = require('../fixtures/after-meal-review.cjs');
const { copyFor } = require('../../src/util/strings.ts');
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

for (const language of ['en', 'ko']) {
  test(`${language}: four choices, repeated selection, dragging and accessible upper boundary`, async t => {
    const m = copyFor(language).afterMealReview;
    const h = await renderHook(t, () => {
      const [value, setValue] = React.useState(null);
      return AcceptanceSlider(MealOutcomeSlider({ value, label: 'Egg', labels: m.outcomes, unsetLabel: m.unanswered, onSelect: setValue }).props);
    });
    const rail = () => h.current.props.children[0].props;
    const options = () => h.current.props.children[1].props.children;
    assert.equal(rail().accessibilityValue.max, 3);
    assert.deepEqual(options().map(n => n.props.accessibilityLabel), [m.outcomes.unclear, m.outcomes.untouched, m.outcomes.tasted, m.outcomes.eaten]);
    assert.equal(rail().accessibilityValue.now, undefined);
    await act(async () => options()[1].props.onPress());
    await act(async () => options()[1].props.onPress());
    assert.equal(rail().accessibilityValue.now, 1);
    await act(async () => rail().onLayout({ nativeEvent: { layout: { width: 300 } } }));
    await act(async () => rail().onResponderGrant({ nativeEvent: { locationX: 295, pageX: 295 } }));
    assert.equal(rail().accessibilityValue.text, m.outcomes.eaten);
    await act(async () => rail().onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
    assert.equal(rail().accessibilityValue.now, 3);
  });
}

test('ingredient cards gate Continue, retain removed answers, and survive collapsing', async t => {
  const meal = savedMeal('cards');
  const m = copyFor('en').afterMealReview;
  const h = await renderHook(t, () => {
    const [outcomes, setOutcomes] = React.useState(newReviewDraft(meal).outcomes);
    return { outcomes, tree: FoodOutcomeCard({ food: meal.foods[0], outcome: outcomes[0], language: 'en', childName: 'Max',
      onEdit() {}, onSelect: (value, id) => setOutcomes(current => setOutcome(current, meal.foods[0].id, value, id)),
      onToggleIngredient: id => setOutcomes(current => toggleIngredient(current, meal.foods[0].id, id)),
    }) };
  });
  const tree = () => elements(h.current.tree);
  const sliders = () => tree().filter(n => n.type === MealOutcomeSlider);
  const toggle = () => tree().find(n => n.props?.accessibilityLabel === m.toggleFood(meal.foods[0].name));
  await act(async () => sliders()[0].props.onSelect('tasted'));
  assert.equal(allOutcomesConfirmed(h.current.outcomes), true);
  await act(async () => tree().find(n => n.props?.accessibilityRole === 'checkbox').props.onPress());
  assert.equal(sliders().length, 2);
  assert.equal(allOutcomesConfirmed(h.current.outcomes), false);
  await act(async () => sliders()[1].props.onSelect('eaten'));
  await act(async () => toggle().props.onPress());
  assert.equal(sliders().length, 0);
  assert.equal(allOutcomesConfirmed(h.current.outcomes), true);
  await act(async () => toggle().props.onPress());
  assert.equal(sliders()[1].props.value, 'eaten');
  const ingredient = h.current.outcomes[0].ingredients[0];
  await act(async () => tree().find(n => n.props?.accessibilityLabel === m.removeIngredientReview(ingredient.name)).props.onPress());
  assert.equal(sliders().length, 1);
  assert.equal(h.current.outcomes[0].ingredients[0].decision.confirmed, 'eaten');
  assert.equal(allOutcomesConfirmed(h.current.outcomes), true);
});

test('unclear answers appear as the final slider choice', () => {
  const m = copyFor('en').afterMealReview;
  const slider = MealOutcomeSlider({ value: 'unclear', label: 'Egg', labels: m.outcomes, unsetLabel: m.unanswered, onSelect() {} });
  assert.equal(slider.props.value, 'unclear');
  assert.equal(slider.props.options[0], m.outcomes.unclear);
});
