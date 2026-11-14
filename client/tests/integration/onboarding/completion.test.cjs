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
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, deferred, saveDraft, readDraft, profileResponse, completeDraft, mount } = require('../../helpers/onboarding-flow.cjs');

test('invalid draft cannot finish or send a profile write', async t => {
  let writes = 0;
  const hook = await mount(t, () => { writes++; throw new Error('Unexpected write'); });
  await act(async () => assert.equal(await hook.current.onboarding.finish(), false));
  assert.equal(writes, 0);
  assert.equal(hook.current.profile.profile, null);
});

for (const aiTraining of [false, true]) {
  test(`successful completion restores vegetarian restrictions and all consents (AI training: ${aiTraining})`, async t => {
    const draft = completeDraft();
    draft.consent.aiTraining = aiTraining;
    await saveDraft(draft);
    const hook = await mount(t, body => {
      assert.deepEqual(body.profile.restrictions, ['ALLERGY.NONE', 'VEGETARIAN.EGGS']);
      assert.deepEqual(body.consents, [
        { kind: 'ACCOUNT_PRIVACY', granted: true },
        { kind: 'PHOTO_ANALYSIS', granted: true },
        { kind: 'AI_TRAINING', granted: aiTraining },
      ]);
      return new Response(JSON.stringify(profileResponse('1', { aiTraining })));
    });
    await act(async () => assert.equal(await hook.current.onboarding.finish(), true));
    await waitFor(() => hook.current.profile.profile?.id === '1');
    assert.deepEqual(hook.current.profile.profile.vegetarianRestrictions, ['EGGS']);
    assert.deepEqual(hook.current.profile.profile.consent,
      { accountPrivacy: true, photoAnalysis: true, aiTraining });
    assert.equal(await readDraft(), null);
    assert.equal(hook.current.onboarding.hasDraft, false);
  });
}

test('failed completion preserves the draft and retry commits profile before clearing it', async t => {
  // Arrange: a complete stored draft and a failing HTTP boundary.
  await saveDraft(completeDraft());
  let fail = true;
  const hook = await mount(t, body => {
    assert.equal(body.profile.child_name, 'Child 1');
    assert.deepEqual(body.profile.restrictions, ['ALLERGY.NONE', 'VEGETARIAN.EGGS']);
    assert.deepEqual(body.consents, [
      { kind: 'ACCOUNT_PRIVACY', granted: true },
      { kind: 'PHOTO_ANALYSIS', granted: true },
      { kind: 'AI_TRAINING', granted: false },
    ]);
    return fail ? new Response('{}', { status: 503 }) : new Response(JSON.stringify(profileResponse()));
  });
  // Act/Assert: failure keeps recoverable data and does not publish a profile.
  await act(async () => assert.equal(await hook.current.onboarding.finish(), false));
  assert.equal(hook.current.onboarding.saveStatus, 'error');
  const retained = await readDraft();
  assert.equal(retained.childName, 'Child 1');
  assert.deepEqual(retained.vegetarianRestrictions, ['EGGS']);
  assert.deepEqual(retained.consent, { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.equal(hook.current.profile.profile, null);
  fail = false;
  await act(async () => assert.equal(await hook.current.onboarding.finish(), true));
  await waitFor(() => hook.current.profile.profile?.id === '1');
  assert.equal(hook.current.profile.profile.childName, 'Child 1');
  assert.deepEqual(hook.current.profile.profile.vegetarianRestrictions, ['EGGS']);
  assert.deepEqual(hook.current.profile.profile.consent,
    { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.equal(await readDraft(), null);
  assert.equal(hook.current.onboarding.hasDraft, false);
});

test('duplicate finish calls share the in-progress guard and submit only once', async t => {
  await saveDraft(completeDraft());
  const response = deferred();
  const started = deferred();
  let writes = 0;
  const hook = await mount(t, () => { writes++; started.resolve(); return response.promise; });
  let first;
  await act(async () => { first = hook.current.onboarding.finish(); await started.promise; });
  await act(async () => assert.equal(await hook.current.onboarding.finish(), false));
  await act(async () => { response.resolve(new Response(JSON.stringify(profileResponse()))); assert.equal(await first, true); });
  assert.equal(writes, 1);
  assert.equal(await readDraft(), null);
});
