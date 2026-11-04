// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 빈 식사 초안의 종료·재진입·기존 기록 및 사용자 입력 보존 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../helpers/react-harness.cjs');
const { values, storage } = require('../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? { pickMealPhoto: async () => null, PhotoError: class extends Error {} } : undefined);
const { useMealCheckin } = require('../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { newDraft } = require('../../src/features/meal-checkin/rules.ts');
const { readMealDraft, saveMealDraft } = require('../../src/data/storage/mealStorage.ts');
const { mealKeys } = require('../../src/data/queries/mealQueries.ts');
const key = id => `nurturebites.meal-draft.${id}.v1`;
beforeEach(() => values.clear());

test('leaving untouched details creates no stored draft or cache entry and reopening needs no Continue', async t => {
  const h = await renderHook(t, () => useMealCheckin('empty'));
  await waitFor(() => !!h.current.draft);
  assert.equal(h.current.resumeRequired, false);
  await act(async () => assert.equal(await h.current.flush(), true));
  assert.equal(values.has(key('empty')), false);
  assert.equal(h.client.getQueryData(mealKeys.draft('empty')), null);
  const reopened = await renderHook(t, () => useMealCheckin('empty'));
  await waitFor(() => !!reopened.current.draft);
  assert.equal(reopened.current.resumeRequired, false);
});

test('date, meal type, place and later steps survive exit and restore', async t => {
  for (const patch of [{ mealDate: '2026-01-01' }, { mealType: 'lunch' }, { setting: 'home' }, { step: 'photo' }]) {
    const id = JSON.stringify(patch);
    const h = await renderHook(t, () => useMealCheckin(id));
    await waitFor(() => !!h.current.draft);
    await act(async () => { h.current.update(patch); await h.current.flush(); });
    const reopened = await renderHook(t, () => useMealCheckin(id));
    await waitFor(() => !!reopened.current.draft);
    assert.equal(reopened.current.resumeRequired, true);
    for (const [field, value] of Object.entries(patch)) assert.equal(reopened.current.draft[field], value);
  }
});

test('returning date to its initial value removes an earlier autosave in queue order', async () => {
  const draft = newDraft('reset');
  await Promise.all([saveMealDraft({ ...draft, mealDate: '2026-01-01' }), saveMealDraft(draft)]);
  assert.equal(await readMealDraft('reset'), null);
  assert.equal(values.has(key('reset')), false);
});

test('legacy empty drafts stay hidden after midnight but changed dates and unknown IDs survive', async () => {
  const draft = { ...newDraft('legacy'), id: `${new Date(2026, 9, 25, 12).getTime()}-abc`, mealDate: '2026-10-25' };
  delete draft.initialMealDate;
  values.set(key('legacy'), JSON.stringify(draft));
  assert.equal(await readMealDraft('legacy'), null);
  values.set(key('legacy'), JSON.stringify({ ...draft, mealDate: '2026-10-24' }));
  assert.equal((await readMealDraft('legacy')).mealDate, '2026-10-24');
  values.set(key('legacy'), JSON.stringify({ ...draft, id: 'unknown' }));
  assert.equal((await readMealDraft('legacy')).id, 'unknown');
  await saveMealDraft({ ...newDraft('yesterday'), initialMealDate: '2026-10-25', mealDate: '2026-10-25' });
  assert.equal(await readMealDraft('yesterday'), null);
});

test('failed removal keeps the previous draft and reports failure; retry clears it', async t => {
  const h = await renderHook(t, () => useMealCheckin('failure'));
  await waitFor(() => !!h.current.draft);
  const original = { ...h.current.draft };
  await act(async () => { h.current.update({ mealDate: '2026-01-01' }); await h.current.flush(); });
  const remove = storage.removeItem;
  const mock = t.mock.method(storage, 'removeItem', async () => { throw new Error('Storage unavailable'); });
  await act(async () => { h.current.update({ mealDate: original.mealDate }); assert.equal(await h.current.flush(), false); });
  assert.equal(h.current.saveStatus, 'error');
  assert.equal((await readMealDraft('failure')).mealDate, '2026-01-01');
  mock.mock.mockImplementation(remove);
  await act(async () => assert.equal(await h.current.flush(), true));
  assert.equal(h.current.saveStatus, 'saved');
  assert.equal(await readMealDraft('failure'), null);
});
