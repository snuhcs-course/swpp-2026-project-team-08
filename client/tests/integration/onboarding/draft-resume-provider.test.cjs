// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 추가·삭제·선택 정보 초안 복원 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { values, mount, account, emptyDraft, readDraft, saveDraft } = require('../../helpers/onboarding-provider-harness.cjs');

test('a fresh signed-in draft is prefilled once and cleared account fields stay empty through autosave and remount', async () => {
  values.clear();
  const harness = mount();
  let model = await harness.flush();
  assert.equal(model.ready, true);
  assert.equal(model.draft.caregiverName, account.user.fullName);
  assert.equal(model.draft.caregiverEmail, account.user.email);
  model.setField('caregiverEmail', '');
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal(model.canContinue('account'), false);
  assert.equal((await readDraft()).caregiverEmail, '');

  model.setField('caregiverName', '');
  model.setField('childName', 'Child');
  model.setField('ageRange', '4-5');
  model.setStep('child');
  model = await harness.flush();
  assert.equal(model.draft.caregiverName, '');
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal((await readDraft()).childName, 'Child');
  harness.unmount();

  const restored = await mount().flush();
  assert.equal(restored.draft.step, 'child');
  assert.equal(restored.draft.caregiverName, '');
  assert.equal(restored.draft.caregiverEmail, '');
});

test('restoration preserves empty and whitespace account fields alongside later answers', async () => {
  for (const email of ['', '   ']) {
    values.clear();
    const draft = { ...emptyDraft(), caregiverEmail: email, step: 'safe-foods', childName: 'Child' };
    await saveDraft(draft);
    const harness = mount();
    const model = await harness.flush();
    assert.deepEqual(model.draft, draft);
    assert.equal(model.hasDraft, true);
    assert.equal(model.canContinue('account'), false);
    harness.unmount();
  }
});

test('signing in after fresh signed-out initialization still prefills the account once', async () => {
  values.clear();
  const harness = mount(null);
  let model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  harness.profileState.status = 'loading';
  harness.auth.session = account;
  model = await harness.flush();
  assert.equal(model.ready, false);
  harness.profileState.status = 'ready';
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, account.user.email);
  model.setField('caregiverEmail', '');
  await harness.flush();
  harness.auth.session = { ...account, user: { ...account.user } };
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal((await readDraft()).caregiverEmail, '');
});

test('signing in preserves restored blanks and account fields already edited while signed out', async () => {
  for (const restored of [true, false]) {
    values.clear();
    if (restored) await saveDraft({ ...emptyDraft(), step: 'child' });
    const harness = mount(null);
    let model = await harness.flush();
    if (!restored) {
      model.setField('caregiverEmail', 'temporary@example.com');
      model.setField('caregiverEmail', '');
      await harness.flush();
    }
    harness.auth.session = account;
    model = await harness.flush();
    assert.equal(model.draft.caregiverEmail, '');
    assert.equal(model.draft.caregiverName, '');
    harness.unmount();
  }
});
