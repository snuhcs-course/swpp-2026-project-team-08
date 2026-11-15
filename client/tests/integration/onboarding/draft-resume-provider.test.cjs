// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 추가·삭제·선택 정보 초안 복원 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리·실행 환경 추출 및 계정 복원 사례 이름 한글화
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { values, mount, account, emptyDraft, readDraft, saveDraft } = require('../../helpers/onboarding-provider-harness.cjs');

test('계정 정보는 처음에만 채우고 사용자가 지운 값은 자동 저장·재시작 후에도 빈 값으로 유지한다', async () => {
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

test('초안을 복원하면 빈 값·공백 계정 정보와 이후 단계의 답변을 그대로 보존한다', async () => {
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

test('초기화 후 로그인해도 계정 정보는 한 번만 채우고 이후 지운 값을 되살리지 않는다', async () => {
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

test('로그인해도 복원된 빈 값과 로그아웃 중 지운 계정 정보를 덮어쓰지 않는다', async () => {
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
