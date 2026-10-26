// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test, beforeEach } = require('node:test');

const assert = require('node:assert/strict');

require('../helpers/register.cjs');

const { completeDraft } = require('../fixtures/meal-checkin.cjs');

const { act, renderHook, waitFor } = require('../helpers/react-harness.cjs');
const { values, failNextWrite } = require('../helpers/native-boundaries.cjs').nativeBoundaries();
const { mealResponse } = require('../fixtures/server-meal.cjs');
const { clearSession } = require('../../src/data/storage/authStorage.ts');
const { useSaveMeal } = require('../../src/data/queries/mealQueries.ts');
const { useMealList } = require('../../src/data/queries/mealLogQueries.ts');
beforeEach(async () => { values.clear(); await clearSession(); });

const { newDraft, mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');

const { newFood } = require('../../src/rules/foodDraft.ts');

const { isDraft } = require('../../src/data/storage/mealValidation.ts');

const { readMealDraft, saveMealDraft, readMeals, readMeal, saveMeal } = require('../../src/data/storage/mealStorage.ts');

const json = value => new Response(JSON.stringify(value));
const unavailable = () => new Response('{"error_code":"UNAVAILABLE"}', { status: 503 });
async function mountSaving(t) {
  const draft = { ...completeDraft('1'), mealDate: '2026-10-23' };
  await saveMealDraft(draft);
  const existing = { ...mealResponse(), id: '11', meal_date: '2026-10-22',
    foods: [{ ...mealResponse().foods[0], meal_id: '11' }] };
  const server = { items: [existing], writes: 0, reads: 0, failWrite: false, failList: false };
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname + new URL(url).search, '/api/v1/meals');
    if ((init.method ?? 'GET') === 'GET') {
      server.reads++;
      return server.failList ? unavailable() : json(server.items);
    }
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), {
      meal_date: '2026-10-23', meal_type: 'lunch', setting: 'home', before_photo_uri: null,
      foods: [{ id: '1', name: 'Rice', ingredients: [], cooking_method: null,
        serving_note: null, acceptance: null }], suggestion_links: [],
    });
    server.writes++;
    if (server.failWrite) return unavailable();
    const saved = mealResponse();
    server.items = [saved, ...server.items.filter(item => item.id !== saved.id)];
    const { foods, review, suggestion_links, ...receipt } = saved;
    return json(receipt);
  });
  const hook = await renderHook(t, () => ({ save: useSaveMeal(), list: useMealList('1', null) }));
  await waitFor(() => hook.current.list.isSuccess);
  return { hook, server, save: () => hook.current.save.mutateAsync(mealFromDraft(draft)) };
}
async function expectSaved(hook) {
  await waitFor(() => hook.current.list.isSuccess && !hook.current.list.isFetching
    && hook.current.list.data?.map(meal => meal.id).join() === '10,11');
  assert.equal(hook.current.list.data[0].foods[0].name, 'Rice');
  const receipt = await readMealDraft('1');
  assert.equal(receipt.step, 'complete');
  assert.equal(receipt.savedMealId, '10');
  assert.equal(receipt.foods[0].id, '1');
  assert.deepEqual((await readMeals('1')).map(meal => meal.id), ['10']);
  assert.equal((await readMeal('1', '10')).savedAt, '2026-10-23T00:00:00Z');
}

test('server save refreshes the active list and stores the server ID in the completion receipt', async t => {
  const { hook, server, save } = await mountSaving(t);
  assert.deepEqual(hook.current.list.data.map(meal => meal.id), ['11']);
  await act(async () => { await save(); });
  await expectSaved(hook);
  assert.equal(server.writes, 1);
  assert.equal(server.reads, 2);
});

for (const failure of ['server', 'local storage']) {
  test(`${failure} save failure preserves the list and draft; retry completes without duplicates`, async t => {
    const { hook, server, save } = await mountSaving(t);
    const before = { list: hook.current.list.data, draft: await readMealDraft('1') };
    if (failure === 'server') server.failWrite = true;
    else failNextWrite('nurturebites.home.1.v1');
    await act(async () => { await assert.rejects(save(), failure === 'server' ? /UNAVAILABLE/ : /Disk full/); });
    await waitFor(() => hook.current.save.isError);
    assert.deepEqual(hook.current.list.data, before.list);
    assert.deepEqual(await readMealDraft('1'), before.draft);
    if (failure === 'server') assert.deepEqual(await readMeals('1'), []);
    assert.equal(server.reads, 1);
    server.failWrite = false;
    await act(async () => { await save(); });
    await expectSaved(hook);
    assert.equal(JSON.parse(values.get('nurturebites.home.1.v1')).meals.length, 1);
    assert.equal(server.writes, 2);
    assert.equal(server.reads, 2);
  });
}

test('failed list refresh retains existing meals and retry displays the successful save', async t => {
  const { hook, server, save } = await mountSaving(t);
  const before = hook.current.list.data;
  server.failList = true;
  await act(async () => { await save(); });
  await waitFor(() => hook.current.list.isRefetchError);
  assert.deepEqual(hook.current.list.data, before);
  assert.equal((await readMealDraft('1')).savedMealId, '10');
  server.failList = false;
  await act(async () => { await hook.current.list.refetch(); });
  await expectSaved(hook);
  assert.equal(server.writes, 1);
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
