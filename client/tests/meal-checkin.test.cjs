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
const { newDraft, newFood, confirmFoods, mealFromDraft, toggleTrait, emptyTraits } = require('../src/features/meal-checkin/rules.ts');
const { validDate } = require('../src/util/date.ts');
const { isDraft } = require('../src/data/storage/mealValidation.ts');
const { readMealDraft, saveMealDraft, readMeals, readMeal, saveMeal } = require('../src/data/storage/mealStorage.ts');
const { recognizeMealPhoto } = require('../src/data/api/recognitionApi.ts');
function completeDraft(childId) { return { ...newDraft(childId), mealType: 'lunch', setting: 'home', foods: [{ ...newFood(), name: 'Rice' }], step: 'goal' }; }

test('valid calendar dates and trait selection cardinality', () => {
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2026-02-29'), false); assert.equal(validDate('2026-04-31'), false);
  let traits = toggleTrait(emptyTraits(), 'texture', 'soft'); traits = toggleTrait(traits, 'texture', 'crunchy');
  assert.deepEqual(traits.texture, ['soft', 'crunchy']); traits = toggleTrait(traits, 'temperature', 'warm'); traits = toggleTrait(traits, 'temperature', 'cool');
  assert.deepEqual(traits.temperature, ['cool']); assert.deepEqual(toggleTrait(traits, 'texture', 'soft').texture, ['crunchy']);
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
test('autosaves are ordered, recover edits and resume interrupted recognition safely', async () => {
  const draft = completeDraft('autosave');
  await Promise.all([saveMealDraft({ ...draft, step: 'details' }), saveMealDraft({ ...draft, step: 'foods', editingFood: { ...newFood(), name: 'Typing' } })]);
  assert.equal((await readMealDraft('autosave')).editingFood.name, 'Typing');
  await saveMealDraft({ ...draft, photo: { id: 'photo', uri: 'file:///photo.png', mimeType: 'image/png' }, step: 'analyzing' });
  assert.equal((await readMealDraft('autosave')).step, 'method');
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
test('mock recognition is cancellable and suggestions remain unconfirmed', async () => {
  const photo = { id: 'photo-test', uri: 'file:///plate.png', mimeType: 'image/png' };
  const controller = new AbortController(); const request = recognizeMealPhoto({ photo, signal: controller.signal }); controller.abort(); await assert.rejects(request);
  const result = await recognizeMealPhoto({ photo, signal: new AbortController().signal });
  assert.equal(result.photoId, photo.id); assert.equal(result.foods[0].source, 'ai');
  await assert.rejects(recognizeMealPhoto({ photo: { ...photo, mimeType: 'text/plain' }, signal: new AbortController().signal }));
});
