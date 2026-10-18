// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; verify manual food and outcome entry
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
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
const { newFood, emptyTraits } = require('../src/rules/foodDraft.ts');
const { toggleFoodTrait } = require('../src/rules/foodTraits.ts');
const { validDate } = require('../src/util/date.ts');
const { isDraft } = require('../src/data/storage/mealValidation.ts');
const { readMealDraft, saveMealDraft, readMeals, readMeal, saveMeal } = require('../src/data/storage/mealStorage.ts');
function completeDraft(childId) { return { ...newDraft(childId), mealType: 'lunch', setting: 'home', foods: [{ ...newFood(), name: 'Rice' }], step: 'goal' }; }

test('valid calendar dates and trait selection cardinality', () => {
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2026-02-29'), false); assert.equal(validDate('2026-04-31'), false);
  let traits = toggleFoodTrait(emptyTraits(), 'texture', 'soft'); traits = toggleFoodTrait(traits, 'texture', 'crunchy');
  assert.deepEqual(traits.texture, ['soft', 'crunchy']); traits = toggleFoodTrait(traits, 'temperature', 'warm'); traits = toggleFoodTrait(traits, 'temperature', 'cool');
  assert.deepEqual(traits.temperature, ['cool']); assert.deepEqual(toggleFoodTrait(traits, 'texture', 'soft').texture, ['crunchy']);
});
test('unconfirmed AI and incomplete/empty meals cannot be saved', () => {
  const draft = completeDraft('rules'); draft.foods[0].source = 'ai'; assert.throws(() => mealFromDraft(draft));
  const foods = confirmFoods(draft.foods); assert.equal(foods[0].id, draft.foods[0].id); assert.equal(draft.foods[0].source, 'ai');
  assert.equal(mealFromDraft({ ...draft, foods }).foods[0].source, 'parent');
  for (const patch of [{ foods: [] }, { mealType: null }, { setting: null }, { mealDate: '2026-13-01' }, { exposureFoodId: 'missing' }]) assert.throws(() => mealFromDraft({ ...draft, foods, ...patch }));
});
test('stored input is validated, including nested traits and child ownership', () => {
  const draft = completeDraft('validate'); assert.equal(isDraft(draft, 'validate'), true); assert.equal(isDraft(draft, 'other-child'), false);
  assert.equal(isDraft({ ...draft, foods: [{ ...draft.foods[0], traits: { ...emptyTraits(), smell: ['mild', 'strong'] } }] }, 'validate'), false);
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
  const draft = completeDraft('final'); draft.exposureFoodId = draft.foods[0].id; await saveMealDraft(draft);
  const meal = mealFromDraft(draft); failedKey = 'nurturebites.home.final.v1'; await assert.rejects(saveMeal(meal));
  assert.equal((await readMealDraft('final')).exposureFoodId, draft.foods[0].id);
  await saveMeal(meal); await saveMeal(meal);
  assert.equal((await readMeals('final')).length, 1); assert.equal((await readMeal('final', meal.id)).exposureFoodId, draft.foods[0].id);
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
  draft.foods = [{ ...newFood(), id: 'served', name: 'Rice', acceptance: 0, confirmed: true, origin: 'ai' }];
  draft.suggestionLinks = [{ suggestionId: 'saved-idea', foodId: 'served', title: 'Rice', description: 'Offer a small portion' }];
  assert.equal(isDraft(draft, draft.childId), true);
  assert.equal(isDraft({ ...draft, foods: [{ ...draft.foods[0], acceptance: 4 }] }, draft.childId), false);
  assert.equal(isDraft({ ...draft, suggestionLinks: [{ ...draft.suggestionLinks[0], foodId: 'missing' }] }, draft.childId), false);
  await saveMealDraft(draft);
  assert.deepEqual((await readMealDraft(draft.childId)).suggestionLinks, draft.suggestionLinks);
  const saved = await saveMeal(mealFromDraft(draft));
  assert.equal(saved.foods[0].acceptance, 0);
  assert.equal(saved.foods[0].origin, 'ai');
  assert.deepEqual(saved.suggestionLinks, draft.suggestionLinks);
  assert.equal(saved.suggestionFeedback, undefined);
});

test('new food is blank and unconfirmed legacy photo fixtures cannot become caregiver foods', async () => {
  const fresh = newFood();
  assert.equal(fresh.name, ''); assert.deepEqual(fresh.ingredients, []);
  assert.equal(fresh.preparation, ''); assert.equal(fresh.servingNote, '');
  assert.equal(fresh.acceptance ?? null, null); assert.equal(fresh.source, 'parent');
  const draft = completeDraft('legacy-manual');
  const ai = { ...newFood(), id: 'legacy-ai', name: 'Rolled omelet', source: 'ai' };
  const confirmedAI = { ...ai, id: 'confirmed-ai', confirmed: true };
  draft.foods.push(ai, confirmedAI); draft.editingFood = ai;
  draft.suggestionLinks = [{ suggestionId: 'old', foodId: ai.id, title: 'Old', description: 'Old link' }];
  draft.exposureFoodId = ai.id;
  await saveMealDraft(draft);
  const restored = await readMealDraft(draft.childId);
  assert.deepEqual(restored.foods.map((food) => food.id), [draft.foods[0].id, confirmedAI.id]);
  assert.equal(restored.editingFood, null); assert.deepEqual(restored.suggestionLinks, []);
  assert.equal(restored.exposureFoodId, null);
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
