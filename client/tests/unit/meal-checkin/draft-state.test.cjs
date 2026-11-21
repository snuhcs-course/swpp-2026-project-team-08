// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 초안 저장값·저장 순서·최신 입력 상태·저장 및 조회 실패 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values, storage, failNextWrite } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? { pickMealPhoto: async () => null, PhotoError: class extends Error {} } : undefined);
const { newDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { readMealDraft, saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { linkingDraft, link } = require('../../fixtures/meal-suggestion-linking.cjs');
const key = 'nurturebites.meal-draft.1.v1';
beforeEach(() => values.clear());

function namedDraft(name) {
  const draft = linkingDraft();
  return { ...draft, foods: [{ ...draft.foods[0], name }] };
}
async function start(t) {
  await saveMealDraft(namedDraft('Apple'));
  const h = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => !!h.current.draft);
  return h;
}
async function failBanana(t) {
  const h = await start(t);
  failNextWrite(key);
  await act(async () => h.current.update({ foods: namedDraft('Banana').foods }));
  await waitFor(() => h.current.saveStatus === 'error');
  return h;
}
function delayWrites(t) {
  const write = storage.setItem;
  const pending = [];
  t.mock.method(storage, 'setItem', async (storageKey, value) => {
    if (storageKey === key) {
      const gate = deferred();
      pending.push({ ...gate, value: JSON.parse(value) });
      await gate.promise;
    }
    return write(storageKey, value);
  });
  t.after(async () => { for (const gate of pending) gate.resolve(); });
  return pending;
}

test('사용자 입력이 없는 기본 초안의 저장 결과는 저장값 없음이다', async () => {
  await saveMealDraft(newDraft('1'));
  assert.equal(values.has(key), false);
  assert.equal(await readMealDraft('1'), null);
});

test('식사 정보·사진·음식·추천 연결이 있는 초안의 저장 후 조회 결과는 저장 전 내용과 같다', async () => {
  const draft = linkingDraft([link(0, 'rice')]);
  await saveMealDraft(draft);
  assert.deepEqual(await readMealDraft('1'), draft);
});

test('음식 하나의 이름이 Apple인 초안과 Banana인 초안을 순서대로 저장하면 최종 저장값의 음식 이름은 Banana다', async t => {
  const pending = delayWrites(t);
  const apple = saveMealDraft(namedDraft('Apple'));
  const banana = saveMealDraft(namedDraft('Banana'));
  await waitFor(() => pending.length === 1);
  assert.equal(pending[0].value.foods[0].name, 'Apple');
  pending[0].resolve();
  await apple;
  await waitFor(() => pending.length === 2);
  assert.equal(pending[1].value.foods[0].name, 'Banana');
  pending[1].resolve();
  await banana;
  const stored = await readMealDraft('1');
  assert.equal(stored.foods.length, 1);
  assert.equal(stored.foods[0].name, 'Banana');
});

test('Apple 입력의 저장은 완료되고 Banana 입력의 저장은 대기 중이면 저장 상태는 saving이다', async t => {
  const h = await start(t);
  const pending = delayWrites(t);
  await act(async () => {
    h.current.update({ foods: namedDraft('Apple').foods });
    h.current.update({ foods: namedDraft('Banana').foods });
  });
  await waitFor(() => pending.length === 1);
  await act(async () => pending[0].resolve());
  await waitFor(() => pending.length === 2);
  assert.equal(JSON.parse(values.get(key)).foods[0].name, 'Apple');
  assert.equal(h.current.draft.foods[0].name, 'Banana');
  assert.equal(h.current.saveStatus, 'saving');
  await act(async () => pending[1].resolve());
  await waitFor(() => h.current.saveStatus === 'saved');
});

test('Banana를 입력한 초안의 저장이 실패하면 화면의 음식 이름은 Banana이고 저장 상태는 error다', async t => {
  const h = await failBanana(t);
  assert.equal(h.current.draft.foods[0].name, 'Banana');
  assert.equal(h.current.saveStatus, 'error');
  assert.equal((await readMealDraft('1')).foods[0].name, 'Apple');
});

test('저장에 실패한 Banana 초안을 다시 저장해 성공하면 저장값의 음식 이름은 Banana이고 저장 상태는 saved다', async t => {
  const h = await failBanana(t);
  await act(async () => assert.equal(await h.current.flush(), true));
  assert.equal(h.current.saveStatus, 'saved');
  assert.equal((await readMealDraft('1')).foods[0].name, 'Banana');
});

test('초안 조회가 실패하면 불러오기 오류가 설정되고 기존 저장값은 변경되지 않는다', async t => {
  await saveMealDraft(namedDraft('Banana'));
  const before = values.get(key);
  const read = storage.getItem;
  t.mock.method(storage, 'getItem', async storageKey => {
    if (storageKey === key) throw new Error('Read unavailable');
    return read(storageKey);
  });
  const h = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => h.current.loadError);
  assert.equal(h.current.draft, null);
  assert.equal(values.get(key), before);
});
