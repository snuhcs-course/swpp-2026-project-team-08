// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename,
);

const values = new Map();
let saveRemoteReview;
let pickPhoto;
let meal;
let slots;
let cursor;
let effects;
const queryClient = { setQueryData() {}, invalidateQueries() {} };
// Run the production Hook with deterministic state, effects, and deferred device calls.
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], (value) => {
      slots[index] = typeof value === 'function' ? value(slots[index]) : value;
    }];
  },
  useRef(initial) {
    const index = cursor++;
    return slots[index] ?? (slots[index] = { current: initial });
  },
  useCallback(callback) { cursor++; return callback; },
  useEffect(effect, dependencies) {
    const index = cursor++;
    if (!slots[index] || dependencies.some((value, i) => value !== slots[index][i])) {
      slots[index] = dependencies;
      effects.push(effect);
    }
  },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
  if (name === 'react') return react;
  if (name === '@tanstack/react-query') return {
    useQueryClient: () => queryClient,
    useMutation: (options) => ({ ...options, mutateAsync: options.mutationFn, isPending: false }),
  };
  if (name === '../api/mealLogApi') return { saveMealReview: (...args) => saveRemoteReview(...args) };
  if (name === './homeQueries') return { homeKeys: { byChild: (id) => ['home', id] } };
  if (name === './mealLogQueries') return { mealLogKeys: { all: (id) => ['meal-log', id] } };
  if (name.endsWith('/mealQueries')) return {
    mealKeys: require('../src/data/queries/mealQueryKeys.ts').mealKeys,
    useSaveMeal: () => ({ isPending: false }),
    useMeal: () => ({ data: meal, isSuccess: true }),
    useUpdateMealFoods: () => ({ isPending: false }),
  };
  if (name.endsWith('/mealPhotoPicker')) return {
    pickMealPhoto: (...args) => pickPhoto(...args), PhotoError: class PhotoError extends Error {},
  };
  return originalLoad.call(this, name, ...args);
};

const { newDraft, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { saveMeal, saveMealDraft, readMealDraft } = require('../src/data/storage/mealStorage.ts');
const { readHomeMeals } = require('../src/data/storage/homeMealStorage.ts');
const { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft } = require('../src/data/storage/afterMealReviewStorage.ts');
const { newReviewDraft, reviewFromDraft, setOutcome } = require('../src/features/after-meal-review/rules.ts');
const { useSaveAfterMealReview } = require('../src/data/queries/afterMealReviewQueries.ts');
const { useAfterMealReview } = require('../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const { useMealCheckin } = require('../src/features/meal-checkin/hooks/useMealCheckin.ts');

function createMeal(childId) {
  return mealFromDraft({ ...newDraft(childId), mealType: 'lunch', setting: 'home',
    foods: [{ ...newFood(), confirmed: true, id: 'rice', name: 'Rice' }] });
}

test('failed server save stays pending on Home and restores editable answers until retry succeeds', async () => {
  values.clear();
  const savedMeal = createMeal('retry-review');
  await saveMeal(savedMeal);
  const draft = { ...newReviewDraft(savedMeal), step: 'difficulties' };
  draft.outcomes = setOutcome(draft.outcomes, 'rice', 'tasted');
  await saveAfterMealDraft(draft);
  const review = reviewFromDraft(draft, savedMeal);
  saveRemoteReview = async () => { throw new Error('Network unavailable'); };
  const mutation = useSaveAfterMealReview();
  await assert.rejects(mutation.mutateAsync(review), /Network unavailable/);
  assert.equal(await readAfterMealReview(savedMeal.childId, savedMeal.id), null);
  assert.equal((await readHomeMeals(savedMeal.childId))[0].reviewed, false);
  const restored = await readAfterMealDraft(savedMeal.childId, savedMeal.id);
  assert.equal(restored.step, 'difficulties');
  assert.equal(restored.outcomes[0].decision.confirmed, 'tasted');
  saveRemoteReview = async (value) => { assert.equal(value.mealId, savedMeal.id); };
  await mutation.mutateAsync(review);
  assert.equal((await readHomeMeals(savedMeal.childId))[0].reviewed, true);
  assert.equal((await readAfterMealDraft(savedMeal.childId, savedMeal.id)).step, 'complete');
});

test('skipping a delayed photo ignores its result without cancelling a newer photo selection', async () => {
  values.clear();
  slots = []; cursor = 0; effects = [];
  meal = createMeal('skip-photo');
  const profile = { id: meal.childId };
  const ReviewHarness = () => {
    cursor = 0;
    const result = useAfterMealReview(profile, meal.id);
    for (const effect of effects.splice(0)) effect();
    return result;
  };
  ReviewHarness();
  await new Promise((resolve) => setImmediate(resolve));
  let model = ReviewHarness();
  let releaseOld;
  pickPhoto = () => new Promise((resolve) => { releaseOld = resolve; });
  const oldPick = model.pick('gallery');
  model.manual();
  model.chooseOutcome('rice', 'eaten');
  model = ReviewHarness();
  assert.equal(model.draft.step, 'outcomes');
  assert.equal(model.picking, false);
  let releaseNew;
  pickPhoto = () => new Promise((resolve) => { releaseNew = resolve; });
  const newPick = model.pick('gallery');
  releaseOld({ id: 'old', uri: 'file:///old.png', mimeType: 'image/png' });
  await oldPick;
  model = ReviewHarness();
  assert.equal(model.draft.step, 'outcomes');
  assert.equal(model.draft.afterPhoto, null);
  assert.equal(model.draft.outcomes[0].decision.confirmed, 'eaten');
  assert.equal(model.picking, true);
  releaseNew({ id: 'new', uri: 'file:///new.png', mimeType: 'image/png' });
  await newPick;
  model = ReviewHarness();
  assert.equal(model.draft.afterPhoto.id, 'new');
  assert.equal(model.picking, false);
});

// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
test('meal check-in Hook owns linking, cancellation, editing return, and unlinking', async () => {
  values.clear();
  slots = []; cursor = 0; effects = [];
  const firstFood = { ...newFood(), confirmed: true, id: 'rice', name: 'Rice' };
  const secondFood = { ...newFood(), confirmed: true, id: 'soup', name: 'Soup' };
  const draft = { ...newDraft('linking'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [firstFood, secondFood] };
  await saveMealDraft(draft);
  const suggestion = { id: 'saved-idea', title: 'Try a smaller portion', description: 'Keep it separate', servingTip: 'No pressure' };
  let suggestions = [suggestion];
  const CheckinHarness = () => {
    cursor = 0;
    const result = useMealCheckin(draft.childId, undefined, false, suggestions);
    for (const effect of effects.splice(0)) effect();
    return result;
  };
  CheckinHarness();
  await new Promise((resolve) => setImmediate(resolve));
  let model = CheckinHarness();
  const openSelection = () => {
    model.suggestionLinking.onOpen();
    model = CheckinHarness();
    model.suggestionLinking.onSelectSuggestion(suggestion.id);
    model = CheckinHarness();
    model.suggestionLinking.onContinue();
    model = CheckinHarness();
  };

  openSelection();
  assert.equal(model.suggestionLinking.step, 2);
  assert.equal(model.suggestionLinking.canContinue, false);
  model.suggestionLinking.onBack();
  model = CheckinHarness();
  model.suggestionLinking.onBack();
  model = CheckinHarness();
  assert.equal(model.suggestionLinking.step, 0);
  assert.deepEqual(model.draft.suggestionLinks ?? [], []);

  openSelection();
  model.suggestionLinking.onSelectFood(firstFood.id);
  model = CheckinHarness();
  model.edit(firstFood);
  model = CheckinHarness();
  assert.equal(model.suggestionLinking.step, 0);
  model.changeFood({ name: 'Edited rice' });
  model.saveFood();
  model = CheckinHarness();
  model = CheckinHarness();
  assert.equal(model.suggestionLinking.step, 2);
  assert.equal(model.suggestionLinking.selectedFoodId, firstFood.id);
  assert.equal(model.draft.foods[0].name, 'Edited rice');
  model.edit(firstFood);
  model = CheckinHarness();
  model.update({ editingFood: null });
  model = CheckinHarness();
  model = CheckinHarness();
  assert.equal(model.suggestionLinking.step, 2);
  assert.equal(model.draft.foods[0].name, 'Edited rice');
  model.suggestionLinking.onContinue();
  model = CheckinHarness();
  await model.flush();
  assert.deepEqual((await readMealDraft(draft.childId)).suggestionLinks, [{
    suggestionId: suggestion.id, foodId: firstFood.id, title: suggestion.title,
    description: suggestion.description, servingTip: suggestion.servingTip,
  }]);

  openSelection();
  model.suggestionLinking.onSelectFood(secondFood.id);
  model = CheckinHarness();
  model.suggestionLinking.onContinue();
  model = CheckinHarness();
  assert.equal(model.draft.suggestionLinks.length, 1);
  assert.equal(model.draft.suggestionLinks[0].foodId, secondFood.id);
  model.suggestionLinking.onUnlink(suggestion.id);
  model = CheckinHarness();
  assert.deepEqual(model.draft.suggestionLinks, []);

  openSelection();
  model.suggestionLinking.onSelectFood(secondFood.id);
  model.removeFood(secondFood.id);
  model = CheckinHarness();
  assert.equal(model.suggestionLinking.canContinue, false);
  model.suggestionLinking.onContinue();
  model = CheckinHarness();
  assert.deepEqual(model.draft.suggestionLinks, []);
  suggestions = [];
  model = CheckinHarness();
  assert.equal(model.suggestionLinking.selectedSuggestion, undefined);
  assert.equal(model.suggestionLinking.canContinue, false);
  model.suggestionLinking.onContinue();
  await model.flush();
  assert.deepEqual((await readMealDraft(draft.childId)).suggestionLinks, []);
});
