// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Verify reset discards pending autosaves and current onboarding fixtures
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 요청 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 요청·응답 기준으로 수정
// Connects Auth/Profile/Onboarding providers, validation, API conversion and draft storage.
// Only HTTP and native storage boundaries are mocked.
// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리 및 화면별 자동 저장·재시작·불러오기 실패 복구 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, deferred, values, storage, mountDraft, control, input, click, enter,
  mountConsent, mountChildBasics, mountAllergies, mountDietaryPattern, mountSafeFoods,
} = require('../../helpers/onboarding-screen.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { saveDraft, readDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
const { strings } = require('../../../src/util/strings.ts');
const s = strings.en;
const draftKey = 'nurturebites.onboarding.v1';
const next = app => control(app, 'button', s.common.continue);

function assertStep(app, step) {
  assert.equal(app.pathname, `/onboarding/${step}`);
  const name = app.current.draft.childName || s.onboarding.childFallback;
  const title = step === 'safe-foods' ? s.onboarding.safeFoodsTitle(name)
    : step === 'review' ? s.onboarding.reviewTitle(name) : s.onboarding.titles[step];
  assert.ok(control(app, 'heading', title));
}
async function assertSaved(app, expected) {
  await waitFor(() => app.current.saveStatus === 'saved');
  assert.deepEqual(await readDraft(), expected);
  assert.ok(app.container.textContent.includes(s.common.saved));
  assert.deepEqual(app.submissions, []);
}
async function reopen(t, app) {
  const expected = structuredClone(app.current.draft);
  await assertSaved(app, expected);
  await app.unmount();
  // 저장소만 유지한다. 화면·Provider·Query 캐시는 새로 만들고 실제 진입 화면에서 재개한다.
  const restored = await mountDraft(t);
  assert.equal(restored.pathname, '/');
  await click(control(restored, 'button', s.onboarding.resume));
  await waitFor(() => restored.pathname === `/onboarding/${expected.step}`);
  assertStep(restored, expected.step);
  assert.deepEqual(restored.current.draft, expected);
  assert.deepEqual(restored.submissions, []);
  return restored;
}

test('저장된 초안이 없으면 시작 버튼을 표시하고 동의 화면에서 새로 시작한다', async t => {
  const app = await mountDraft(t);
  assert.equal(app.container.textContent.includes(s.onboarding.resume), false);
  await click(control(app, 'button', s.onboarding.start));
  await waitFor(() => app.pathname === '/onboarding/consent');
  assertStep(app, 'consent');
  assert.deepEqual(app.current.draft.consent, emptyDraft().consent);
  assert.equal(next(app).getAttribute('aria-disabled'), 'true');
  assert.deepEqual(app.submissions, []);
});

test('일부 동의만 선택하고 다시 시작하면 선택값과 동의 단계를 복원하고 진행을 계속 차단한다', async t => {
  const app = await mountConsent(t);
  await click(control(app, 'checkbox', s.onboarding.accountPrivacy));
  await click(control(app, 'checkbox', s.onboarding.aiTraining));
  assert.deepEqual(app.current.draft.consent,
    { accountPrivacy: true, photoAnalysis: false, aiTraining: true });
  const restored = await reopen(t, app);
  assert.ok(control(restored, 'checkbox', s.onboarding.accountPrivacy));
  assert.equal(next(restored).getAttribute('aria-disabled'), 'true');
  await click(next(restored));
  assertStep(restored, 'consent');
});

test('자녀 정보를 입력하고 다시 시작하면 닉네임·연령대와 활성화된 다음 버튼을 복원한다', async t => {
  const app = await mountChildBasics(t);
  await enter(app, s.onboarding.childName, '나루');
  await click(control(app, 'button', s.onboarding.ageRange));
  await click(control(app, 'button', '4-5 years'));
  assert.equal(app.current.draft.ageRange, 'AGE_4_5');
  const restored = await reopen(t, app);
  assert.equal(input(restored, s.onboarding.childName).value, '나루');
  assert.ok(control(restored, 'button', '4-5 years'));
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
  await click(next(restored));
  await waitFor(() => restored.pathname === '/onboarding/allergies');
  assertStep(restored, 'allergies');
  await assertSaved(restored, { ...app.current.draft, step: 'allergies' });
});

test('알레르기를 복수 선택하고 다시 시작하면 선택 목록을 복원하고 다음 단계로 진행할 수 있다', async t => {
  const app = await mountAllergies(t);
  await click(control(app, 'checkbox', 'Eggs'));
  await click(control(app, 'checkbox', 'Milk / Dairy'));
  assert.deepEqual(app.current.draft.allergies, ['EGGS', 'MILK_DAIRY']);
  const restored = await reopen(t, app);
  assert.ok(control(restored, 'checkbox', 'Eggs'));
  assert.ok(control(restored, 'checkbox', 'Milk / Dairy'));
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
  await click(next(restored));
  await waitFor(() => restored.pathname === '/onboarding/restrictions');
  assertStep(restored, 'restrictions');
  await assertSaved(restored, { ...app.current.draft, step: 'restrictions' });
});

test('식이 제한 없음을 선택하고 다시 시작하면 미응답과 구분되는 없음 응답과 진행 가능 상태를 복원한다', async t => {
  const app = await mountDraft(t, { ...emptyDraft(), step: 'restrictions', allergies: ['EGGS'] });
  await click(control(app, 'checkbox', s.onboarding.noOtherRestrictions));
  assert.deepEqual(app.current.draft.restrictions, ['none']);
  const restored = await reopen(t, app);
  assert.deepEqual(restored.current.draft.allergies, ['EGGS']);
  assert.ok(control(restored, 'checkbox', s.onboarding.noOtherRestrictions));
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
  await click(next(restored));
  await waitFor(() => restored.pathname === '/onboarding/family');
  assertStep(restored, 'family');
  await assertSaved(restored, { ...app.current.draft, step: 'family' });
});

test('식생활 유형을 변경하고 다시 시작하면 이전 유형 대신 마지막 선택과 진행 가능 상태를 복원한다', async t => {
  const app = await mountDietaryPattern(t);
  await click(control(app, 'radio', 'Vegan'));
  await click(control(app, 'radio', 'Pescatarian'));
  assert.equal(app.current.draft.dietaryPattern, 'pescatarian');
  const restored = await reopen(t, app);
  assert.ok(control(restored, 'radio', 'Pescatarian'));
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
});

test('음식 없음을 선택한 채 다시 시작해도 목록·설명·작성 중 입력을 보존하고 없음 해제 시 다시 표시한다', async t => {
  const app = await mountSafeFoods(t);
  await enter(app, s.onboarding.foodName, 'Apple');
  await enter(app, s.onboarding.preparation, 'Sliced');
  await enter(app, s.onboarding.presentationNote, 'Blue bowl');
  await click(control(app, 'button', s.onboarding.addSafeFoodAction));
  await enter(app, s.onboarding.foodName, 'Banana');
  await enter(app, s.onboarding.preparation, 'Mashed');
  await enter(app, s.onboarding.presentationNote, 'Small plate');
  await click(control(app, 'checkbox', s.onboarding.noSafeFoods));
  assert.equal(app.current.draft.noSafeFoods, true);
  assert.deepEqual(app.current.draft.safeFoods.map(({ id, ...food }) => food), [
    { name: 'Apple', preparation: 'Sliced', presentationNote: 'Blue bowl' },
  ]);
  const restored = await reopen(t, app);
  assert.equal(input(restored, s.onboarding.foodName).readOnly, true);
  assert.equal(restored.container.textContent.includes('Apple'), false);
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
  await click(control(restored, 'checkbox', s.onboarding.noSafeFoods));
  assert.ok(control(restored, 'button', `${s.common.remove} Apple`));
  assert.ok(restored.container.textContent.includes('Sliced, Blue bowl'));
  for (const [label, value] of [[s.onboarding.foodName, 'Banana'],
    [s.onboarding.preparation, 'Mashed'], [s.onboarding.presentationNote, 'Small plate']]) {
    assert.equal(input(restored, label).value, value);
    assert.equal(input(restored, label).readOnly, false);
  }
  await assertSaved(restored, { ...app.current.draft, noSafeFoods: false });
});

test('검토 단계까지 이동하고 다시 시작하면 저장된 요약을 복원하고 이전 화면으로 이동한 단계도 저장한다', async t => {
  const app = await mountSafeFoods(t);
  await click(control(app, 'checkbox', s.onboarding.noSafeFoods));
  await click(next(app));
  await waitFor(() => app.pathname === '/onboarding/review');
  const restored = await reopen(t, app);
  assert.ok(restored.container.textContent.includes('나루'));
  assert.ok(restored.container.textContent.includes(s.onboarding.noSafeFoods));
  assert.notEqual(control(restored, 'button', s.onboarding.looksGood).getAttribute('aria-disabled'), 'true');
  await click(control(restored, 'button', s.common.previous));
  await waitFor(() => restored.pathname === '/onboarding/safe-foods');
  assertStep(restored, 'safe-foods');
  await assertSaved(restored, { ...app.current.draft, step: 'safe-foods' });
});

test('계정 입력을 저장하고 다시 시작하면 이름은 복원하지만 비밀번호는 저장하거나 복원하지 않는다', async t => {
  const app = await mountDraft(t, { ...emptyDraft(), step: 'account' });
  await enter(app, s.onboarding.password, 'test-only-password');
  await enter(app, s.onboarding.caregiverName, '보호자');
  assert.equal(input(app, s.onboarding.password).value, 'test-only-password');
  assert.equal('password' in await readDraft(), false);
  assert.equal(values.get(draftKey).includes('test-only-password'), false);
  const restored = await reopen(t, app);
  assert.equal(input(restored, s.onboarding.caregiverName).value, '보호자');
  assert.equal(input(restored, s.onboarding.password).value, '');
  assert.equal(restored.current.password, '');
});

test('저장된 JSON이 손상되면 원본을 덮어쓰지 않고 오류를 표시하며 복구 후 Retry로 기존 단계를 재개한다', async t => {
  values.set(draftKey, '{invalid');
  const app = await mountDraft(t);
  assert.equal(app.current.loadError, true);
  assert.ok(app.container.textContent.includes(s.common.saveFailed));
  assert.equal(values.get(draftKey), '{invalid');
  const recovered = { ...emptyDraft(), childName: '복구된 아이', step: 'child' };
  await saveDraft(recovered);
  await click(control(app, 'button', s.common.retry));
  await waitFor(() => app.current.ready && !app.current.loadError);
  await click(control(app, 'button', s.onboarding.resume));
  await waitFor(() => app.pathname === '/onboarding/child');
  assertStep(app, 'child');
  assert.equal(input(app, s.onboarding.childName).value, '복구된 아이');
  assert.deepEqual(await readDraft(), recovered);
  assert.deepEqual(app.submissions, []);
});

test('초안 읽기가 실패하면 기존 저장값을 보존하고 Retry 성공 후 같은 답변과 단계로 이어간다', async t => {
  const draft = { ...emptyDraft(), step: 'child', childName: '저장된 아이', ageRange: 'AGE_4_5' };
  await saveDraft(draft);
  const raw = values.get(draftKey);
  const read = storage.getItem.bind(storage);
  let unavailable = true;
  t.mock.method(storage, 'getItem', async key => {
    if (key === draftKey && unavailable) throw new Error('Storage unavailable');
    return read(key);
  });
  const app = await mountDraft(t);
  assert.equal(app.current.loadError, true);
  assert.ok(app.container.textContent.includes(s.common.saveFailed));
  assert.equal(values.get(draftKey), raw);
  unavailable = false;
  await click(control(app, 'button', s.common.retry));
  await waitFor(() => app.current.ready && !app.current.loadError);
  await click(control(app, 'button', s.onboarding.resume));
  await waitFor(() => app.pathname === '/onboarding/child');
  assertStep(app, 'child');
  assert.equal(input(app, s.onboarding.childName).value, '저장된 아이');
  assert.ok(control(app, 'button', '4-5 years'));
  assert.deepEqual(app.current.draft, draft);
  assert.deepEqual(await readDraft(), draft);
  assert.deepEqual(app.submissions, []);
});

test('초안을 늦게 읽어도 로딩 중 기본값으로 덮어쓰지 않고 저장된 답변을 복원한다', async t => {
  const draft = { ...emptyDraft(), step: 'child', childName: '기존 아이' };
  await saveDraft(draft);
  const raw = values.get(draftKey);
  const started = deferred();
  const release = deferred();
  const read = storage.getItem.bind(storage);
  const write = t.mock.method(storage, 'setItem');
  t.mock.method(storage, 'getItem', async key => {
    if (key === draftKey) { started.resolve(); await release.promise; }
    return read(key);
  });
  const app = await mountDraft(t, undefined, { waitUntilReady: false });
  try {
    await started.promise;
    assert.ok(app.container.textContent.includes(s.common.loading));
    assert.equal(app.container.querySelector('[role="button"]'), null);
    assert.equal(values.get(draftKey), raw);
    assert.equal(write.mock.calls.filter(call => call.arguments[0] === draftKey).length, 0);
    await act(async () => release.resolve());
    await waitFor(() => app.current.ready);
    await click(control(app, 'button', s.onboarding.resume));
    await waitFor(() => app.pathname === '/onboarding/child');
    assertStep(app, 'child');
    assert.equal(input(app, s.onboarding.childName).value, '기존 아이');
    assert.deepEqual(await readDraft(), draft);
    assert.equal(write.mock.calls.filter(call => call.arguments[0] === draftKey).length, 0);
  } finally { await act(async () => release.resolve()); }
});
