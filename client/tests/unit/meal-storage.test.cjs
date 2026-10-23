// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../helpers/register.cjs');

const { completeDraft } = require('../fixtures/meal-checkin.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');

const { values, storage, failNextWrite } = createMemoryStorage();

const { mockModules } = require('../helpers/mock-modules.cjs');

mockModules((name) => { return name === '@react-native-async-storage/async-storage' ? storage : undefined; });

const { mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');

const { newFood } = require('../../src/rules/foodDraft.ts');

const { isDraft } = require('../../src/data/storage/mealValidation.ts');

const { readMealDraft, saveMealDraft, readMeals } = require('../../src/data/storage/mealStorage.ts');

test('autosaves are ordered, recover edits and migrate interrupted legacy analysis safely', async () => {
  const draft = completeDraft('autosave');
  await Promise.all([saveMealDraft({ ...draft, step: 'details' }), saveMealDraft({ ...draft, step: 'foods', editingFood: { ...newFood(), name: 'Typing' } })]);
  assert.equal((await readMealDraft('autosave')).editingFood.name, 'Typing');
  await saveMealDraft({ ...draft, photo: { id: 'photo', uri: 'file:///photo.png', mimeType: 'image/png' }, step: 'analyzing' });
  assert.equal((await readMealDraft('autosave')).step, 'foods');
  failNextWrite('nurturebites.meal-draft.autosave.v1'); await assert.rejects(saveMealDraft(draft)); await saveMealDraft(draft);
  assert.equal((await readMealDraft('autosave')).id, draft.id);
});

test('new food is blank and unconfirmed legacy photo fixtures cannot become caregiver foods', async () => {
  const fresh = newFood();
  assert.equal(fresh.name, ''); assert.deepEqual(fresh.ingredients, []);
  assert.equal(fresh.preparation, ''); assert.equal(fresh.servingNote, '');
  assert.equal(fresh.acceptance ?? null, null); assert.equal(fresh.source, 'parent');
  assert.equal(fresh.confirmed, false);
  assert.throws(() => mealFromDraft({ ...completeDraft('unconfirmed-parent'), foods: [{ ...fresh, name: 'Rice' }] }));
  const draft = completeDraft('legacy-manual');
  const ai = { ...newFood(), id: 'legacy-ai', name: 'Rolled omelet', source: 'ai' };
  const confirmedAI = { ...ai, id: 'confirmed-ai', confirmed: true };
  draft.foods.push(ai, confirmedAI); draft.editingFood = ai;
  draft.suggestionLinks = [{ suggestionId: 'old', foodId: ai.id, title: 'Old', description: 'Old link' }];
  await saveMealDraft(draft);
  const restored = await readMealDraft(draft.childId);
  assert.deepEqual(restored.foods.map((food) => food.id), [draft.foods[0].id, confirmedAI.id]);
  assert.equal(restored.editingFood, null); assert.deepEqual(restored.suggestionLinks, []);
});

test('legacy origin becomes provenance while explicit confirmation is preserved', async () => {
  const draft = completeDraft('legacy-provenance');
  const { confirmed, ...legacy } = draft.foods[0];
  const legacyFood = { ...legacy, source: 'parent', origin: 'ai' };
  values.set(`nurturebites.meal-draft.${draft.childId}.v1`, JSON.stringify({ ...draft, foods: [legacyFood] }));
  const expected = { ...draft.foods[0], source: 'ai', confirmed: true };
  assert.deepEqual((await readMealDraft(draft.childId)).foods, [expected]);
  const meal = mealFromDraft({ ...draft, foods: [expected] });
  values.set(`nurturebites.meals.${draft.childId}.v1`, JSON.stringify([{ ...meal, foods: [legacyFood] }]));
  assert.deepEqual(await readMeals(draft.childId), [meal]);
  const unconfirmed = { ...legacyFood, confirmed: false };
  values.set(`nurturebites.meal-draft.${draft.childId}.v1`, JSON.stringify({ ...draft, foods: [unconfirmed] }));
  assert.deepEqual((await readMealDraft(draft.childId)).foods, []);
});

test('legacy completed receipts preserve confirmed records even when their source was AI', async () => {
  const draft=completeDraft('legacy-receipt');
  draft.step='complete'; draft.savedMealId=draft.id;
  draft.foods=[{...draft.foods[0],source:'ai'}];
  await saveMealDraft(draft);
  assert.deepEqual((await readMealDraft(draft.childId)).foods,draft.foods);
});

test('legacy goal drafts and receipts retain meals while discarding retired data', async () => {
  const child = 'retired-goal';
  const draft = completeDraft(child);
  values.set(`nurturebites.meal-draft.${child}.v1`, JSON.stringify({
    ...draft, step: 'goal', exposureFoodId: draft.foods[0].id,
  }));
  const restored = await readMealDraft(child);
  assert.equal(restored.step, 'foods');
  assert.deepEqual(restored.foods, draft.foods);
  assert.equal(Object.hasOwn(restored, 'exposureFoodId'), false);
  const meal = mealFromDraft(restored);
  values.set(`nurturebites.meals.${child}.v1`, JSON.stringify([{ ...meal, exposureFoodId: draft.foods[0].id }]));
  assert.deepEqual(await readMeals(child), [meal]);
  values.set(`nurturebites.meal-draft.${child}.v1`, JSON.stringify({
    ...draft, step: 'complete', savedMealId: meal.id, exposureFoodId: draft.foods[0].id,
  }));
  const receipt = await readMealDraft(child);
  assert.equal(receipt.savedMealId, meal.id);
  assert.equal(Object.hasOwn(receipt, 'exposureFoodId'), false);
  const { readHomeRecords } = require('../../src/data/storage/homeStorage.ts');
  values.set(`nurturebites.home.${child}.v1`, JSON.stringify({ meals: [], suggestions: [], exposures: [{ stage: 'touched' }] }));
  assert.deepEqual(await readHomeRecords(child), { meals: [], suggestions: [] });
});

test('retired food history is removed from legacy drafts, editors, receipts and meals', async () => {
  const draft = completeDraft('retired-food-history');
  const food = { ...draft.foods[0], history: 'usually' };
  const editor = { ...food, name: 'Editing rice', history: 'sometimes' };
  values.set(`nurturebites.meal-draft.${draft.childId}.v1`, JSON.stringify({ ...draft, foods: [food], editingFood: editor }));
  const loaded = await readMealDraft(draft.childId);
  assert.deepEqual(loaded.foods, draft.foods);
  assert.deepEqual(loaded.editingFood, { ...draft.foods[0], name: 'Editing rice' });
  assert.equal(isDraft({ ...draft, foods: draft.foods }, draft.childId), true);
  const meal = mealFromDraft(draft);
  values.set(`nurturebites.meals.${draft.childId}.v1`, JSON.stringify([{ ...meal, foods: [food] }]));
  assert.deepEqual(await readMeals(draft.childId), [meal]);
  values.set(`nurturebites.meal-draft.${draft.childId}.v1`, JSON.stringify({ ...draft, step: 'complete', savedMealId: meal.id, foods: [food] }));
  assert.deepEqual((await readMealDraft(draft.childId)).foods, draft.foods);
  assert.equal(Object.hasOwn(newFood(), 'history'), false);
});

test('legacy food traits are removed from meals, drafts and editor data', async () => {
  const draft = completeDraft('retired-traits');
  const legacyFood = { ...draft.foods[0], traits: { texture: ['soft'] } };
  values.set(`nurturebites.meal-draft.${draft.childId}.v1`, JSON.stringify({ ...draft, foods: [legacyFood], editingFood: legacyFood }));
  const restored = await readMealDraft(draft.childId);
  assert.deepEqual(restored.foods, draft.foods);
  assert.deepEqual(restored.editingFood, draft.foods[0]);
  const meal = mealFromDraft(draft);
  values.set(`nurturebites.meals.${draft.childId}.v1`, JSON.stringify([{ ...meal, foods: [legacyFood] }]));
  assert.deepEqual(await readMeals(draft.childId), [meal]);
  assert.equal(Object.hasOwn(newFood(), 'traits'), false);
});
