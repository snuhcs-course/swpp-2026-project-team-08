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
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Repair onboarding imports and connect the shared storage mock; Dietary Pattern
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: family 단계를 vegetarian 으로, 채식 제한을 선택 사항으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)를 선택 사항으로 되돌려 수정
// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리 및 현재 초안 저장·실패 재시도·연속 입력 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, deferred, storage, values, failNextWrite, mountDraft,
  control, input, click, enter } = require('../../helpers/onboarding-screen.cjs');
const { saveDraft, readDraft, clearDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
const { strings } = require('../../../src/util/strings.ts');
const s = strings.en;
const draftKey = 'nurturebites.onboarding.v1';

test('자동 저장이 실패해도 입력과 이전 저장값을 보존하고 Retry로 최신 입력만 저장한다', async t => {
  const app = await mountDraft(t, { ...completedDraft(), step: 'child' });
  failNextWrite(draftKey);
  await enter(app, s.onboarding.childName, '첫 수정');
  await waitFor(() => app.container.textContent.includes(s.common.saveFailed));
  assert.equal((await readDraft()).childName, 'Child');
  assert.equal(input(app, s.onboarding.childName).value, '첫 수정');
  assert.equal(app.container.textContent.includes(s.common.saved), false);

  failNextWrite(draftKey);
  await enter(app, s.onboarding.childName, '최신 수정');
  await waitFor(() => app.current.saveStatus === 'error');
  assert.equal(input(app, s.onboarding.childName).value, '최신 수정');
  assert.equal((await readDraft()).childName, 'Child');
  await click(control(app, 'button', s.common.retry));
  await waitFor(() => app.container.textContent.includes(s.common.saved));
  assert.equal((await readDraft()).childName, '최신 수정');
  assert.equal((await readDraft()).step, 'child');
  assert.equal(app.container.textContent.includes(s.common.saveFailed), false);
  assert.equal(app.pathname, '/onboarding/child');
  assert.deepEqual(app.submissions, []);
  assert.equal(app.profile, null);
});

test('저장 응답을 기다리는 동안 저장 중을 표시하고 쓰기가 성공한 뒤에만 자동 저장 완료를 표시한다', async t => {
  const app = await mountDraft(t, { ...completedDraft(), step: 'child' });
  const started = deferred();
  const release = deferred();
  const write = storage.setItem.bind(storage);
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === draftKey) { started.resolve(); await release.promise; }
    await write(key, value);
  });
  try {
    await enter(app, s.onboarding.childName, '저장 대기');
    await started.promise;
    assert.ok(app.container.textContent.includes(s.common.saving));
    assert.equal(app.container.textContent.includes(s.common.saved), false);
    assert.equal((await readDraft()).childName, 'Child');
    assert.equal(input(app, s.onboarding.childName).value, '저장 대기');
    await act(async () => release.resolve());
    await waitFor(() => app.container.textContent.includes(s.common.saved));
    assert.equal((await readDraft()).childName, '저장 대기');
  } finally { await act(async () => release.resolve()); }
});

test('연속 입력의 이전 저장이 끝나도 최신 입력이 저장될 때까지 저장 중 표시를 유지한다', async t => {
  const app = await mountDraft(t, { ...completedDraft(), step: 'child' });
  const first = deferred();
  const latest = deferred();
  const latestStarted = deferred();
  const write = storage.setItem.bind(storage);
  let writes = 0;
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === draftKey) {
      writes += 1;
      if (writes === 1) await first.promise;
      else { latestStarted.resolve(); await latest.promise; }
    }
    await write(key, value);
  });
  try {
    await enter(app, s.onboarding.childName, '이전 입력');
    await waitFor(() => writes === 1);
    await enter(app, s.onboarding.childName, '최신 입력');
    await act(async () => { first.resolve(); await latestStarted.promise; });
    assert.equal((await readDraft()).childName, '이전 입력');
    assert.equal(input(app, s.onboarding.childName).value, '최신 입력');
    const pendingDisplay = {
      saving: app.container.textContent.includes(s.common.saving),
      saved: app.container.textContent.includes(s.common.saved),
    };
    await act(async () => latest.resolve());
    await waitFor(() => app.container.textContent.includes(s.common.saved));
    assert.equal((await readDraft()).childName, '최신 입력');
    assert.deepEqual(pendingDisplay, { saving: true, saved: false },
      '최신 입력을 쓰는 중에는 이전 저장의 완료 알림이 저장 중 표시를 지우면 안 된다');
  } finally {
    await act(async () => { first.resolve(); latest.resolve(); });
  }
});

test('이전 저장이 실패해도 최신 입력의 저장 중 표시를 유지하고 성공하면 완료로 바뀐다', async t => {
  const app = await mountDraft(t, { ...completedDraft(), step: 'child' });
  const first = deferred();
  const latest = deferred();
  const latestStarted = deferred();
  const write = storage.setItem.bind(storage);
  let writes = 0;
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === draftKey) {
      writes += 1;
      if (writes === 1) { await first.promise; throw new Error('Disk full'); }
      latestStarted.resolve();
      await latest.promise;
    }
    await write(key, value);
  });
  try {
    await enter(app, s.onboarding.childName, '이전 입력');
    await waitFor(() => writes === 1);
    await enter(app, s.onboarding.childName, '최신 입력');
    await act(async () => { first.resolve(); await latestStarted.promise; });
    assert.equal((await readDraft()).childName, 'Child');
    assert.equal(input(app, s.onboarding.childName).value, '최신 입력');
    assert.ok(app.container.textContent.includes(s.common.saving));
    assert.equal(app.container.textContent.includes(s.common.saved), false);
    assert.equal(app.container.textContent.includes(s.common.saveFailed), false);
    await act(async () => latest.resolve());
    await waitFor(() => app.container.textContent.includes(s.common.saved));
    assert.equal((await readDraft()).childName, '최신 입력');
    assert.equal(app.container.textContent.includes(s.common.saving), false);
    assert.equal(app.container.textContent.includes(s.common.saveFailed), false);
  } finally {
    await act(async () => { first.resolve(); latest.resolve(); });
  }
});

test('초안을 초기화하면 비밀번호·저장값을 지우고 새 입력 전까지 프로필과 초안을 만들지 않는다', async t => {
  const app = await mountDraft(t, { ...completedDraft(), step: 'review' });
  await act(async () => app.current.setPassword('private-password'));
  await act(async () => app.current.resetLocal());
  assert.equal(await readDraft(), null);
  assert.equal(app.current.password, '');
  assert.equal(app.current.hasDraft, false);
  assert.equal(app.profile, null);
  await act(async () => app.current.setField('childName', 'New child'));
  await waitFor(() => app.current.saveStatus === 'saved');
  assert.equal((await readDraft()).childName, 'New child');
});

test('저장 도중 초기화해도 늦게 끝난 저장이 초안을 되살리지 않고 다음 입력부터 새로 저장한다', async t => {
  const app = await mountDraft(t, { ...completedDraft(), step: 'review' });
  const started = deferred();
  const release = deferred();
  const write = storage.setItem.bind(storage);
  t.mock.method(storage, 'setItem', async (key, value) => {
    if (key === 'nurturebites.onboarding.v1') {
      started.resolve();
      await release.promise;
    }
    await write(key, value);
  });
  await act(async () => app.current.setField('childName', 'Pending child'));
  await started.promise;
  let reset;
  await act(async () => { reset = app.current.resetLocal(); });
  await act(async () => { release.resolve(); await reset; });
  assert.equal(await readDraft(), null);
  assert.equal(app.current.hasDraft, false);
  assert.equal(app.profile, null);
  await act(async () => app.current.setField('childName', 'New child'));
  await waitFor(() => app.current.saveStatus === 'saved');
  assert.equal((await readDraft()).childName, 'New child');
});

const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { isDraft } = require('../../../src/features/onboarding/rules.ts');
const { readProfile, saveProfile } = require('../../../src/data/storage/profileStorage.ts');
const { readLanguage, saveLanguage } = require('../../../src/data/storage/languageStorage.ts');

function completedDraft() {
  return {
    ...emptyDraft(),
    caregiverName: "Parent",
    caregiverEmail: "parent@example.com",
    childName: "Child",
    ageRange: "AGE_2_3",
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ["none"],
    restrictions: ["none"],
    vegetarianRestrictions: ["DAIRY"], noSafeFoods: true,
  };
}

test("작성 중 초안을 지워도 저장된 프로필과 언어는 유지한다", async () => {
  values.clear();
  const draft = completedDraft();
  const profile = {
    ...draft,
    id: "child-1",
    updatedAt: "2026-10-08T00:00:00.000Z",
  };
  delete profile.step;
  delete profile.safeFoodInput;
  await saveProfile(profile);
  await saveLanguage("ko");
  await saveDraft({ ...draft, step: "review" });
  assert.equal((await readProfile()).id, "child-1");
  assert.equal(await readLanguage(), "ko");
  assert.equal(isDraft(await readDraft()), true);
  await clearDraft();
  assert.equal(await readDraft(), null);
  assert.deepEqual(await readProfile(), profile);
});
