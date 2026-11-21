// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 빈 식사 초안의 종료·재진입·기존 기록 및 사용자 입력 보존 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 자동 유형과 다른 사용자 선택의 초안 보존 기대

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values, storage } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? { pickMealPhoto: async () => null, PhotoError: class extends Error {} } : undefined);
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { newDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { mealKeys } = require('../../../src/data/queries/mealQueries.ts');
const key = id => `nurturebites.meal-draft.${id}.v1`;
beforeEach(() => values.clear());

test('기본 정보를 바꾸지 않고 나가면 초안과 캐시를 남기지 않고 다시 열 때 이어하기를 요구하지 않는다', async t => {
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

test('변경한 날짜·식사 유형·장소·진행 단계는 나갔다가 다시 열어도 유지된다', async t => {
  for (const patch of [{ mealDate: '2026-01-01' }, { mealType: 'lunch' }, { setting: 'home' }, { step: 'photo' }]) {
    const id = JSON.stringify(patch);
    const h = await renderHook(t, () => useMealCheckin(id));
    await waitFor(() => !!h.current.draft);
    if ('mealType' in patch) patch.mealType = h.current.draft.mealType === 'lunch' ? 'dinner' : 'lunch';
    await act(async () => { h.current.update(patch); await h.current.flush(); });
    const reopened = await renderHook(t, () => useMealCheckin(id));
    await waitFor(() => !!reopened.current.draft);
    assert.equal(reopened.current.resumeRequired, true);
    for (const [field, value] of Object.entries(patch)) assert.equal(reopened.current.draft[field], value);
  }
});

test('날짜를 기본값으로 되돌리면 앞서 요청한 자동 저장이 끝난 뒤 빈 초안을 삭제한다', async () => {
  const draft = newDraft('reset');
  await Promise.all([saveMealDraft({ ...draft, mealDate: '2026-01-01' }), saveMealDraft(draft)]);
  assert.equal(await readMealDraft('reset'), null);
  assert.equal(values.has(key('reset')), false);
});

test('이전 형식의 빈 초안은 날짜가 바뀌어도 표시하지 않고 변경된 날짜나 알 수 없는 식별자의 초안은 보존한다', async () => {
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

test('빈 초안 삭제에 실패하면 기존 초안과 오류 상태를 유지하고 재시도에 성공하면 삭제한다', async t => {
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
