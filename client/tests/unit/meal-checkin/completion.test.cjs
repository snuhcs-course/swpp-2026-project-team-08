// AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
// Changed: Photo persistence coverage and API runner instructions
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 mealLogApi 대신 prepareMealWrite 로 사진 저장 요청 검증
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 실제 서버 사진 저장 테스트 제거
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 완료 입력 경계·요청 변환·서버 ID 연결과 대기 중 중복 제출 검증

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name.endsWith('/mealPhotoPicker') ? {
    pickMealPhoto() { throw new Error('완료 행동은 사진 선택을 요청하지 않는다'); },
    PhotoError: class extends Error {},
  } : undefined);
const { confirmFoods, mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { prepareMealWrite, writeMeal } = require('../../../src/data/api/mealWriteApi.ts');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { useMealCheckin } = require('../../../src/features/meal-checkin/hooks/useMealCheckin.ts');
const { saveMealDraft } = require('../../../src/data/storage/mealStorage.ts');
const { completionDraft, expectedWrite, completionResponse } = require('../../fixtures/meal-completion.cjs');
const photoUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
beforeEach(() => values.clear());

function respond(t, value) {
  return t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals');
    assert.equal(init.method, 'PUT');
    return Response.json(value);
  });
}
async function start(t, draft) {
  await saveMealDraft(draft);
  const h = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => !!h.current.draft);
  await act(async () => h.current.continueDraft());
  return h;
}

test('음식이 없거나 이름이 공백이거나 날짜·식사 유형이 유효하지 않으면 저장을 거부한다', () => {
  const draft = completionDraft();
  for (const patch of [{ foods: [] }, { mealType: null }, { mealDate: '2026-13-01' },
    { foods: [{ ...draft.foods[0], name: ' \t\n ' }] }]) {
    assert.throws(() => mealFromDraft({ ...draft, ...patch }), /Invalid meal/);
  }
  const unconfirmed = [{ ...draft.foods[0], confirmed: false }];
  assert.throws(() => mealFromDraft({ ...draft, foods: unconfirmed }), /Invalid meal/);
  const confirmed = confirmFoods(unconfirmed);
  assert.equal(mealFromDraft({ ...draft, foods: confirmed }).foods[0].id, unconfirmed[0].id);
  assert.equal(unconfirmed[0].confirmed, false);
});

test('선택 입력이 없어도 저장할 수 있고, 수용도 0과 미입력은 구분해서 보낸다', () => {
  const draft = completionDraft();
  const meal = mealFromDraft({ ...draft, setting: null, foods: draft.foods.map((food, i) => ({
    ...food, ingredients: [], preparation: '', servingNote: '', acceptance: i === 0 ? 0 : null,
  })) });
  const body = prepareMealWrite(meal).body;
  assert.equal(body.setting, null);
  assert.equal(body.before_photo_uri, null);
  assert.deepEqual(body.foods, [0, null].map((acceptance, i) => ({
    name: draft.foods[i].name, ingredients: [], cooking_method: null,
    serving_note: null, acceptance, food_recommendation_ids: [],
  })));
  const detail = toMealDetail({ ...completionResponse(), setting: null });
  assert.equal(detail.setting, null);
  assert.equal(toLegacyMeal(detail).setting, null);
});

test('사진이 있으면 저장 요청에 포함하고 없으면 미첨부로 보낸다', () => {
  const draft = completionDraft();
  const meal = mealFromDraft({ ...draft, photo: { id: 'before', uri: photoUri, mimeType: 'image/png' } });
  assert.equal(meal.photo.uri, photoUri);
  assert.equal(prepareMealWrite(meal).body.before_photo_uri, photoUri);
  assert.equal(prepareMealWrite({ ...meal, photo: null }).body.before_photo_uri, null);
});

test('추천 ID는 연결된 음식에만 보내고, 저장 성공 후 연결 대상을 서버 음식 ID로 바꾼다', async t => {
  const meal = mealFromDraft(completionDraft({ linked: true }));
  const request = respond(t, completionResponse({ linked: true }));
  const saved = await writeMeal(meal);
  assert.deepEqual(JSON.parse(request.mock.calls[0].arguments[1].body), expectedWrite({ linked: true }));
  assert.equal(saved.id, '900');
  assert.deepEqual(saved.foods, meal.foods.map((food, i) => ({ ...food, id: ['901', '902'][i] })));
  assert.deepEqual(saved.suggestionLinks, [{ ...meal.suggestionLinks[0], foodId: '901' }]);
  assert.equal(saved.savedAt, '2026-11-16T09:00:00Z');
});

test('저장 응답의 식사 정보나 음식 수가 요청과 다르면 완료로 처리하지 않는다', async t => {
  const draft = completionDraft();
  const h = await start(t, draft);
  for (const patch of [{ user_id: '2' }, { meal_date: '2026-11-15' }, { meal_type: 'LUNCH' },
    { setting: 'HOME' }, { foods: completionResponse().foods.slice(0, 1) }, { meal_type: 'dinner' }]) {
    const request = respond(t, { ...completionResponse(), ...patch });
    await act(async () => assert.equal(await h.current.save(), null));
    assert.equal(h.current.error, 'save');
    assert.deepEqual(h.current.draft, draft);
    request.mock.restore();
  }
});

test('저장 응답을 기다리는 동안 다시 저장해도 요청은 한 번만 보내고 입력을 유지한다', async t => {
  const draft = completionDraft();
  const h = await start(t, draft);
  const pending = deferred();
  const request = t.mock.method(globalThis, 'fetch', () => pending.promise);
  let first;
  await act(async () => { first = h.current.save(); });
  await waitFor(() => request.mock.callCount() === 1 && h.current.saving);
  await act(async () => {
    assert.equal(await h.current.save(), null);
    h.current.update({ mealDate: '2026-11-15' });
    h.current.removeFood('rice');
  });
  assert.equal(request.mock.callCount(), 1);
  assert.equal(h.current.saving, true);
  assert.deepEqual(h.current.draft, draft);
  await act(async () => { pending.resolve(Response.json(completionResponse())); await first; });
  assert.equal(h.current.draft.step, 'complete');
  assert.equal(h.current.draft.savedMealId, '900');
});
