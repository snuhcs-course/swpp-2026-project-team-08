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
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Resume migrated legacy steps into the current onboarding flow
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, deferred, values, storage, mountDraft, control, input, click, enter,
  mountConsent, mountChildBasics, mountAllergies, mountDietaryPattern,
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
    : step === 'sensory' ? s.sensory.title
      : step === 'refused-foods' ? s.refusedFoods.title(name)
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
  const restoredDraft = require('../../../src/features/onboarding/rules.ts').restoreDraft(expected);
  await assertSaved(app, expected);
  await app.unmount();
  // 저장소만 유지한다. 화면·Provider·Query 캐시는 새로 만들고 실제 진입 화면에서 재개한다.
  const restored = await mountDraft(t);
  assert.equal(restored.pathname, '/');
  await click(control(restored, 'button', s.onboarding.resume));
  await waitFor(() => restored.pathname === `/onboarding/${restoredDraft.step}`);
  assertStep(restored, restoredDraft.step);
  assert.deepEqual(restored.current.draft, restoredDraft);
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
  await waitFor(() => restored.pathname === '/onboarding/family');
  assertStep(restored, 'family');
  assert.deepEqual(restored.current.draft.restrictions, []);
});

test('식생활 단계 초안은 이전 제한 답변과 함께 복원한다', async t => {
  const app = await mountDraft(t, { ...emptyDraft(), step: 'family', allergies: ['EGGS'], restrictions: ['none'] });
  const restored = await reopen(t, app);
  assert.deepEqual(restored.current.draft.allergies, ['EGGS']);
  assert.deepEqual(restored.current.draft.restrictions, ['none']);
  assertStep(restored, 'family');
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
  await click(next(restored));
  await waitFor(() => restored.pathname === '/onboarding/sensory');
  assertStep(restored, 'sensory');
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

test('감각 프로필 단계 초안은 입력한 텍스처와 설명을 복원한다', async t => {
  const legacy = { ...emptyDraft(), step: 'sensory', caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: '나루', ageRange: 'AGE_4_5', allergies: ['none'],
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    sensoryTextures: ['hardness.hard'], sensoryNote: 'Likes crisp food' };
  const legacyApp = await mountDraft(t, legacy);
  const restored = await reopen(t, legacyApp);
  assertStep(restored, 'sensory');
  assert.deepEqual(restored.current.draft.sensoryTextures, legacy.sensoryTextures);
  assert.equal(restored.current.draft.sensoryNote, legacy.sensoryNote);
  assert.notEqual(next(restored).getAttribute('aria-disabled'), 'true');
});

test('검토 단계 재시작 후 이전 화면으로 이동하면 거부 음식 입력을 보존한다', async t => {
  const app = await mountDraft(t, { ...emptyDraft(), step: 'review', childName: '나루', ageRange: 'AGE_4_5',
    caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false }, allergies: ['none'],
    refusedFoods: [{ id: 'peas', name: 'Peas', cookingMethod: null, reasons: [] }] });
  await waitFor(() => app.pathname === '/onboarding/review');
  const restored = await reopen(t, app);
  assert.ok(restored.container.textContent.includes('나루'));
  assert.ok(restored.container.textContent.includes('Peas'));
  assert.notEqual(control(restored, 'button', s.onboarding.looksGood).getAttribute('aria-disabled'), 'true');
  await click(control(restored, 'button', s.common.previous));
  await waitFor(() => restored.pathname === '/onboarding/refused-foods');
  assertStep(restored, 'refused-foods');
  assert.deepEqual(restored.current.draft.refusedFoods, app.current.draft.refusedFoods);
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
