// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
// Exercise production TS with a deterministic AsyncStorage boundary; no RN runtime required.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const values = new Map();
let failedKey = null;
const storage = {
  async getItem(key) { return values.get(key) ?? null; },
  async setItem(key, value) { if (failedKey === key) { failedKey = null; throw new Error('Disk full'); } values.set(key, value); },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) { return name === '@react-native-async-storage/async-storage' ? storage : originalLoad.call(this, name, ...args); };
const { newDraft, confirmFoods, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { validDate } = require('../src/util/date.ts');
const { isDraft } = require('../src/data/storage/mealValidation.ts');
const { readMealDraft, saveMealDraft, readMeals, readMeal, saveMeal } = require('../src/data/storage/mealStorage.ts');
function completeDraft(childId) { return { ...newDraft(childId), mealType: 'lunch', setting: 'home', foods: [{ ...newFood(), name: 'Rice', confirmed: true }], step: 'foods' }; }

test('valid calendar dates', () => {
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2026-02-29'), false); assert.equal(validDate('2026-04-31'), false);
});
test('unconfirmed AI and incomplete/empty meals cannot be saved', () => {
  const draft = completeDraft('rules'); draft.foods[0].source = 'ai'; draft.foods[0].confirmed = false; assert.throws(() => mealFromDraft(draft));
  const foods = confirmFoods(draft.foods); assert.equal(foods[0].id, draft.foods[0].id); assert.equal(draft.foods[0].source, 'ai');
  assert.equal(mealFromDraft({ ...draft, foods }).foods[0].source, 'ai');
  assert.equal(foods[0].confirmed, true);
  assert.equal(draft.foods[0].confirmed, false);
  for (const patch of [{ foods: [] }, { mealType: null }, { setting: null }, { mealDate: '2026-13-01' }]) assert.throws(() => mealFromDraft({ ...draft, foods, ...patch }));
});
test('stored input is validated, including child ownership and duplicate foods', () => {
  const draft = completeDraft('validate'); assert.equal(isDraft(draft, 'validate'), true); assert.equal(isDraft(draft, 'other-child'), false);
  assert.equal(isDraft({ ...draft, foods: [draft.foods[0], draft.foods[0]] }, 'validate'), false);
});
test('autosaves are ordered, recover edits and migrate interrupted legacy analysis safely', async () => {
  const draft = completeDraft('autosave');
  await Promise.all([saveMealDraft({ ...draft, step: 'details' }), saveMealDraft({ ...draft, step: 'foods', editingFood: { ...newFood(), name: 'Typing' } })]);
  assert.equal((await readMealDraft('autosave')).editingFood.name, 'Typing');
  await saveMealDraft({ ...draft, photo: { id: 'photo', uri: 'file:///photo.png', mimeType: 'image/png' }, step: 'analyzing' });
  assert.equal((await readMealDraft('autosave')).step, 'foods');
  failedKey = 'nurturebites.meal-draft.autosave.v1'; await assert.rejects(saveMealDraft(draft)); await saveMealDraft(draft);
  assert.equal((await readMealDraft('autosave')).id, draft.id);
});
test('save failure keeps draft, retry is idempotent and home gets exactly one saved meal', async () => {
  const draft = completeDraft('final'); await saveMealDraft(draft);
  const meal = mealFromDraft(draft); failedKey = 'nurturebites.home.final.v1'; await assert.rejects(saveMeal(meal));
  assert.deepEqual((await readMealDraft('final')).foods, draft.foods);
  await saveMeal(meal); await saveMeal(meal);
  assert.equal((await readMeals('final')).length, 1); assert.deepEqual((await readMeal('final', meal.id)).foods, draft.foods);
  assert.equal(JSON.parse(values.get('nurturebites.home.final.v1')).meals.length, 1);
  assert.equal((await readMealDraft('final')).savedMealId, meal.id);
  assert.equal((await readMealDraft('final')).step, 'complete');
});
test('final save is queued after pending drafts, never overwritten by an earlier autosave', async () => {
  const draft = completeDraft('ordering');
  await Promise.all([saveMealDraft({ ...draft, step: 'foods' }), saveMeal(mealFromDraft(draft))]);
  assert.equal((await readMealDraft('ordering')).step, 'complete');
});


test('acceptance and pending suggestion links survive draft/final writes without recording a try', async () => {
  const draft = newDraft('abc-links');
  draft.mealType = 'lunch'; draft.setting = 'home';
  draft.foods = [{ ...newFood(), id: 'served', name: 'Rice', acceptance: 0, confirmed: true, source: 'ai' }];
  draft.suggestionLinks = [{ suggestionId: 'saved-idea', foodId: 'served', title: 'Rice', description: 'Offer a small portion' }];
  assert.equal(isDraft(draft, draft.childId), true);
  assert.equal(isDraft({ ...draft, foods: [{ ...draft.foods[0], acceptance: 4 }] }, draft.childId), false);
  assert.equal(isDraft({ ...draft, suggestionLinks: [{ ...draft.suggestionLinks[0], foodId: 'missing' }] }, draft.childId), false);
  await saveMealDraft(draft);
  assert.deepEqual((await readMealDraft(draft.childId)).suggestionLinks, draft.suggestionLinks);
  const saved = await saveMeal(mealFromDraft(draft));
  assert.equal(saved.foods[0].acceptance, 0);
  assert.equal(saved.foods[0].source, 'ai');
  assert.equal(saved.foods[0].confirmed, true);
  assert.deepEqual(saved.suggestionLinks, draft.suggestionLinks);
  assert.equal(saved.suggestionFeedback, undefined);
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

// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
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

// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
test('home pending meals survive an unfinished review and disappear only after final review storage', async () => {
  const { readHomeMeals } = require('../src/data/storage/homeMealStorage.ts');
  const { pendingHomeMeals } = require('../src/features/home/rules.ts');
  const { newReviewDraft, setOutcome, reviewFromDraft } = require('../src/features/after-meal-review/rules.ts');
  const { saveAfterMealDraft, saveAfterMealReview } = require('../src/data/storage/afterMealReviewStorage.ts');
  const child='home-review-lifecycle';
  const old=mealFromDraft({...completeDraft(child),id:'old-meal',mealDate:'2026-10-10'});
  const recent=mealFromDraft({...completeDraft(child),id:'recent-meal',mealDate:'2026-10-11'});
  await saveMeal(old);await saveMeal(recent);
  await saveMealDraft(completeDraft(child));
  let entries=await readHomeMeals(child);
  assert.deepEqual(pendingHomeMeals(child,entries).map(meal=>meal.id),['recent-meal','old-meal']);
  assert.deepEqual(pendingHomeMeals('different-child',entries),[]);
  const draft=newReviewDraft(recent);
  draft.step='outcomes';await saveAfterMealDraft(draft);
  assert.equal(pendingHomeMeals(child,await readHomeMeals(child)).length,2);
  draft.outcomes=setOutcome(draft.outcomes,recent.foods[0].id,'eaten');
  await saveAfterMealReview(reviewFromDraft(draft,recent));
  entries=await readHomeMeals(child);
  assert.deepEqual(pendingHomeMeals(child,entries).map(meal=>meal.id),['old-meal']);
  assert.equal((await readMeals(child)).length,2);
});

// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
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
  const { readHomeRecords } = require('../src/data/storage/homeStorage.ts');
  values.set(`nurturebites.home.${child}.v1`, JSON.stringify({ meals: [], suggestions: [], exposures: [{ stage: 'touched' }] }));
  assert.deepEqual(await readHomeRecords(child), { meals: [], suggestions: [] });
});

// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
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

// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
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
