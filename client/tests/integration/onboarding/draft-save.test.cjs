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
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, deferred, storage, failNextWrite, saveDraft, readDraft, completeDraft, mount } = require('../../helpers/onboarding-flow.cjs');

test('draft write failure is visible and retry saves the edited value', async t => {
  await saveDraft(completeDraft());
  const hook = await mount(t);
  failNextWrite('nurturebites.onboarding.v1');
  await act(async () => hook.current.onboarding.setField('childName', 'Retry child'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'error');
  assert.equal((await readDraft()).childName, 'Child 1');
  await act(async () => hook.current.onboarding.retrySave());
  assert.equal((await readDraft()).childName, 'Retry child');
});

test('reset clears draft and password without committing a profile', async t => {
  await saveDraft(completeDraft());
  const hook = await mount(t);
  await act(async () => hook.current.onboarding.setPassword('private-password'));
  await act(async () => hook.current.onboarding.resetLocal());
  assert.equal(await readDraft(), null);
  assert.equal(hook.current.onboarding.password, '');
  assert.equal(hook.current.onboarding.hasDraft, false);
  assert.equal(hook.current.profile.profile, null);
  await act(async () => hook.current.onboarding.setField('childName', 'New child'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  assert.equal((await readDraft()).childName, 'New child');
});

test('reset waits for an in-flight autosave and keeps storage empty until another edit', async t => {
  await saveDraft(completeDraft());
  const hook = await mount(t);
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
  await act(async () => hook.current.onboarding.setField('childName', 'Pending child'));
  await started.promise;
  let reset;
  await act(async () => { reset = hook.current.onboarding.resetLocal(); });
  await act(async () => { release.resolve(); await reset; });
  assert.equal(await readDraft(), null);
  assert.equal(hook.current.onboarding.hasDraft, false);
  assert.equal(hook.current.profile.profile, null);
  await act(async () => hook.current.onboarding.setField('childName', 'New child'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  assert.equal((await readDraft()).childName, 'New child');
});

const { values } = require('../../helpers/onboarding-flow.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { canFinish, isDraft } = require('../../../src/features/onboarding/rules.ts');
const { readProfile, saveProfile } = require('../../../src/data/storage/profileStorage.ts');
const { clearDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
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
    vegetarianRestrictions: ["DAIRY"],
  };
}

test("saved profile, language, and in-progress draft remain independent", async () => {
  values.clear();
  const draft = completedDraft();
  const profile = {
    ...draft,
    id: "child-1",
    updatedAt: "2026-10-08T00:00:00.000Z",
  };
  delete profile.step;
  delete profile.safeFoodInput;
  assert.equal(canFinish({ ...draft, restrictions: [] }), false);
  // 식생활 유형은 선택 사항이라 비워도 완료할 수 있다.
  assert.equal(canFinish({ ...draft, dietaryPattern: null }), true);
  assert.equal(canFinish({ ...draft, vegetarianRestrictions: [] }), true);
  assert.equal(canFinish(draft), true);
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

test("failed profile write preserves the previous profile and recoverable draft", async () => {
  values.clear();
  const draft = completedDraft();
  const oldProfile = {
    ...draft,
    id: "child-1",
    updatedAt: "2026-10-08T00:00:00.000Z",
  };
  delete oldProfile.step;
  delete oldProfile.safeFoodInput;
  await saveProfile(oldProfile);
  await saveDraft({ ...draft, step: "review" });
  failNextWrite("nurturebites.profile.v1");
  await assert.rejects(saveProfile({ ...oldProfile, childName: "Edited" }));
  assert.deepEqual(await readProfile(), oldProfile);
  assert.equal((await readDraft()).step, "review");
});
